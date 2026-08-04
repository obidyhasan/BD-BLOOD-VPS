# BD Blood

A blood donation platform: Next.js frontend + Express/Prisma backend, with
Redis, Socket.io, Cloudinary, and SMS notification integrations.

```
bd-blood/
├── apps/
│   ├── web/     — Next.js 16 / React 19 frontend
│   └── api/     — Express 5 / Prisma 7 / PostgreSQL backend
├── infrastructure/
│   └── nginx/   — reverse proxy config for production
├── docs/
│   └── DEPLOYMENT.md
├── docker-compose.yml
├── .env.example
└── package.json — npm workspaces root
```

## Getting started

```bash
npm install
cp apps/api/.env.example apps/api/.env      # localhost defaults, fill in the rest
cp apps/web/.env.example apps/web/.env.local

npm run dev          # apps/api + apps/web together
```

(The repo-root `.env.example` and each app's `.env.production.example` are
for the production/Docker deployment — see `docs/DEPLOYMENT.md`. Each
app's plain `.env.example` is the one to use for local development.)

Individually:

```bash
npm run dev:api
npm run dev:web
```

## Common scripts (run from the repo root)

| Command                  | Does                                    |
|---------------------------|------------------------------------------|
| `npm run dev`              | Run both apps in watch mode             |
| `npm run build`            | Production build, both apps             |
| `npm run typecheck`        | `tsc --noEmit`, both apps               |
| `npm run lint`              | ESLint — `apps/web` only (see note below) |
| `npm run api:migrate:deploy` | Apply pending Prisma migrations       |
| `npm run api:migrate:status` | Check Prisma migration status         |
| `npm run api:seed`         | Run `apps/api`'s seed scripts directly  |

> `apps/api` has no ESLint configuration in the current codebase — this
> predates the monorepo migration and wasn't added as part of it.

## Production deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full VPS/Docker
deployment guide (Nginx, SSL, Postgres/Redis, backups, rollback).

## Architecture notes

- **npm workspaces** manage both apps from one root `package.json` and one
  `package-lock.json` — no Turborepo/pnpm, since there's no shared build
  graph to cache and both apps already used plain npm.
- No `packages/shared` — neither app has genuinely duplicated code worth
  extracting (see `docs/DEPLOYMENT.md`'s notes section for why).
- The backend's notification sweeper runs in-process (`setInterval`); there
  is no separate worker/queue service.
