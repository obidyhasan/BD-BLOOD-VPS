# HOSTINGER VPS DEPLOYMENT GUIDE

Exact, repository-specific deployment procedure for **BD Blood** on a Hostinger
VPS running Ubuntu, Docker, Docker Compose and Nginx (reverse proxy + HTTPS).

This guide reflects the **actual** repository layout:

| Piece | Location |
| --- | --- |
| Monorepo root | `/home/deploy/bd-blood` (clone target) |
| Production Compose | `docker-compose.yml` (single source of truth) + `docker-compose.prod.yml` (thin production wrapper) |
| Frontend `web` Dockerfile | `apps/web/Dockerfile` (Next.js 16 `output: "standalone"`) |
| Backend `api` Dockerfile | `apps/api/Dockerfile` (Express 5 + Prisma 7) |
| Reverse proxy | `infrastructure/nginx/` (Nginx 1.27, Let's Encrypt via Certbot) |
| Production env template | `.env.production.example` |
| Deploy script | `scripts/deploy-production.sh` |
| Rollback script | `scripts/rollback-production.sh` |
| Required reference seed (one-shot) | `scripts/seed-production.sh` |
| Backup / Restore | `scripts/backup-postgres.sh`, `scripts/restore-postgres.sh`, `scripts/install-backup-cron.sh` |
| Certificate renewal | `scripts/renew-certificates.sh` |
| CI | `.github/workflows/ci.yml` |
| CD | `.github/workflows/deploy.yml` |
| Copy/paste commands | see [`HOSTINGER_VPS_COMMANDS.md`](HOSTINGER_VPS_COMMANDS.md) |
| Go-live checklist | see [`HOSTINGER_VPS_DEPLOYMENT_CHECKLIST.md`](HOSTINGER_VPS_DEPLOYMENT_CHECKLIST.md) |

---

## Final Architecture

```text
Internet
   │  :80 / :443  (Nginx: bdblood-proxy — the ONLY public ingress)
   ▼
┌──────────────────────────────────────────────────────────┐
│ nginx (bdblood-proxy)                                    │
│   • http → https redirect                                │
│   • https://example.com        → web:3000 (Next.js)      │
│   • https://api.example.com    → api:5000 (Express)      │
│   • /socket.io/* websocket upgrade → api:5000            │
│   • security headers, rate limits, TLS                   │
└──────────────────────────────────────────────────────────┘
        │ edge (public-only network)
        ├──────────────┐
        ▼              ▼
   web (3000)      api (5000)
                     │
   worker (timers: message-outbox SMS + donor cooldown sweeper)
        └──────── data (internal, no outside route) ────────┘
        ▼              ▼
   postgres (5432)  redis (6379)
```

- Only `nginx` publishes host ports `80` and `443`.
- `web`, `api`, `worker` communicate over the private `edge`/`data` Docker
  networks; **PostgreSQL and Redis are never exposed publicly** (`data` is an
  `internal: true` network).
- `postgres` and `redis` run with `restart: unless-stopped` and named volumes
  (`postgres_data`, `redis_data`), so **data survives container recreation and
  VPS reboots**.
- `worker` runs the durable jobs (SMS message-outbox + donor-cooldown sweep).
  It is intentionally a **separate container** so API replicas never duplicate
  those timers.

---

## Required VPS Specification

Services inside Docker (all on one VPS):

| Service | Typical memory ceiling (set in `.env.production`) |
| --- | --- |
| postgres | 1 GB |
| redis | 256 MB |
| api | 768 MB |
| worker | 512 MB |
| web (Next.js) | 768 MB |
| nginx | 256 MB |
| migrate / seed (one-shot) | 512–768 MB |

**Recommended baseline: Hostinger KVM 4 GB RAM / 2 vCPU / 80 GB NVMe**
(a `KVM 2` 8 GB plan gives comfortable headroom for Prisma migrations + the
`next build` on the VPS). Ubuntu **22.04 LTS** (or 24.04 LTS).

---

## Domains

The platform assumes **two domains / subdomains**:

| Purpose | Example | Compose variable |
| --- | --- | --- |
| Frontend (web) | `bdblood.org` (+ `www.`) | `APP_DOMAIN` |
| API + Socket.IO | `api.bdblood.org` | `API_DOMAIN` |

> Because the auth cookie is shared between the app and the API subdomain, the
> cookie domain is `.bdblood.org` (`AUTH_COOKIE_DOMAIN`). You cannot run the
> frontend and API on the same host with a plain cross-origin setup without
> that cookie scope.

Replace every `example.com` occurrence in `.env.production` with your real
domains before deploying.

---

## DNS

Create these records in your Hostinger DNS zone (pointing at the **VPS public
IP**):

```text
A      @           → VPS_IP
A      www         → VPS_IP
A      api         → VPS_IP
```

(Optionally `AAAA` records if your VPS has IPv6 and you want HTTPS over v6.)

---

## Ports

Public (firewall → allow):

| Port | Protocol | Purpose |
| --- | --- | --- |
| 22 | TCP | SSH (restrict to your IP if possible) |
| 80 | TCP | HTTP — ACME / redirect |
| 443 | TCP | HTTPS |

All other ports (5432, 6379, 3000, 5000) are **never opened publicly** — they
only exist inside the private Docker network.

---

## VPS Initial Setup

See the full copy/paste sequence in
[HOSTINGER_VPS_COMMANDS.md — sections C–F](HOSTINGER_VPS_COMMANDS.md).

Highlights:

1. SSH in as `root`.
2. Create a non-root deploy user `deploy`, add to `docker` group.
3. Install Docker Engine + Compose plugin (official Docker apt repo) and enable
   at boot (`systemctl enable --now docker`).
4. Configure `ufw`/firewall: allow `22`, `80`, `443`; deny everything else.
5. Add your SSH public key for `deploy`.
6. Clone the repository into `/home/deploy/bd-blood`.
7. Create `.env.production` from the example and fill in **real** secrets.
8. Run the first deployment (migration + required reference seed + services).

---

## Docker Installation

Standard official Docker install script steps are in the commands guide
(section D). Always verify afterward:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker deploy
docker --version
docker compose version
```

---

## Repository / Registry Setup

**Chosen deployment strategy: build-on-VPS.**

- GitHub Actions CD (`deploy.yml`) SSHes into the VPS, pulls the exact commit,
  and runs `scripts/deploy-production.sh`.
- Images are **tagged with the git commit SHA** (`IMAGE_TAG=<sha>`), built on
  the VPS, and referenced by that tag so a rollback is a re-deploy of an older
  SHA (no `latest` reliance).
- No GHCR registry is required for this repository size; building on the VPS
  keeps the pipeline simple and avoids registry credentials. If you later add
  many replicas/servers, migrate to GHCR (see [Moving to a
  Registry](#moving-to-a-registry-optional) below).

---

## Production Environment

`.env.production` is the **only** secret file and lives **only on the VPS**
(never in Git — it is `.gitignore`d).

Required variables (see `.env.production.example` for the full list with
comments):

| Group | Variables |
| --- | --- |
| App/domains | `APP_DOMAIN`, `API_DOMAIN`, `CERTBOT_EMAIL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `FRONTEND_URL` |
| DB | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL` |
| Redis | `REDIS_PASSWORD` |
| Auth | `AUTH_COOKIE_DOMAIN`, `BCRYPT_SALT_NUMBER`, `ADMIN_BOOTSTRAP_SECRET` |
| JWT | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES`, `JWT_PASS_RESET_SECRET`, `JWT_PASS_RESET_EXPIRES` |
| Reset/verify links | `RESET_PASSWORD_URL`, `VERIFY_EMAIL_URL` |
| Integrations (optional) | `CLOUDINARY_*`, `SMTP_*`, `MIM_SMS_*`, `GOOGLE_*` |
| One-shot admin seed | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, `ADMIN_BLOOD_GROUP`, `ORGANIZATION_SEED_PHONE` |
| Memory ceilings | `POSTGRES_MEMORY_LIMIT` … `SEED_MEMORY_LIMIT` |

Generate secrets with:

```bash
openssl rand -hex 32   # run 4–5 times for POSTGRES_PASSWORD, REDIS_PASSWORD,
                       # ADMIN_BOOTSTRAP_SECRET and three distinct JWT secrets
```

The API validates critical values **at startup** and refuses to boot (exits 1)
when required configuration is missing/invalid (see
`apps/api/src/app/config/index.ts`). The Compose file also uses
`${VAR:?error}` so a missing variable fails the `config`/`up` step early.

---

## First Deployment

Exactly one production path exists — `scripts/deploy-production.sh`, which:

```text
1. requires .env.production with NO placeholder values
2. docker compose config (validates)
3. docker compose build --pull api web nginx
4. docker compose up -d --wait postgres redis
5. docker compose run --rm migrate            (prisma migrate deploy)
6. docker compose up -d api worker
7. wait for api health; start web; wait; start nginx
8. internal health checks + nginx -t + compose ps
```

Run it:

```bash
cd /home/deploy/bd-blood
IMAGE_TAG="$(git rev-parse --short HEAD)" bash scripts/deploy-production.sh
```

> The one-shot **`migrate`** container applies only forward, committed
> migrations (`prisma migrate deploy`) — never `migrate dev`/`reset`.

---

## Database Migration

Migrations are **never** run from application replicas. The compose `migrate`
service is the single runner and `api`/`worker` declare
`depends_on: migrate: service_completed_successfully`, so no replica races a
migration.

Manual (one-shot):

```bash
cd /home/deploy/bd-blood
docker compose --env-file .env.production run --rm migrate
```

Check status:

```bash
docker compose --env-file .env.production run --rm --no-deps \
  api npm run migrate:status
```

---

## Required Seed

The reference seed (geography, blood groups, achievements, canonical
organizations, single Super Admin) is **intentionally not run automatically on
every deploy**. Run it once after the first successful migration:

```bash
cd /home/deploy/bd-blood
bash scripts/seed-production.sh
# → docker compose --env-file .env.production --profile tools run --rm seed
```

- Idempotent: safe to re-run when a future release adds new canonical content.
- It **requires** `ADMIN_EMAIL`, `ADMIN_PASSWORD` (≥12 chars), `ADMIN_FULL_NAME`
  and `ORGANIZATION_SEED_PHONE` from `.env.production`.
- Demo/testing seeds (`seed:demo`) are **never** used in production.

---

## Start Services

```bash
cd /home/deploy/bd-blood
docker compose --env-file .env.production up -d          # after first deploy
docker compose --env-file .env.production ps
```

Services start automatically on VPS reboot thanks to
`restart: unless-stopped` and `systemctl enable docker`. Data persists in named
volumes.

---

## SSL

HTTPS is provided by **Certbot** (Let's Encrypt) with the standard webroot
challenge routed by Nginx (`/.well-known/acme-challenge/`).

First issuance (one-time, port 80 free — do this **before** starting `nginx`):

```bash
cd /home/deploy/bd-blood
docker compose --env-file .env.production --profile tools run --rm certbot-init
```

Renewal is a Certbot container under the `tools` profile (it reads the webroot
volume and renews). Run it on demand or schedule the bundled helper:

```bash
cd /home/deploy/bd-blood
bash scripts/renew-certificates.sh

# Optional: crontab -e  (daily 03:00 — renewals are no-ops until due)
0 3 * * * cd /home/deploy/bd-blood && bash scripts/renew-certificates.sh >> /home/deploy/bd-blood/backups/certbot-cron.log 2>&1
```

`docker-compose.yml` mounts `certbot_certs` into Nginx read-only; Nginx serves
`443` only after certificates exist (its healthcheck/start ordering already
accommodates the files being mounted later).

---

## CI/CD

### CI — `.github/workflows/ci.yml`

Runs on every PR and push to `main`:

1. `npm ci` (root workspaces)
2. `prisma validate` + `prisma generate`
3. `typecheck` (both workspaces)
4. `lint` (web)
5. API unit tests (DB integration tests self-skip without `TEST_DATABASE_URL`)
6. Production builds: API (`tsc`) and web (`next build` standalone)
7. Docker image builds: `bdblood-api`, `bdblood-web`, `bdblood-proxy`

A red CI **blocks** deployment.

### CD — `.github/workflows/deploy.yml`

Triggers on push to `main` (and `workflow_dispatch` for manual runs):

```text
push to main
 → GitHub Actions SSH to VPS (appleboy/ssh-action)
 → git fetch + checkout + hard reset to <commit SHA>
 → IMAGE_TAG=<sha> bash scripts/deploy-production.sh
 → deploy script runs migrate → up services → healthchecks
```

Required **GitHub repository Secrets**:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS public IP or hostname |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | private SSH key (deploy user's authorized key) |
| `VPS_PORT` | `22` |

Environment variables used by the script (`ENV_FILE`, `IMAGE_TAG`) come from the
VPS `.env.production` / git SHA; **no production secrets live in workflow YAML**.

> Production `.env.production` stays **only on the VPS** and is never in Git or
> GitHub Secrets (it is loaded by `scripts/deploy-production.sh` via
> `ENV_FILE=$REPO_DIR/.env.production`).

---

## Checking Status

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production ps --format json

# Health endpoints (internal)
docker compose --env-file .env.production exec api \
  node -e "require('http').get('http://127.0.0.1:5000/api/v1/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)})"

# Public
curl -fsS https://YOUR_DOMAIN/ -o /dev/null && echo "web ok"
curl -fsS https://api.YOUR_DOMAIN/api/v1/health && echo
```

---

## Logs

All services log to **stdout/stderr**, captured by Docker with rotation
(`max-size: 10m`, `max-file: 5`). Never log passwords/OTP/tokens.

```bash
docker compose --env-file .env.production logs -f api
docker compose --env-file .env.production logs -f web
docker compose --env-file .env.production logs -f worker
docker compose --env-file .env.production logs -f nginx
docker compose --env-file .env.production logs -f postgres --tail 200
```

---

## Restart Services

```bash
cd /home/deploy/bd-blood
docker compose --env-file .env.production restart api worker web nginx
```

Rolling-safe restart of the stack (does NOT touch volumes):

```bash
docker compose --env-file .env.production up -d --force-recreate
```

---

## Update Deployment

### Option A — automatic (CI/CD)

Push to `main`; `.github/workflows/deploy.yml` runs the whole path.

### Option B — manual on the VPS

```bash
cd /home/deploy/bd-blood
git pull --ff-only
IMAGE_TAG="$(git rev-parse --short HEAD)" bash scripts/deploy-production.sh
```

> Routine updates never use `down -v`, `prisma migrate reset`, or any volume
> removal. Data volumes persist.

---

## Rollback

Because every image is tagged with a git commit SHA:

```bash
cd /home/deploy/bd-blood
git fetch --all --prune
git checkout main
git reset --hard <PREVIOUS_GOOD_SHA>          # e.g. abc1234
IMAGE_TAG=<PREVIOUS_GOOD_SHA> bash scripts/deploy-production.sh
```

Fast rollback to an image tag that **already exists** locally (no rebuild) via
the bundled helper:

```bash
cd /home/deploy/bd-blood
bash scripts/rollback-production.sh <EXISTING_IMAGE_TAG>   # e.g. 8f3a2c1
```

Rollback considerations:

- **Backward-compatible migrations** (the norm here — additive tables/columns)
  roll back cleanly to the previous image.
- **Irreversible migrations** (data deletion/column drops) cannot be rolled back
  by re-deploying code alone; restore the database from backup
  (`scripts/restore-postgres.sh`) to the pre-migration dump if required.
- Keep the last known-good SHA written down (GitHub Actions logs show it).

---

## PostgreSQL Backup

Manual backup (produces a custom-format dump in `<repo>/backups/`, retains 14
days):

```bash
cd /home/deploy/bd-blood
bash scripts/backup-postgres.sh
# Backups land in backups/bdblood_YYYYMMDDTHHMMSSZ.dump
```

Scheduled (daily 03:00, idempotent install):

```bash
cd /home/deploy/bd-blood
bash scripts/install-backup-cron.sh        # adds crontab line; crontab -l to verify
```

**Recommended: also copy backups off-VPS** (Hostinger Object Storage / S3 /
B2 / another server) — a backup that lives only on the VPS is not a backup.

Example simple off-site sync with `rclone`:

```bash
rclone copy /home/deploy/bd-blood/backups remote:bdblood-backups
```

---

## PostgreSQL Restore

⚠️ **Destructive** — overwrites current production data with the dump. Not a
routine step.

```bash
cd /home/deploy/bd-blood
bash scripts/restore-postgres.sh backups/bdblood_20260101T000000Z.dump
```

The script stops `api`/`worker`/`web`, terminates remaining connections, drops &
recreates the DB, restores inside a single transaction, then restarts services.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `Error: Missing or invalid required environment variables` at API boot | `.env.production` incomplete — fill every required var, then redeploy. |
| `Set X in .env.production` when running compose | Same — missing Compose substitution. `docker compose config` shows which. |
| `Certificate not yet valid` / nginx fails to start | Run `certbot-init` once with port 80 free before starting `nginx`. |
| WebSockets drop / notifications not live | Check the `api` logs and that `NEXT_PUBLIC_SOCKET_URL=https://api.DOMAIN` is set **as a build arg** at image build time. |
| `prisma migrate deploy` fails | Inspect `docker compose logs migrate`; DB user must own schema. Never run `migrate dev` in production. |
| Compose healthcheck keeps `starting` | `api` depends on redis+postgres; confirm those are `healthy` first (`docker compose ps`). |
| Don't remember secrets | They are only in `.env.production` on the VPS — copy them to a password manager. |
| Want clean Docker disk | `docker system prune` is safe to run occasionally but is **not** part of routine deploy and never touches volumes. |

---

## Moving to a Registry (optional future)

If you later want images built in CI instead of on the VPS:

1. Add GHCR login to `.github/workflows/deploy.yml`
   (`docker/login-action@v3` with `GITHUB_TOKEN`).
2. Build/push images tagged `ghcr.io/<owner>/bdblood-{api,web,proxy}:<sha>`.
3. On the VPS, `docker compose pull` the same tag and `up -d`.
4. Keep the same `.env.production`; only the image source changes.

---

## Files created / referenced in this repository

- `docker-compose.yml` (existing; single source of truth)
- `docker-compose.prod.yml` (production wrapper)
- `apps/api/Dockerfile`, `apps/web/Dockerfile`, `infrastructure/nginx/Dockerfile`
- `infrastructure/nginx/conf.d/bdblood.conf.template` + `snippets/*`
- `.env.production.example`
- `scripts/deploy-production.sh`, `scripts/rollback-production.sh`,
  `scripts/seed-production.sh`, `scripts/backup-postgres.sh`,
  `scripts/restore-postgres.sh`, `scripts/install-backup-cron.sh`,
  `scripts/renew-certificates.sh`
- `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
