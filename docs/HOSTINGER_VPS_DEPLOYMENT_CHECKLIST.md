# BD Blood Hostinger VPS deployment checklist

## Before deployment

- [ ] VPS sizing, region, snapshots, SSH keys, and non-root deploy user are ready.
- [ ] Firewall exposes only required SSH access and public TCP 80/443.
- [ ] Apex, `www`, and API DNS resolve to the VPS; no stale AAAA record exists.
- [ ] Docker Engine, Buildx, and Compose plugin pass version checks.
- [ ] Repository is checked out at a reviewed release commit/tag.
- [ ] `.env.production` is mode `600`, uncommitted, and contains no placeholders.
- [ ] Database, Redis, JWT, and bootstrap secrets are unique and random.
- [ ] Optional provider groups are either fully configured or fully empty.
- [ ] Public URLs, CORS origins, cookie domain, and OAuth callback match DNS.
- [ ] PostgreSQL and Redis named volumes appear in rendered Compose config.
- [ ] PostgreSQL and Redis have no public host ports.
- [ ] A writable backup location and encrypted off-server destination are ready.
- [ ] `docker compose --env-file .env.production config --quiet` passes.
- [ ] Current database backup exists and new Prisma migrations were reviewed.

## First deployment

- [ ] Port 80 is free and DNS has propagated.
- [ ] `certbot-init` issued one certificate for apex, `www`, and API hosts.
- [ ] API, web, and Nginx images built successfully.
- [ ] Dedicated `migrate` job completed successfully.
- [ ] API, web, worker, PostgreSQL, Redis, and Nginx are running/healthy.
- [ ] Explicit production reference seed was reviewed and run once if required.
- [ ] No demo donors/content were seeded.
- [ ] Seed administrator password was changed and removed/rotated if appropriate.

## Application verification

- [ ] API health returns HTTP 200 without database/Redis internals in errors.
- [ ] Apex HTTPS works, HTTP redirects to HTTPS, and `www` redirects to apex.
- [ ] TLS certificate covers apex, `www`, and API hostnames.
- [ ] Ports 3000, 5000, 5432, and 6379 are unreachable publicly.
- [ ] Homepage, Organization, Medical, Blog, Event, and Gallery routes work.
- [ ] Login, refresh, logout, email verification, and password reset work.
- [ ] Donor profile, requests, donations, and notifications work.
- [ ] Organization dashboard and blood-request processing work.
- [ ] Super Admin dashboard and management actions work.
- [ ] Uploads work with Cloudinary and survive application container replacement.
- [ ] Socket.IO connects over WSS, upgrades, reconnects, and delivers notifications.
- [ ] Worker processes queued work without repeated failures.
- [ ] Browser console has no mixed-content, CORS, or cookie-domain errors.
- [ ] Prisma migration status and required reference records are correct.

## Persistence and operations handoff

- [ ] `docker compose restart` restores every service without data loss.
- [ ] VPS reboot restores services and database/Redis data without manual startup.
- [ ] Certificate renewal cron is installed and its script has been tested.
- [ ] Daily PostgreSQL backups and encrypted off-server transfer are scheduled.
- [ ] A backup restore drill succeeded in a disposable environment.
- [ ] Disk, memory, health, HTTP error, worker, DB, and certificate alerts are owned.
- [ ] Release tag, deployment time, migration result, and verifier are recorded.
- [ ] Previous image tags and a schema-compatible rollback release are identified.
- [ ] Incident contacts and provider credentials are available to authorized operators.
