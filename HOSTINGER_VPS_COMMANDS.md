# BD BLOOD — HOSTINGER VPS COPY/PASTE COMMANDS

Every command below is written against the **actual** BD Blood repository
structure (service names `postgres`, `redis`, `migrate`, `seed`, `api`,
`worker`, `web`, `nginx`; Compose file `docker-compose.yml`; production env
`.env.production`; deploy script `scripts/deploy-production.sh`).

**Replace these placeholders yourself:**

| Placeholder | Your value |
| --- | --- |
| `YOUR_VPS_IP` | VPS public IP |
| `YOUR_DOMAIN.COM` | e.g. `bdblood.org` |
| `api.YOUR_DOMAIN.COM` | e.g. `api.bdblood.org` |
| `you@example.com` | your email |
| `<generated-secret>` | `openssl rand -hex 32` output |

---

## A. Commands I run on my local computer

```bash
# 1) Install dependencies (npm workspaces, runs prisma generate via postinstall)
npm ci

# 2) Local validation before anything else
npm run typecheck
npm run lint
npm run test                     # API unit tests (DB tests self-skip)
npx prisma validate --config apps/api/prisma.config.ts

# 3) Local production build (web needs build-time public URLs)
npm run build:api
NEXT_PUBLIC_API_URL=https://api.YOUR_DOMAIN.COM/api/v1 \
NEXT_PUBLIC_SOCKET_URL=https://api.YOUR_DOMAIN.COM \
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN.COM \
npm run build:web

# 4) Commit and push (deploys to production ONLY on push to main when CD is on)
git add -A
git commit -m "chore(deploy): production-ready changes"
git push origin main
```

---

## B. GitHub configuration/secrets

Create a GitHub repository `BD-BLOOD` (or push the existing repo), then add
these **repository Secrets** (`Settings → Secrets and variables → Actions`):

| Secret | Value |
| --- | --- |
| `VPS_HOST` | `YOUR_VPS_IP` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | full private SSH key (`cat ~/.ssh/id_ed25519`) |
| `VPS_PORT` | `22` |

> Production secrets (`.env.production`) are **not** GitHub secrets — they
> stay only on the VPS.

Optional: set the deployment branch in `.github/workflows/deploy.yml` if you
deploy from something other than `main`.

---

## C. Commands I run after first SSH login to Hostinger VPS

```bash
# Log in from your local machine once:
ssh root@YOUR_VPS_IP

# As root — update the base system
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg git ufw

# Create the deploy user (no password login; SSH key only)
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# Add your public key (run locally: cat ~/.ssh/id_ed25519.pub)
mkdir -p /home/deploy/.ssh
echo "PASTE_YOUR_PUBLIC_SSH_KEY_HERE" >> /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## D. Commands to install Docker (as root)

```bash
# Official Docker convenience script (or use the apt-repo method)
curl -fsSL https://get.docker.com | sh

# Enable + start at boot
systemctl enable --now docker

# Allow the deploy user to run docker without sudo
usermod -aG docker deploy

# Install the Compose plugin if the script didn't
apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version

# Firewall: only 22/80/443 (adjust to Hostinger's panel if it manages UFW)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

> If Hostinger's hPanel firewall is used instead, open the same three ports
> there and leave `ufw` disabled.

---

## E. Commands to clone/configure BD Blood (as deploy user)

```bash
# Switch to deploy user (from root)
su - deploy

# Clone (or pull) the repository
git clone git@github.com:YOUR_GITHUB_USER/BD-BLOOD.git bd-blood   # SSH
# or
git clone https://github.com/YOUR_GITHUB_USER/BD-BLOOD.git bd-blood
cd ~/bd-blood
```

---

## F. Commands to create the production environment

```bash
cd ~/bd-blood

# Create the secret env file (never commit this)
cp .env.production.example .env.production
nano .env.production
```

Fill in (values below are illustrative — generate your own secrets):

```bash
# From the VPS shell:
openssl rand -hex 32     # → run several times
```

Set at minimum:

```dotenv
APP_DOMAIN=YOUR_DOMAIN.COM
API_DOMAIN=api.YOUR_DOMAIN.COM
CERTBOT_EMAIL=you@example.com
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN.COM
NEXT_PUBLIC_API_URL=https://api.YOUR_DOMAIN.COM/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.YOUR_DOMAIN.COM

POSTGRES_USER=bdblood
POSTGRES_PASSWORD=<generated-secret>
POSTGRES_DB=bdblood
DATABASE_URL=postgresql://bdblood:<generated-secret>@postgres:5432/bdblood?schema=public&connection_limit=10&pool_timeout=20

REDIS_PASSWORD=<generated-secret>

FRONTEND_URL=https://YOUR_DOMAIN.COM,https://www.YOUR_DOMAIN.COM
RESET_PASSWORD_URL=https://YOUR_DOMAIN.COM/reset-password
VERIFY_EMAIL_URL=https://YOUR_DOMAIN.COM/verify-email
AUTH_COOKIE_DOMAIN=.YOUR_DOMAIN.COM
ADMIN_BOOTSTRAP_SECRET=<generated-secret>

JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
JWT_PASS_RESET_SECRET=<generated-secret>

# One-shot reference seed only (run AFTER first migration):
ADMIN_EMAIL=admin@YOUR_DOMAIN.COM
ADMIN_PASSWORD=<a-strong-password-at-least-12-chars>
ADMIN_FULL_NAME=BD Blood Super Admin
ADMIN_BLOOD_GROUP=O+
ORGANIZATION_SEED_PHONE=+8801XXXXXXXXX

# Optional integrations — leave a group fully empty or fully populated:
# CLOUDINARY_*, SMTP_*, MIM_SMS_*, GOOGLE_*
```

