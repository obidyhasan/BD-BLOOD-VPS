#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill it first." >&2
  exit 1
fi
if grep -Eq 'YOUR_DOMAIN|example\.com|replace-with|XXXXXXXX' "$ENV_FILE"; then
  echo "Production environment still contains example/placeholder values." >&2
  exit 1
fi

compose=(docker compose --env-file "$ENV_FILE")
export IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)}"

"${compose[@]}" config --quiet
"${compose[@]}" build --pull api web nginx
"${compose[@]}" up -d --wait postgres redis
"${compose[@]}" run --rm --no-deps migrate
"${compose[@]}" up -d --no-deps api worker
"${compose[@]}" up -d --no-deps --wait api
"${compose[@]}" up -d --no-deps web
"${compose[@]}" up -d --no-deps --wait web
"${compose[@]}" up -d --no-deps nginx

"${compose[@]}" exec -T api node -e \
  "require('http').get('http://127.0.0.1:5000/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
"${compose[@]}" exec -T web node -e \
  "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
"${compose[@]}" exec -T nginx nginx -t
"${compose[@]}" ps

echo "Deployment completed with image tag: $IMAGE_TAG"
