#!/usr/bin/env bash
set -Eeuo pipefail

# Installs a daily crontab entry that runs scripts/backup-postgres.sh for the
# given deployment user. Backups land in <repo>/backups (also .gitignored)
# with a 14-day retention (override with BACKUP_RETENTION_DAYS).
#
# Recommended: additionally sync /home/deploy/bd-blood/backups to an
# off-VPS location (S3/R2/B2/rsync) — a backup only counts if it survives the
# VPS. See HOSTINGER_VPS_DEPLOYMENT.md → "PostgreSQL Backup".
#
# Usage (run ONCE as the deploy user on the VPS):
#   bash scripts/install-backup-cron.sh
#
# Env overrides:
#   ENV_FILE   path to .env.production   (default <repo>/.env.production)
#   BACKUP_HOUR  hour of day (0-23)      (default 3 = 03:00 Asia/Dhaka after TZ)
#   BACKUP_RETENTION_DAYS                (default 14)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
BACKUP_HOUR="${BACKUP_HOUR:-3}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Refusing to install a cron job for a broken env file." >&2
  exit 1
fi

SCRIPT="$(realpath "$ROOT_DIR/scripts/backup-postgres.sh")"
CRON_LINE="0 $BACKUP_HOUR * * * cd $ROOT_DIR && ENV_FILE=$ENV_FILE BACKUP_RETENTION_DAYS=$RETENTION bash $SCRIPT >> $ROOT_DIR/backups/backup-cron.log 2>&1"

# Ensure the backups dir exists so the log redirect can never fail.
mkdir -p "$ROOT_DIR/backups"

# Add/update the crontab entry idempotently (keyed on the unique marker).
TMP_CRON="$(mktemp)"
trap 'rm -f "$TMP_CRON"' EXIT

crontab -l 2>/dev/null | grep -v "scripts/backup-postgres.sh" > "$TMP_CRON" || true
echo "$CRON_LINE # bdblood-backup" >> "$TMP_CRON"
crontab "$TMP_CRON"

echo "Installed cron (daily at ${BACKUP_HOUR}:00 server time):"
echo "  $CRON_LINE"
echo
echo "Verify with: crontab -l"
echo "Run once manually first: bash $SCRIPT"
