#!/usr/bin/env bash
# Online PostgreSQL backup (pg_dump custom format) from the running compose stack.
# Safe to run while the app is serving traffic (consistent snapshot, no locks on writes).
#
# Usage:
#   ./infrastructure/scripts/backup-db.sh
#
# Settings (from .env): BACKUP_DIR (default ./backups), BACKUP_RETENTION_DAYS (default 14).
# Output: <BACKUP_DIR>/<db>_<UTC timestamp>.dump (+ .sha256), mode 600.
# Cron example (daily 03:15):
#   15 3 * * * cd /opt/ehans && ./infrastructure/scripts/backup-db.sh >> /var/log/ehans-backup.log 2>&1
#
# Copy backups OFF the server (object storage, another host). A backup that only
# lives on the same disk as the database is not a backup.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_cmd docker
require_env_file
cd "${REPO_ROOT}"

BACKUP_DIR="$(env_value BACKUP_DIR ./backups)"
RETENTION_DAYS="$(env_value BACKUP_RETENTION_DAYS 14)"
DB_NAME="$(env_value POSTGRES_DB)"
[[ -n "${DB_NAME}" ]] || die "POSTGRES_DB is not set in ${ENV_FILE}"
[[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]] || die "BACKUP_RETENTION_DAYS must be a number"

umask 077
mkdir -p "${BACKUP_DIR}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
PARTIAL="${TARGET}.partial"
trap 'rm -f "${PARTIAL}"' ERR

[[ -n "$(compose ps -q postgres)" ]] || die "postgres container is not running"

log "Dumping database '${DB_NAME}' to ${TARGET}"
# Credentials are read inside the container from its own environment; nothing secret
# appears in this script, its arguments, or the process list.
# shellcheck disable=SC2016  # variables must expand inside the container, not here
compose exec -T postgres sh -c \
  'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --compress=6 --no-owner --no-privileges' \
  > "${PARTIAL}"

[[ -s "${PARTIAL}" ]] || die "Backup file is empty"

log "Verifying archive"
compose exec -T postgres pg_restore --list > /dev/null < "${PARTIAL}" \
  || die "pg_restore could not read the archive; backup is corrupt"

mv "${PARTIAL}" "${TARGET}"
( cd "${BACKUP_DIR}" && sha256sum "$(basename "${TARGET}")" > "$(basename "${TARGET}").sha256" )
chmod 600 "${TARGET}" "${TARGET}.sha256"
log "Backup OK: ${TARGET} ($(du -h "${TARGET}" | cut -f1))"

if (( RETENTION_DAYS > 0 )); then
  log "Pruning backups older than ${RETENTION_DAYS} days in ${BACKUP_DIR}"
  # Only files produced by this script (strict name pattern) are ever deleted.
  find "${BACKUP_DIR}" -maxdepth 1 -type f \
    \( -name "${DB_NAME}_????????T??????Z.dump" -o -name "${DB_NAME}_????????T??????Z.dump.sha256" \) \
    -mtime +"${RETENTION_DAYS}" -print -delete
fi