Save and exit. Validate the file resolves before anything else:

```bash
docker compose --env-file .env.production config --quiet && echo "ENV+COMPOSE OK"
```

> Never commit `.env.production`. It is already in `.gitignore`.

---

## G. Commands to run first deployment

```bash
cd ~/bd-blood

# Obtain SSL FIRST (port 80 free — nginx not running yet)
docker compose --env-file .env.production --profile tools run --rm certbot-init

# Run the single deployment path (builds images, starts postgres+redis,
# runs migrate, starts api/worker/web, then nginx, verifies health)
IMAGE_TAG="$(git rev-parse --short HEAD)" bash scripts/deploy-production.sh

# Then run the REQUIRED reference seed once
bash scripts/seed-production.sh
```

If anything failed and you want to watch:

```bash
docker compose --env-file .env.production logs -f api migrate
```

---

## H. Commands to run Prisma migration

```bash
cd ~/bd-blood

# Status (no changes)
docker compose --env-file .env.production run --rm --no-deps api npm run migrate:status

# Apply pending forward migrations (safe; never migrate dev/reset in prod)
docker compose --env-file .env.production run --rm migrate
```

Migrations also run automatically as part of `scripts/deploy-production.sh`
(the compose `migrate` service).

---

## I. Commands to run the required reference seed

```bash
cd ~/bd-blood
bash scripts/seed-production.sh
# = docker compose --env-file .env.production --profile tools run --rm seed
```

Reference seed includes: Bangladesh geography, blood groups, achievements,
canonical organization hierarchy and the single Super Admin. Idempotent and
safe to re-run.

---

## J. Commands to start/restart the application

```bash
cd ~/bd-blood

# Start everything (after first deployment)
docker compose --env-file .env.production up -d

# Restart app containers (keeps DB/Redis/data untouched)
docker compose --env-file .env.production restart api worker web nginx

# Recreate containers from current images (rolling, volumes preserved)
docker compose --env-file .env.production up -d --force-recreate
```

---

## K. Commands to check containers

```bash
cd ~/bd-blood
docker compose --env-file .env.production ps

# Health details (docker gives status + health)
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## L. Commands to inspect logs

```bash
cd ~/bd-blood

docker compose --env-file .env.production logs -f api
docker compose --env-file .env.production logs -f web
docker compose --env-file .env.production logs -f worker
docker compose --env-file .env.production logs -f nginx
docker compose --env-file .env.production logs -f postgres --tail 200
docker compose --env-file .env.production logs -f redis --tail 100
```

---

## M. Commands to verify API/health

```bash
# Internal (from the VPS, on the Docker network)
docker compose --env-file .env.production exec api \
  node -e "require('http').get('http://127.0.0.1:5000/api/v1/health',r=>{console.log(r.statusCode);process.exit(r.statusCode===200?0:1)})"

# Public (from anywhere)
curl -fsS https://api.YOUR_DOMAIN.COM/api/v1/health
curl -fsS -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN.COM/
```

Expected health payload shape:

```json
{ "success": true, "message": "healthy", "checks": { "db": { "ok": true }, "redis": { "ok": true } } }
```

---

## N. Commands for future updates

```bash
cd ~/bd-blood

# Automatic (CI/CD): just push to main from your local machine.
# Manual:
git pull --ff-only
IMAGE_TAG="$(git rev-parse --short HEAD)" bash scripts/deploy-production.sh
```

Rolling-safe restart without downtime for config-only changes:

```bash
docker compose --env-file .env.production restart api worker web nginx
```

---

## O. Commands for manual database backup

```bash
cd ~/bd-blood
bash scripts/backup-postgres.sh
# → creates backups/bdblood_YYYYMMDDTHHMMSSZ.dump (custom format)

# Install a daily 03:00 cron backup (retains 14 days):
bash scripts/install-backup-cron.sh
crontab -l   # verify

# Off-VPS copy (recommended; adapt to your object storage):
rclone copy ~/bd-blood/backups remote:bdblood-backups
```

---

## P. Commands for restore

⚠️ **DESTRUCTIVE** — overwrites current data with a dump. Not routine.

```bash
cd ~/bd-blood

# List available backups
ls -1 backups/

# Restore one (stops api/worker/web, drops + recreates DB, restores, restarts)
bash scripts/restore-postgres.sh backups/bdblood_20260101T000000Z.dump
```

---

## Q. Commands for rollback

```bash
cd ~/bd-blood

# Option 1 — fast rollback to a locally cached image tag (no rebuild):
bash scripts/rollback-production.sh <PREVIOUS_GOOD_TAG>

# Option 2 — full rollback to a previous commit SHA (images tagged by SHA):
git fetch --all --prune
git reset --hard <PREVIOUS_GOOD_SHA>          # e.g. 8f3a2c1
IMAGE_TAG=<PREVIOUS_GOOD_SHA> bash scripts/deploy-production.sh

# Verify the previous version is serving
docker compose --env-file .env.production ps
curl -fsS https://api.YOUR_DOMAIN.COM/api/v1/health
```

> If the bad release included an irreversible DB migration, also restore the
> database from the pre-migration backup (section P) — code rollback alone
> cannot undo a destructive schema change.

---

## Safety rules (what NOT to run in routine deployment)

```bash
# ❌ Never part of normal deploy/update:
docker compose --env-file .env.production down -v        # deletes volumes/data
docker volume rm bdblood_postgres_data                    # deletes database
docker compose --env-file .env.production run --rm api npm run migrate:reset
docker compose --env-file .env.production run --rm api npm run migrate:dev
docker system prune -a --volumes                          # deletes volumes
```

These are only for deliberate local/testing reset, never production.
