# Deployment

BD Blood deploys to a Hostinger VPS with Docker Compose + Nginx (HTTPS via
Let's Encrypt) and GitHub Actions for CI/CD.

## Canonical production guides (repo root)

| Guide | Purpose |
| --- | --- |
| [`HOSTINGER_VPS_DEPLOYMENT.md`](../HOSTINGER_VPS_DEPLOYMENT.md) | Full first-deployment + operations guide |
| [`HOSTINGER_VPS_COMMANDS.md`](../HOSTINGER_VPS_COMMANDS.md) | Copy/paste command reference (A–Q sections) |
| [`HOSTINGER_VPS_DEPLOYMENT_CHECKLIST.md`](../HOSTINGER_VPS_DEPLOYMENT_CHECKLIST.md) | Go-live verification checklist |

## Deployment architecture in one picture

```text
GitHub (push to main)
  → GitHub Actions CI (typecheck/lint/tests/builds/docker)
  → GitHub Actions CD (SSH → VPS)
      → scripts/deploy-production.sh
          → docker compose build api web nginx
          → postgres + redis up (named volumes)
          → migrate (prisma migrate deploy, one-shot)
          → api + worker up
          → web up
          → nginx up (only public ingress :80/:443)
```

## The one deployment path

`docker-compose.yml` at the repo root is the single source of truth.
`docker-compose.prod.yml` is a thin production wrapper that `include`s it.

```bash
# First time on a fresh VPS
cp .env.production.example .env.production   # fill real values
docker compose --env-file .env.production --profile tools run --rm certbot-init
IMAGE_TAG="$(git rev-parse --short HEAD)" bash scripts/deploy-production.sh
bash scripts/seed-production.sh               # one-shot reference seed

# Every later update
git pull --ff-only
IMAGE_TAG="$(git rev-parse --short HEAD)" bash scripts/deploy-production.sh
```

## Safety rules

- Routine deploys never remove volumes: no `down -v`, `volume rm`,
  `migrate reset`, or `migrate dev` in production.
- PostgreSQL and Redis stay on the private `data` network (not internet
  reachable); only Nginx publishes `80`/`443`.
- `.env.production` lives only on the VPS and is git-ignored.
