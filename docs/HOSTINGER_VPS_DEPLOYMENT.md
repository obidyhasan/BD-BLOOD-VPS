# BD Blood — Hostinger VPS production deployment

This runbook deploys the complete platform on one Ubuntu VPS with Docker
Compose. Nginx is the only public application container; PostgreSQL and Redis
remain on a private Docker network.

## 1. Production topology

| Service | Purpose | Public port |
| --- | --- | --- |
| Nginx | TLS, routing, WebSocket upgrade, compression, edge rate limit | 80, 443 |
| Web | Next.js standalone server | None |
| API | Express REST API and Socket.IO | None |
| Worker | SMS outbox and donor cooldown processing | None |
| PostgreSQL | Primary persistent database | None |
| Redis | Cache, OTP and transient coordination | None |
| Migrate / seed | Explicit one-shot jobs | None |

Persistent named volumes hold PostgreSQL, Redis, ACME challenges, and TLS
certificates. Uploaded media is stored by Cloudinary when that integration is
configured.

```text
Internet :80/:443
        |
      Nginx
       /  \
 Next.js  Express + Socket.IO
                 /       \
          PostgreSQL    Redis
                 \
                  Worker (also uses Redis and outbound providers)
```

## 2. VPS and DNS prerequisites

Use Ubuntu 24.04 LTS (or a currently supported Ubuntu LTS), at least 2 vCPU,
4 GB RAM, and enough SSD capacity for the database plus retained backups. In
Hostinger hPanel, configure the VPS firewall to allow SSH from a trusted source
and TCP 80/443 from the internet. Do not expose ports 3000, 5000, 5432, or 6379.

Create these DNS `A` records and wait until all resolve to the VPS IPv4 address:

| Name | Target |
| --- | --- |
| `example.com` | VPS IPv4 |
| `www.example.com` | VPS IPv4 |
| `api.example.com` | VPS IPv4 |

If AAAA records exist, they must reach this VPS too; otherwise remove them
before requesting certificates.

## 3. Secure the host

Sign in as the initial administrator, install updates, create a non-root deploy
user, and use SSH keys. Keep the current session open until a second login as
the new user succeeds.

```bash
sudo apt update && sudo apt full-upgrade -y
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

After key login works, disable password/root SSH login according to the
organization's access policy. Configure Hostinger snapshots separately; they
complement but do not replace database dumps.

## 4. Install Docker Engine and Compose

Install Docker Engine from Docker's official Ubuntu repository, including
Buildx and the Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

Verify both commands before proceeding:

```bash
docker --version
docker compose version
sudo usermod -aG docker deploy
```

Log out and back in for group membership to apply. Membership in the `docker`
group is root-equivalent; grant it only to the deployment account.

## 5. Copy the application and configure secrets

```bash
sudo mkdir -p /opt/bdblood
sudo chown deploy:deploy /opt/bdblood
git clone YOUR_PRIVATE_REPOSITORY_URL /opt/bdblood
cd /opt/bdblood
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit every placeholder in `.env.production`. Keep `POSTGRES_PASSWORD` and the
password embedded in `DATABASE_URL` identical. Generate each database, Redis,
JWT, and bootstrap secret independently:

```bash
openssl rand -hex 32
```

Important rules:

- `APP_DOMAIN` is the apex host; `API_DOMAIN` is its API host.
- `NEXT_PUBLIC_*` values are public and compiled into the browser bundle.
- `INTERNAL_API_URL` is set by Compose and must stay on the Docker service name.
- JWT secrets must be different and at least 32 characters.
- Optional Cloudinary, SMTP, MiM SMS, and Google OAuth groups must be either
  fully populated or fully empty.
- Never commit `.env.production`, database dumps, provider keys, or TLS keys.

Validate interpolation without starting anything:

```bash
docker compose --env-file .env.production config --quiet
```

## 6. Obtain the first TLS certificate

Nginx intentionally requires a real certificate, so bootstrap Let's Encrypt
before the first application deploy. Confirm DNS resolution and that port 80 is
free, then run:

```bash
cd /opt/bdblood
docker compose --env-file .env.production --profile tools \
  run --rm --service-ports certbot-init
```

The certificate includes the apex, `www`, and API host and is stored in the
`certbot_certs` named volume. If this command fails, correct DNS/firewall issues
before starting Nginx; do not substitute a checked-in private key.

## 7. First deployment

The deploy script builds immutable release-tagged images, starts data services,
runs migrations once, then starts and verifies API, worker, web, and proxy:

```bash
cd /opt/bdblood
bash scripts/deploy-production.sh
```

Migrations use committed Prisma migrations and never run inside API replicas.
Inspect the completed one-shot job and service health when needed:

```bash
docker compose --env-file .env.production ps -a
docker compose --env-file .env.production logs migrate
docker compose --env-file .env.production logs --tail=200 api worker web nginx
```

For manual recovery, the exact safe order used by the script is:

```bash
docker compose --env-file .env.production build api web nginx
docker compose --env-file .env.production up -d --wait postgres redis
docker compose --env-file .env.production run --rm --no-deps migrate
docker compose --env-file .env.production up -d api worker web nginx
```

