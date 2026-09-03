# HOSTINGER VPS DEPLOYMENT CHECKLIST

Go-live verification for **BD Blood** on a Hostinger VPS with
Docker + Docker Compose + Nginx + Let's Encrypt + GitHub Actions.

Legend: ☐ not done · ☑ done

---

## 1. Builds

- [ ] ☐ `npm ci` completes on a clean machine (CI runner + VPS)
- [ ] ☐ `npm run typecheck` passes (api + web)
- [ ] ☐ `npm run lint` passes (web; api has no ESLint config by design)
- [ ] ☐ `npx prisma validate --config apps/api/prisma.config.ts` passes
- [ ] ☐ `npm run build:api` passes (`tsc` + EJS views copied to `dist/`)
- [ ] ☐ `npm run build:web` passes with real `NEXT_PUBLIC_*` values
- [ ] ☐ API unit tests pass (`npm run test`; DB tests self-skip without
      `TEST_DATABASE_URL`)

## 2. Docker builds

- [ ] ☐ `docker build -f apps/api/Dockerfile -t bdblood-api:test .` succeeds
- [ ] ☐ `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=... --build-arg NEXT_PUBLIC_SOCKET_URL=... --build-arg NEXT_PUBLIC_APP_URL=... -t bdblood-web:test .` succeeds
- [ ] ☐ `docker build infrastructure/nginx -t bdblood-proxy:test .` succeeds
- [ ] ☐ `docker compose --env-file .env.production config --quiet` succeeds
- [ ] ☐ GitHub Actions CI (`ci.yml`) is green including the `docker` job

## 3. Environment configured

- [ ] ☐ `/home/deploy/bd-blood/.env.production` exists
- [ ] ☐ No placeholder values remain (`replace-me`, `example.com`, `YOUR_DOMAIN`)
- [ ] ☐ `APP_DOMAIN`, `API_DOMAIN`, `AUTH_COOKIE_DOMAIN=.APP_DOMAIN` correct
- [ ] ☐ `NEXT_PUBLIC_*` are the **public HTTPS** URLs (used as build args)
- [ ] ☐ `DATABASE_URL` host is `postgres` (Docker DNS), credentials match
      `POSTGRES_*`
- [ ] ☐ Secrets generated with `openssl rand -hex 32` (≥32 chars) and distinct
- [ ] ☐ `.env.production` is NOT in git (`git status` clean of it)

## 4. Secrets configured

- [ ] ☐ GitHub repo Secrets set: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`,
      `VPS_PORT`
- [ ] ☐ Production DB/JWT/Redis secrets exist only on the VPS `.env.production`
- [ ] ☐ SSH key login works for `deploy` (no password)

## 5. DNS ready

- [ ] ☐ `A @` → VPS IP
- [ ] ☐ `A www` → VPS IP
- [ ] ☐ `A api` → VPS IP
- [ ] ☐ `dig YOUR_DOMAIN.COM` and `dig api.YOUR_DOMAIN.COM` resolve to the VPS

## 6. Ports ready

- [ ] ☐ Firewall allows `22`, `80`, `443` only
- [ ] ☐ `5432`, `6379`, `3000`, `5000` are NOT reachable from the internet
      (verify from your local machine with a port scan)

## 7. PostgreSQL persistent

- [ ] ☐ `postgres` runs with the named volume `postgres_data`
- [ ] ☐ `docker volume ls` shows `bdblood_postgres_data`
- [ ] ☐ Healthcheck green (`docker compose --env-file .env.production ps`)

## 8. Redis private

- [ ] ☐ `redis` runs with `--requirepass` and the named volume `redis_data`
- [ ] ☐ Redis is on the `internal: true` network (no public port)
- [ ] ☐ Healthcheck green

## 9. Migrations applied

- [ ] ☐ `docker compose --env-file .env.production run --rm migrate` succeeded
      (exit 0)
- [ ] ☐ `migrate:status` reports "up to date" / no pending migrations
- [ ] ☐ Only `prisma migrate deploy` ever used (never `migrate dev`/`reset`)

## 10. Required seeds applied

- [ ] ☐ `bash scripts/seed-production.sh` succeeded once
- [ ] ☐ Geography, blood groups, achievements, canonical organizations seeded
- [ ] ☐ Single Super Admin exists with the configured `ADMIN_EMAIL`
- [ ] ☐ No demo seed was run in production

## 11. Frontend healthy

- [ ] ☐ `curl -fsS -o /dev/null https://YOUR_DOMAIN.COM/` → 200
- [ ] ☐ Public pages load: Home, Organization, Medical, Blog, Event, Gallery,
      About, Work, Terms, Policies
- [ ] ☐ No mixed-content warnings in DevTools

## 12. Backend healthy

