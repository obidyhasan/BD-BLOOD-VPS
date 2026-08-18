# BD Blood VPS Docker final report

## Existing deployment problems found

- API startup ran migrations and optional seeds, creating replica races and a
  risk of unintended production writes.
- The documented first TLS flow could not start Nginx because its configuration
  referenced certificates that did not exist yet.
- The frontend dependency image triggered the API Prisma postinstall before the
  schema was copied.
- Server-side Next.js traffic used the public API URL instead of Docker DNS.
- Nginx configuration hardcoded placeholder domains and did not safely bootstrap
  Let's Encrypt.
- PostgreSQL/Redis persistence existed, but the stack lacked consistent resource
  ceilings, log rotation, explicit data/edge network separation, and one-source
  production environment configuration.
- API health exposed dependency error text; shutdown did not explicitly close
  Socket.IO, and worker shutdown did not wait for in-flight jobs.
- Proxy trust was registered too late for rate limiting to reliably use the real
  client IP, and access logs included sensitive query strings.
- Existing deployment documentation described obsolete automatic seed and
  migration behavior.

## Final Docker architecture

```text
Internet -> Nginx :80/:443 -> Next.js :3000
                         \-> Express + Socket.IO :5000
                                      |-> PostgreSQL :5432 (private, persistent)
                                      |-> Redis :6379 (private, persistent)
                  Worker ------------|-> outbound SMS/provider network

One-shot jobs: migrate; explicit profile-only seed; certbot init/renew
```

Only Nginx publishes normal runtime ports. PostgreSQL and Redis live exclusively
on the internal `data` network. Nginx, API, and web share `edge`; the worker has
a separate outbound-capable network for provider calls.

## Containers created or modified

| Service | Image/runtime | Responsibility |
| --- | --- | --- |
| `postgres` | PostgreSQL 17 | Persistent primary database |
| `redis` | Redis 7 | Auth/cache/OTP transient state with AOF persistence |
| `migrate` | API image, one-shot | `prisma migrate deploy` |
| `seed` | API image, tools profile | Deliberate reference/admin seed only |
| `api` | Non-root Node 22 | Express API and Socket.IO |
| `worker` | Non-root API image | Durable message outbox and cooldown jobs |
| `web` | Non-root Node 22 standalone | Next.js production server |
| `nginx` | Custom Nginx image | HTTPS reverse proxy and edge controls |
| `certbot-init` / `certbot-renew` | Certbot | TLS bootstrap and renewal jobs |

## Dockerfile optimizations

- API and web use deterministic `npm ci --ignore-scripts` dependency layers
  keyed by workspace manifests and lockfile.
- Prisma generation runs only after the schema is present.
- API compiles TypeScript and prunes development dependencies before runtime.
- Web uses Next.js standalone output and copies only its server, static, and
  public runtime assets.
- Both Node application images run as dedicated non-root users.
- `.dockerignore` excludes VCS metadata, environments, caches, outputs, tests,
  logs, backups, editor state, and unrelated documentation.
- Nginx has a small independent build context and environment-rendered template.

## Docker Compose changes

- Centralized all production values in root `.env.production` interpolation;
  backend secrets are not passed to the web container.
- Added health-aware startup, dedicated migration ownership, explicit seed/tools
  profiles, restart policies, stop grace periods, memory ceilings, and rotated
  JSON logs.
- Added `edge`, internal `data`, and `outbound` networks.
- Added immutable Git-SHA-compatible image tags and reusable API environment and
  logging anchors.
- PostgreSQL and Redis have no host port mappings.

## PostgreSQL configuration

PostgreSQL uses `postgres_data`, UTF-8/C locale initialization, UTC, a
`pg_isready` healthcheck, 256 MB shared memory, a 1 GB default memory ceiling,
and a 60-second shutdown grace period. `DATABASE_URL` includes a conservative
ten-connection limit suitable for the API plus worker on a small VPS.

## Redis configuration

Redis requires authentication, uses `redis_data`, AOF `everysec`, periodic
snapshots, a 192 MB default max-memory setting with `volatile-lru`, a protected
healthcheck, and a 256 MB container ceiling. It has no public port.

## Worker configuration

The worker remains separate from the API so web replicas do not duplicate its
timers. It tracks in-flight outbox/cooldown work, stops scheduling on SIGTERM or
SIGINT, waits for active jobs, then disconnects Prisma. Compose gives it a
30-second stop window and no public interface.

## Reverse proxy

The environment-rendered Nginx configuration routes apex traffic to web and the
API subdomain to Express. It explicitly upgrades `/socket.io/`, disables proxy
buffering for long-lived connections, passes standard forwarded headers,
supports uploads up to the application's aggregate limit, enables gzip, applies
security headers, and adds a modest IP rate limit in front of Express limits.
Logs go to stdout/stderr with query strings deliberately omitted.

## SSL

