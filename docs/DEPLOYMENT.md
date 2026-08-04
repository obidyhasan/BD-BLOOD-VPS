# BD Blood — Production VPS Deployment Guide (Monorepo)

Docker Compose running Nginx, the Next.js frontend (`apps/web`), the
Express/Prisma backend (`apps/api`), PostgreSQL, and Redis on a single VPS,
all from one repository.

```
Internet
  │
  ▼
Nginx (80/443, host-exposed)
  ├── YOUR_DOMAIN.COM, www.YOUR_DOMAIN.COM  → web:3000  (Next.js, apps/web)
  └── api.YOUR_DOMAIN.COM
        ├── /socket.io/  → api:5000  (WebSocket upgrade)
        └── /            → api:5000  (REST API, apps/api)

api:5000 ──► postgres:5432   (internal network only)
        └───► redis:6379      (internal network only, optional)
```

The backend's notification sweeper is an in-process `setInterval`
(`apps/api/src/app/jobs/notificationSweeper.ts`), not a separate queue —
there is intentionally **no separate worker container**; it runs inside
the `api` service.

---

## 1. VPS requirements

- Any Linux VPS with a public IPv4 address. 2 vCPU / 4 GB RAM is a
  reasonable starting point.
- Root or sudo access.
- Ports 80 and 443 free.

## 2. Required software

Only Docker is required on the host — everything else runs in containers.

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out/in afterwards
docker compose version
```

## 3. Server setup

Unlike the previous two-repo layout, this is now a single monorepo — one
clone gives you everything:

```bash
sudo mkdir -p /opt/bdblood
sudo chown $USER:$USER /opt/bdblood
git clone <your-monorepo-url> /opt/bdblood
cd /opt/bdblood
```

Resulting layout:

```
/opt/bdblood/
├── apps/
│   ├── web/
│   └── api/
├── infrastructure/nginx/
├── docs/
├── docker-compose.yml
└── .env.example
```

## 4. Firewall configuration

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Do **not** open 5432 (Postgres) or 6379 (Redis) — internal-network only.

## 5. DNS configuration

| Host                    | Type | Value        |
|--------------------------|------|--------------|
| `YOUR_DOMAIN.COM`        | A    | `<VPS_IP>`   |
| `www.YOUR_DOMAIN.COM`    | A    | `<VPS_IP>`   |
| `api.YOUR_DOMAIN.COM`    | A    | `<VPS_IP>`   |

## 6. Environment variables

Three separate env files, none committed to git:

- `/opt/bdblood/.env` — from `.env.example` — Postgres/Redis container
  credentials + the frontend's `NEXT_PUBLIC_*` build args.
- `/opt/bdblood/apps/api/.env.production` — from
  `apps/api/.env.production.example` — full backend configuration.
- `/opt/bdblood/apps/web/.env.production` — from
  `apps/web/.env.production.example` — frontend runtime config
  (`AUTH_COOKIE_DOMAIN`).

```bash
cp .env.example .env
cp apps/api/.env.production.example apps/api/.env.production
cp apps/web/.env.production.example apps/web/.env.production
# edit all three, then generate real secrets:
openssl rand -base64 48
```

**Required**: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES`,
`JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES`, `JWT_PASS_RESET_SECRET`,
`JWT_PASS_RESET_EXPIRES`, `FRONTEND_URL`.

**Required for full functionality**: `CLOUDINARY_*` (uploads), `SMTP_*`
(emails), `MIM_SMS_*` (SMS notifications).

**Optional**: `REDIS_*` (caching/OTP degrade gracefully without it),
`GOOGLE_*` (OAuth), `ADMIN_EMAIL`.

**Frontend public** (`NEXT_PUBLIC_*`, safe to expose to the browser):
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_APP_URL`.

**Backend secrets** (never expose to the frontend): all `JWT_*`,
`CLOUDINARY_API_SECRET`, `SMTP_PASS`, `MIM_SMS_API_KEY`,
`GOOGLE_CLIENT_SECRET`, `ADMIN_BOOTSTRAP_SECRET`, `DATABASE_URL`,
`REDIS_PASSWORD`.

## 7. Database setup

Postgres runs as a container with a persistent volume (`postgres_data`).
Migrations apply automatically on `api` container start via
`prisma migrate deploy` (non-destructive). Nothing to install on the host.

```bash
docker compose exec api npx prisma migrate status
```

## 8. Redis setup

Container with a persistent volume (`redis_data`, `appendonly yes`). To
run without Redis at all, leave `REDIS_HOST` empty in
`apps/api/.env.production` and drop the `redis` service from
`docker-compose.yml` — the app already handles Redis being absent.

## 9. Docker setup

```bash
cd /opt/bdblood
docker compose up -d --build
docker compose ps
```

Both images build with the **repo root** as their Docker build context
(required for npm workspaces to resolve the single root lockfile) — this
is already configured correctly in `docker-compose.yml`; no manual build
flags needed.

## 10. Application deployment (first run)

```bash
docker compose logs -f api
```

Look for `Redis connected` (if configured), `📡 Socket.io ready`, and
`🚀 Server is running on http://localhost:5000`. After the first
successful run, set `RUN_SEEDS=false` in `apps/api/.env.production` and
`docker compose up -d api` again to skip reseeding on future restarts.

