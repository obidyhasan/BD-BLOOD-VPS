# syntax=docker/dockerfile:1
#
# Build from the REPO ROOT, not this directory:
#   docker build -f apps/api/Dockerfile -t bd-blood-api .
# (docker-compose.yml at the repo root is already configured this way.)
#
# npm workspaces resolve and hoist dependencies across the whole repo, so
# the install step needs every workspace's package.json present, not just
# apps/api's — hence the root-context build.

FROM node:22-bookworm-slim AS base
WORKDIR /repo
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# ---- Dependencies -------------------------------------------------------
# --ignore-scripts is required here: apps/api's postinstall runs
# `prisma generate`, which needs prisma/schema/ — not copied in yet at
# this layer. Running it prematurely would fail the build. It's run
# explicitly in the builder stage instead, once the schema is present.
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --ignore-scripts

# ---- Build ----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /repo ./
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src

WORKDIR /repo/apps/api
# Generates the Prisma client into /repo/node_modules/@prisma/client and
# /repo/node_modules/.prisma/client (hoisted to the workspace root).
RUN npx prisma generate
# Compiles TypeScript and copies the EJS email templates into dist/
# (see apps/api/package.json's "build" script).
RUN npm run build

WORKDIR /repo
# Removes devDependencies (typescript, tsx, ts-node-dev, @types/*) from the
# single node_modules tree in place — the already-generated Prisma client
# lives under "dependencies" (@prisma/client, prisma), so it survives this
# prune intact. This is why a separate from-scratch "prod install" stage
# would be wrong here: it would produce a node_modules tree that never had
# `prisma generate` run against it.
RUN npm prune --omit=dev

# ---- Runtime ----------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs expressjs

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma
COPY --from=builder /repo/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

USER expressjs
WORKDIR /repo/apps/api

EXPOSE 5000

# `prisma migrate deploy` only applies already-committed, forward
# migrations — never destructive. `prisma` was intentionally moved from
# devDependencies to dependencies in apps/api/package.json specifically so
# the CLI survives the `npm prune --omit=dev` above and is available here.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
