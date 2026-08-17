#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${1:-}" != "--confirm" || -z "${2:-}" ]]; then
  echo "Usage: $0 --confirm /absolute/path/to/bdblood_TIMESTAMP.dump" >&2
  echo "WARNING: restore replaces objects in the configured production database." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
backup_file="$(realpath "$2")"
cd "$ROOT_DIR"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
[[ -f "$backup_file" && -s "$backup_file" ]] || { echo "Invalid backup file" >&2; exit 1; }
compose=(docker compose --env-file "$ENV_FILE")

"${compose[@]}" stop api worker web
"${compose[@]}" exec -T postgres sh -c \
  'exec pg_restore --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < "$backup_file"
"${compose[@]}" up -d api worker web
echo "Restore completed from: $backup_file"