### Deliberate initial seed

Seeding is not part of startup or routine deployments. After verifying the
production seed values, run it once:

```bash
docker compose --env-file .env.production --profile tools \
  run --rm --no-deps seed
```

Do not run demo seeds against production. Rotate/remove the seed admin password
from `.env.production` after the administrator has changed it if future seeding
does not require that account.

## 8. Verify the live deployment

```bash
curl -fsS https://api.example.com/api/v1/health
curl -fsSI https://example.com/
docker compose --env-file .env.production exec -T nginx nginx -t
docker compose --env-file .env.production ps
```

Also test login/logout, refresh after login, password reset, an image upload,
organization/admin authorization, and a real Socket.IO notification from two
browsers. Confirm requests use HTTPS and no mixed-content errors appear.

Walk through the public homepage, Organization, Medical, Blog, Event, and
Gallery routes; donor profile/requests/notifications; organization dashboard
request processing; and Super Admin management actions. Verify Prisma migration
status and required reference data without running any demo seed.

## 9. Certificate renewal

Install a root cron entry that checks twice daily. Certbot renews only when due;
the script then reloads Nginx without replacing containers.

```bash
sudo crontab -e
```

```cron
17 2,14 * * * cd /opt/bdblood && /usr/bin/bash scripts/renew-certificates.sh >> /var/log/bdblood-certbot.log 2>&1
```

Test it once with `bash scripts/renew-certificates.sh`.

## 10. Backups and restore drills

Create an encrypted/off-server destination in addition to local retention. The
provided script creates PostgreSQL custom-format dumps and deletes local dumps
older than 14 days by default:

```bash
BACKUP_DIR=/var/backups/bdblood BACKUP_RETENTION_DAYS=14 \
  bash scripts/backup-postgres.sh
```

Example daily root cron:

```cron
35 1 * * * cd /opt/bdblood && BACKUP_DIR=/var/backups/bdblood /usr/bin/bash scripts/backup-postgres.sh >> /var/log/bdblood-backup.log 2>&1
```

Copy completed dumps to encrypted remote storage and regularly test a restore on
a disposable environment. A production restore is intentionally explicit and
stops application writers:

```bash
bash scripts/restore-postgres.sh --confirm /absolute/path/to/bdblood_TIMESTAMP.dump
```

The restore uses `--clean --if-exists`; it replaces matching database objects.
Take a fresh dump first and schedule downtime.

## 11. Routine releases

Review migrations and release notes, back up the database, then:

```bash
cd /opt/bdblood
git fetch --all --prune
git checkout YOUR_RELEASE_TAG_OR_COMMIT
bash scripts/backup-postgres.sh
bash scripts/deploy-production.sh
```

The release tag defaults to the checked-out Git SHA and remains available in
the local image cache. Prune old images only after the rollback window closes.

## 12. Restart and reboot persistence test

After the first acceptance test, perform a controlled restart:

```bash
docker compose --env-file .env.production restart
docker compose --env-file .env.production ps
curl -fsS https://api.example.com/api/v1/health
```

Confirm database records persist, Redis returns healthy, authentication still
works, and the worker resumes. Then schedule one VPS reboot and repeat the same
checks. Docker is enabled at boot and long-running services use
`unless-stopped`; named volumes are not removed by restart or normal deploys.

## 13. Rollback

Application rollback does not reverse database migrations. First confirm the
old application is compatible with the current schema, then list available tags
and swap images:

```bash
docker image ls 'bdblood-*'
bash scripts/rollback-production.sh PREVIOUS_GIT_SHA
```

For a schema/data rollback, use an approved database recovery procedure and a
known-good pre-release dump; that is a destructive, downtime operation.

## 14. Operations and troubleshooting

Useful commands:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f --tail=200 api worker web nginx
docker compose --env-file .env.production stats
docker system df
df -h
free -h
```

- `migrate` failure: read its logs; never bypass a failed migration by starting
  API manually.
- Nginx certificate error: inspect the `certbot_certs` volume and ensure
  `APP_DOMAIN` exactly matches the certificate name.
- `502`: verify API/web health and inspect their logs before restarting.
- Socket disconnects: confirm `/socket.io/` reaches the API host and that the
  browser origin is present in `FRONTEND_URL`.
- Database/Redis connection errors: verify the data services are healthy and
  credentials match; neither service should have a host port mapping.
- Disk growth: inspect Docker logs, image layers, dumps, and PostgreSQL volume.

Docker rotates each container log at 10 MB with five files. The Compose memory
ceilings are conservative defaults for a 4 GB host; tune them from observed
usage, leaving capacity for the kernel, Docker, and build spikes.

## 15. Security maintenance

Apply host and container image updates on a regular maintenance schedule,
rotate application/provider secrets, review administrator access, verify backup
restore results, and monitor certificate expiry, disk capacity, service health,
HTTP error rate, login abuse, queue failures, and database latency. Keep the VPS,
Docker Engine, Node base images, PostgreSQL, Redis, and Nginx on supported patch
releases and test upgrades before production rollout.
