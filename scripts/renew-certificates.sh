#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
cd "$ROOT_DIR"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
compose=(docker compose --env-file "$ENV_FILE" --profile tools)
"${compose[@]}" run --rm certbot-renew
"${compose[@]}" exec -T nginx nginx -s reload
echo "Certificate renewal check completed and Nginx reloaded."
