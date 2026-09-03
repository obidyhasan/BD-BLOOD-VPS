#!/usr/bin/env bash
set -Eeuo pipefail

# Restore a BD Blood PostgreSQL backup (custom-format .dump produced by
# scripts/backup-postgres.sh) into the running `postgres` container.
#
# DANGER — this is a DESTRUCTIVE operation. It terminates existing
# connections, drops and recreates the target database, then restores.
# It is NOT part of routine deployment. Run it only when you intentionally
# want to overwrite current production data with a backup.
#
# Usage:
#   ./scripts/restore-postgres.sh /path/to/bdblood_YYYYMMDDTHHMMSSZ.dump
#
# Optional overrides:
#   ENV_FILE=/path/to/.env.production  (default: <repo>/.env.production)
#   TARGET_DB=bdblood                  (default: $POSTGRES_DB from the env file)
#
# The script stops the API/worker/web services first (so no active app
# connections hold the database open), restores inside a single transaction,
# then starts the services again.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.dump>" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy .env.production.example and fill it in first)." >&2
  exit 1
fi

cd "$ROOT_DIR"
compose=(docker compose --env-file "$ENV_FILE")

TARGET_DB="${TARGET_DB:-}"
if [[ -z "$TARGET_DB" ]]; then
  TARGET_DB="$(sed -n 's/^POSTGRES_DB=//p' "$ENV_FILE" | tail -n1 | tr -d '\r')"
fi
if [[ -z "$TARGET_DB" ]]; then
  echo "Cannot determine target database. Set TARGET_DB explicitly or POSTGRES_DB in $ENV_FILE." >&2
  exit 1
fi

# Stop app services that hold DB connections so DROP DATABASE can succeed.
echo ">>> Stopping api/worker/web before restore..."
"${compose[@]}" stop api worker web || true

echo ">>> Dropping and recreating database '$TARGET_DB' (DESTRUCTIVE — Ctrl+C now to abort)..."
# DESTRUCTIVE: terminates any remaining connections, drops and recreates the
# DB, then restores. Never run as part of routine deployment/updates.
"${compose[@]}" exec -T postgres sh -c \
  "psql -v ON_ERROR_STOP=1 -U \"\$POSTGRES_USER\" -d postgres \
    -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '\$1' AND pid <> pg_backend_pid();\" \
    -c \"DROP DATABASE IF EXISTS \\\"\$1\\\";\" \
    -c \"CREATE DATABASE \\\"\$1\\\" OWNER \\\"\$POSTGRES_USER\\\";\"" sh "$TARGET_DB"

echo ">>> Restoring $BACKUP_FILE into '$TARGET_DB'..."
# The dump is created with --no-owner --no-privileges, so restoring as the
# container's POSTGRES_USER is sufficient. A single transaction keeps it atomic.
"${compose[@]}" exec -T postgres sh -c \
  'exec pg_restore --no-owner --no-privileges --single-transaction -U "$POSTGRES_USER" -d "$1"' sh "$TARGET_DB" \
  < "$BACKUP_FILE"

echo ">>> Restarting api/worker/web..."
"${compose[@]}" start api worker web

echo ">>> Restore complete."