- [ ] ☐ `curl -fsS https://api.YOUR_DOMAIN.COM/api/v1/health` →
      `{ "success": true, ... "checks": { "db": {"ok": true}, "redis": {"ok": true} } }`
- [ ] ☐ API 404 handler returns JSON for unknown routes

## 13. Reverse proxy healthy

- [ ] ☐ `http://YOUR_DOMAIN.COM` → `https://YOUR_DOMAIN.COM` (301)
- [ ] ☐ `http://www.YOUR_DOMAIN.COM` → `https://YOUR_DOMAIN.COM` (301)
- [ ] ☐ `https://www.YOUR_DOMAIN.COM` → `https://YOUR_DOMAIN.COM` (301)
- [ ] ☐ API routes proxy correctly (`/api/v1/*`)
- [ ] ☐ Nginx security headers present (`X-Content-Type-Options`, CSP, etc.)
- [ ] ☐ Request-size limit (`client_max_body_size 110m`) allows uploads

## 14. HTTPS active

- [ ] ☐ `https://YOUR_DOMAIN.COM` and `https://api.YOUR_DOMAIN.COM` have valid
      Let's Encrypt certs (no browser warning)
- [ ] ☐ Certbot renewal cron installed and runs without error
- [ ] ☐ HTTP → HTTPS redirect works for the API subdomain too

## 15. Authentication works

- [ ] ☐ Register/Login on the production domain succeeds
- [ ] ☐ Cookie `accessToken`/`refreshToken` set with `Secure`, `HttpOnly`,
      `SameSite=Lax`, `Domain=.YOUR_DOMAIN.COM`
- [ ] ☐ `/api/v1/auth/refresh-token` refreshes the session
- [ ] ☐ Logout clears cookies on every relevant path/domain
- [ ] ☐ Cookie survives subdomain navigation between `app` and `api` domains

## 16. Socket.IO works (notifications)

- [ ] ☐ Frontend connects to `wss://api.YOUR_DOMAIN.COM/socket.io`
- [ ] ☐ Nginx proxies `Upgrade`/`Connection` headers (WebSocket)
- [ ] ☐ Creating a notification in one tab appears in another (realtime)
- [ ] ☐ Reconnect works after a network blip (no duplicate events)

## 17. Public routes work

- [ ] ☐ Homepage renders server + client content
- [ ] ☐ Public Donor directory/profile, Organization directory/profile,
      Blood-request tracking, Blog/Event/Gallery/Medical detail routes load
- [ ] ☐ Public search/filter endpoints return JSON

## 18. Donor works

- [ ] ☐ Donor can register/login, complete profile (division/district/upazila)
- [ ] ☐ Donor profile readiness reflects verification + location + affiliation
- [ ] ☐ Donor dashboard loads (posts, donations, requests, notifications)
- [ ] ☐ Donor blood-request submission + fulfillment works end to end

## 19. Organization works

- [ ] ☐ Organization dashboard loads for an org admin/member
- [ ] ☐ Blood-request management, donor-post moderation, content submissions
      (blog/event/gallery) work
- [ ] ☐ Organization inventory + donor-query + analytics load

## 20. Super Admin works

- [ ] ☐ Admin dashboard loads
- [ ] ☐ CRUD + Approvals (organization approvals, posts, events, etc.)
- [ ] ☐ Membership / position / governance management works

## 21. CI/CD works

- [ ] ☐ CI green on a pull request
- [ ] ☐ Push to `main` triggers CD (or manual `workflow_dispatch` deploys)
- [ ] ☐ GitHub Actions shows a successful deploy run with health output
- [ ] ☐ Failed build/CI does NOT deploy (guards in place)
- [ ] ☐ Rollback documented and rehearsed once (redeploy previous SHA)

## 22. Backup works

- [ ] ☐ `bash scripts/backup-postgres.sh` creates a non-empty `.dump`
- [ ] ☐ `crontab -l` shows the daily backup entry
- [ ] ☐ An off-VPS copy of backups exists (rclone/S3/B2/other)

## 23. Restart test passed

- [ ] ☐ `docker compose --env-file .env.production restart api worker web nginx`
      → all healthy afterwards
- [ ] ☐ Data created before restart still present (persistence confirmed)

## 24. VPS reboot persistence confirmed

- [ ] ☐ `sudo reboot` → all containers return automatically
- [ ] ☐ `postgres_data` and `redis_data` volumes intact
- [ ] ☐ Website + API healthy after reboot without manual intervention

---

## Final gate

- [ ] ☐ All the above are ☑ before announcing the deployment is live.
- [ ] ☐ `docker compose ps` showing healthy containers is NOT sufficient by
      itself — every functional box above must be verified from the real
      production domains.
