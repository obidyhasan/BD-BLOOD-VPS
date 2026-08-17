#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
cd "$ROOT_DIR"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/bdblood_$(date -u +%Y%m%dT%H%M%SZ).dump"
compose=(docker compose --env-file "$ENV_FILE")

"${compose[@]}" exec -T postgres sh -c \
  'exec pg_dump -Fc --no-owner --no-privileges -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$backup_file"
test -s "$backup_file"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'bdblood_*.dump' -mtime "+$RETENTION_DAYS" -delete
echo "Backup created: $backup_file"
