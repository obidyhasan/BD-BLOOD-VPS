#!/usr/bin/env bash
set -Eeuo pipefail

# Runs the REQUIRED reference/production seed (geography, blood groups,
# achievements, canonical organizations, single Super Admin) as an explicit
# one-shot command inside the Docker `seed` service.
#
# This is NOT demo data and it is NOT run automatically on every deploy.
# Run it once after the first production migration (and again only if a future
# release adds new canonical/reference seed content that needs backfilling).
# The individual seed functions are written to be safe/idempotent to re-run.
#
# Usage:
#   ./scripts/seed-production.sh
#
# Optional:
#   ENV_FILE=/path/to/.env.production

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and fill it in first." >&2
  exit 1
fi

compose=(docker compose --env-file "$ENV_FILE")

echo ">>> Running the one-shot production reference seed..."
# `--profile tools` enables the `seed` service (defined with profiles:[tools]
# in docker-compose.yml). `run --rm` keeps it one-shot and removes the
# container afterwards.
"${compose[@]}" --profile tools run --rm seed

echo ">>> Reference seed completed successfully."
