#!/usr/bin/env bash
set -Eeuo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: $0 IMAGE_TAG" >&2
  echo "The tag must already exist locally for api, worker, web, and proxy images." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
cd "$ROOT_DIR"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }

export IMAGE_TAG="$1"
compose=(docker compose --env-file "$ENV_FILE")
for image in bdblood-api bdblood-web bdblood-proxy; do
  docker image inspect "$image:$IMAGE_TAG" >/dev/null
done

# Database migrations are forward-only. This swaps application images but does
# not reverse the schema; only use a version compatible with the current schema.
"${compose[@]}" up -d --no-deps api worker web nginx
"${compose[@]}" up -d --no-deps --wait api web
"${compose[@]}" exec -T nginx nginx -t
"${compose[@]}" ps
echo "Application images rolled back to: $IMAGE_TAG"