## 11. Prisma migrations

Applied automatically on every `api` container start via
`prisma migrate deploy` — forward-only, never resets data. For schema
changes: commit the migration from development, deploy the updated
image, and the container's next start applies it.

## 12. Nginx setup

Already containerized. Replace every `YOUR_DOMAIN.COM` placeholder in
`infrastructure/nginx/conf.d/bdblood.conf` with your real domain before
first start.

## 13. SSL setup

```bash
docker compose up -d nginx

docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d YOUR_DOMAIN.COM -d www.YOUR_DOMAIN.COM -d api.YOUR_DOMAIN.COM \
  --email you@example.com --agree-tos --no-eff-email

docker compose restart nginx
```

**Renewal** (root crontab):

```bash
0 3 * * * cd /opt/bdblood && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

## 14. Starting services

```bash
docker compose up -d
```

## 15. Restarting services

```bash
docker compose restart api      # single service
docker compose restart          # everything
```

## 16. Updating the application

```bash
cd /opt/bdblood
git pull
docker compose up -d --build api web
```

One `git pull` updates both apps now (single repo) — a real simplification
over the previous two-repo layout, where frontend and backend had to be
pulled and rebuilt separately. Postgres/Redis/Nginx are untouched and keep
running throughout.

## 17. Viewing logs

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f nginx
```

## 18. Health checks

- Backend: `GET https://api.YOUR_DOMAIN.COM/api/v1/health` — `200` with
  `{ checks: { db, redis } }`, or `503` if the database is unreachable.
- Frontend: `GET https://YOUR_DOMAIN.COM/` — `200`.
- `docker compose ps` shows health status for all four services.

## 19. Rollback procedure

```bash
cd /opt/bdblood
git checkout <previous-tag-or-commit>
docker compose up -d --build api web
```

Database rollback is a separate, manual decision — write and review a new
forward migration rather than reversing one automatically.

## 20. Backup strategy

```bash
mkdir -p /opt/bdblood/backups
0 2 * * * docker compose -f /opt/bdblood/docker-compose.yml exec -T postgres \
  pg_dump -U bdblood bdblood | gzip > /opt/bdblood/backups/bdblood_$(date +\%Y\%m\%d).sql.gz \
  && find /opt/bdblood/backups -name "*.sql.gz" -mtime +14 -delete
```

Redis holds only cache/OTP data — the `appendonly` volume persists it
across restarts, and it's intentionally excluded from backups. Store
Postgres backups off the VPS as well (e.g. object storage).

---

## Local development

```bash
npm install                 # once, at the repo root — installs both apps
cp apps/api/.env.example apps/api/.env      # localhost defaults, already in the repo
cp apps/web/.env.example apps/web/.env.local

npm run dev                 # runs apps/api and apps/web together
npm run dev:api             # apps/api only
npm run dev:web             # apps/web only

npm run typecheck           # both apps
npm run lint                # apps/web only — apps/api has no ESLint
                             # config in the current codebase; none was
                             # added as part of this migration (see notes)
npm run build                # both apps, production build
```

---

## Notes on things intentionally left alone or newly fixed here

- **No shared `packages/` directory was created.** Both apps independently
  implement their own zod validation schemas (frontend UX validation vs.
  backend authoritative validation) and have fundamentally different
  `tsconfig.json` module settings (`bundler` vs. `NodeNext`) — forcing
  either into a shared package would risk subtle behavior drift for no
  real benefit. `BloodGroup` is backend-database-driven, not a literal
  shared constant. Nothing else in either app was a genuine duplicate.
- **npm workspaces, not Turborepo**, was chosen: both apps already used
  plain npm (no yarn/pnpm lockfiles), there's no shared build graph to
  cache across two small apps, and workspaces alone satisfy every
  requirement (single install, single lockfile, per-app scripts) without
  adding a new tool to learn or configure.
- **No CI/CD pipeline existed in either original repo**, so none was
  invented here, per the migration's own instruction not to build
  something that doesn't already exist.
- **`apps/api` has no ESLint configuration** — this predates the
  migration and wasn't added, to avoid surfacing a large, unrelated set
  of style findings as part of a structural migration.
- **Two real bugs were caught and fixed while adapting the Dockerfiles for
  the monorepo build context** (see the main report): `prisma` (the CLI)
  was a devDependency, which would have made `prisma migrate deploy` fail
  at container start after devDependencies were pruned; and `npm ci`
  triggers `apps/api`'s `postinstall` (`prisma generate`) before the
  Prisma schema is present in an early build stage, which would fail the
  image build outright. Both are fixed in `apps/api/Dockerfile`.