`certbot-init` obtains the initial apex/`www`/API certificate on standalone port
80 before Nginx starts. Runtime HTTP redirects to HTTPS; `www` redirects to the
apex. `certbot-renew` uses the shared ACME webroot and the renewal script reloads
Nginx. Certificates remain in named volumes and are never copied into images.

## Environment changes

The safe root `.env.production.example` documents application domains, public
build-time URLs, database/Redis credentials, CORS/cookie URLs, bcrypt, distinct
JWT/bootstrap secrets, optional Cloudinary/SMTP/SMS/Google groups, explicit
seed values, and resource ceilings. Production API startup rejects invalid
database schemes, short/placeholder/duplicate security secrets, non-HTTPS URLs,
invalid cookie domains, weak bcrypt settings, and partially configured provider
groups.

`NEXT_PUBLIC_*` values require an image rebuild. `AUTH_COOKIE_DOMAIN` and the
internal `http://api:5000/api/v1` route are runtime server values.

## Security improvements

- Runtime secrets are injected explicitly and excluded from build contexts.
- API/web run non-root with `no-new-privileges`; internal stores are not public.
- Express trusts exactly one proxy hop before rate limiting and cookie handling.
- CORS remains an exact configured origin list for HTTP and Socket.IO.
- TLS, HSTS, frame denial, MIME sniffing, referrer, and permissions headers are
  applied at the edge while Helmet remains active in Express.
- Public health responses no longer leak raw database/Redis error details.
- Automatic startup/demo seeding is removed.

## Performance improvements

- Next.js server rendering uses the internal API route while browsers use the
  public HTTPS endpoint.
- Standalone web output and pruned API dependencies reduce runtime image payload.
- Cached dependency layers avoid reinstalling packages for ordinary source edits.
- Gzip, keep-alive, resource ceilings, connection limits, Redis eviction, and
  bounded log storage suit a small VPS.
- Existing Prisma singleton, application cache invalidation, scoped rate limits,
  indexes, and bounded worker processing remain intact.

## Persistence

`postgres_data`, `redis_data`, `certbot_www`, and `certbot_certs` survive image
replacement, container recreation, `docker compose down` without `-v`, service
restart, and VPS reboot. Cloudinary remains the durable media store; the app has
no required local upload volume.

## Migration strategy

The deployment script starts healthy PostgreSQL/Redis, runs the one-shot
`migrate` container exactly once, then starts API/worker/web/Nginx. API replicas
only execute `node dist/server.js`. Migrations are forward-only and committed;
development migration/reset commands are never used. Reference seeding is a
separate manual tools-profile command, and demo seeding is excluded.

## Backup strategy

`scripts/backup-postgres.sh` creates timestamped custom-format `pg_dump` files
outside the database volume with configurable retention. Operators must copy
them to encrypted off-server storage. `scripts/restore-postgres.sh` requires an
explicit confirmation flag, stops application writers, and uses
`pg_restore --clean --if-exists`. Restore drills are part of the checklist.

## Deployment commands

```bash
cp .env.production.example .env.production
chmod 600 .env.production
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production --profile tools run --rm --service-ports certbot-init
bash scripts/deploy-production.sh
docker compose --env-file .env.production --profile tools run --rm --no-deps seed  # first deploy only, if required
```

Routine update:

```bash
git fetch --all --prune
git checkout YOUR_RELEASE_TAG_OR_COMMIT
bash scripts/backup-postgres.sh
bash scripts/deploy-production.sh
```

Backup, restore, and rollback:

```bash
bash scripts/backup-postgres.sh
bash scripts/restore-postgres.sh --confirm /absolute/path/to/bdblood_TIMESTAMP.dump
bash scripts/rollback-production.sh PREVIOUS_GIT_SHA
```

## Validation results

- `docker compose --env-file .env.production.example config --quiet`: passed.
- Rendered services/profiles/networks/ports/memory values: passed; only Nginx
  publishes 80/443 in the normal stack and `data` is internal.
- API tests: 90 passed, 0 failed, 1 skipped because `TEST_DATABASE_URL` is not set.
- API and web TypeScript checks: passed.
- API and Next.js production builds: passed; all 75 pages generated.
- Web ESLint: passed with 0 errors and 9 existing third-party React Compiler
  compatibility warnings.
- `git diff --check`: passed.
- Compiled production seed entrypoint exists at the path used by Compose.
- Docker image build/container startup could not run in this workstation session
  because the Docker Desktop Linux daemon is not running. Compose reached the
  daemon connection step; this is an environment verification limitation, not a
  repository build error. Image build and live health/TLS checks must be run on
  the VPS before go-live.

## Remaining external requirements

- Hostinger VPS/IP, SSH access, supported Ubuntu host, and running Docker daemon.
- Real apex/`www`/API DNS records and a reachable TCP 80/443 firewall policy.
- Strong production secrets and final operator/admin identity values.
- Production Cloudinary, SMTP, MiM SMS, and/or Google OAuth credentials for the
  integrations that will be enabled.
- Let's Encrypt issuance, a real database backup destination, monitoring/alert
  ownership, and completion of live auth/Socket.IO/business-flow acceptance.
