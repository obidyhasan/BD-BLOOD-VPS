# syntax=docker/dockerfile:1
#
# Build from the REPO ROOT, not this directory:
#   docker build -f apps/web/Dockerfile -t bd-blood-web .
# (docker-compose.yml at the repo root is already configured this way.)

FROM node:22-bookworm-slim AS base
WORKDIR /repo

# ---- Dependencies -------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
# The API workspace postinstall needs a Prisma schema that is intentionally
# absent from this frontend dependency layer. Web does not need that script.
RUN npm ci --ignore-scripts

# ---- Build ----------------------------------------------------------------
# NEXT_PUBLIC_* variables are inlined into the client bundle at build time —
# passed as build args so the compiled output points at the right
# backend/socket URLs. AUTH_COOKIE_DOMAIN is intentionally excluded: it's
# server-only and read at container runtime instead (docker-compose env),
# like any other server secret.
FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN test -n "$NEXT_PUBLIC_API_URL" \
 && test -n "$NEXT_PUBLIC_SOCKET_URL" \
 && test -n "$NEXT_PUBLIC_APP_URL"

COPY --from=deps /repo ./
COPY apps/web ./apps/web
RUN npm run build --workspace apps/web

# ---- Runtime ----------------------------------------------------------
# In an npm-workspaces monorepo, Next's standalone output nests server.js
# under the workspace's path (.next/standalone/apps/web/server.js) rather
# than at the standalone root, and does NOT include the public/ or
# .next/static/ directories — both documented Next.js monorepo behaviors,
# not specific to this app. Each is copied into the matching nested path
# below so the layout inside the image matches what server.js expects.
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "if [ -z \"$AUTH_COOKIE_DOMAIN\" ] || [ -z \"$INTERNAL_API_URL\" ]; then echo 'AUTH_COOKIE_DOMAIN and INTERNAL_API_URL are required' >&2; exit 1; fi; exec node apps/web/server.js"]
