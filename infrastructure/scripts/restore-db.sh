#!/usr/bin/env bash
# Restore a pg_dump custom-format backup produced by backup-db.sh.
#
# Usage:
#   # Rehearse: restore into a separate scratch database (production data untouched)
#   ./infrastructure/scripts/restore-db.sh backups/ehans_20260101T031500Z.dump --target-db ehans_restore_test
#
#   # Real restore into the production database (DESTRUCTIVE, asks for confirmation)
#   ./infrastructure/scripts/restore-db.sh backups/ehans_20260101T031500Z.dump
#
# Safety:
#   - verifies the checksum and archive before touching anything
#   - restoring into the production DB requires typing the database name
#   - takes a fresh safety backup of the current database first
#   - stops backend/frontend during the restore and restarts them afterwards
#   - restores in a single transaction: on any error, nothing is changed

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

usage() { sed -n '2,16p' "$0"; exit 1; }

BACKUP_FILE="${1:-}"; shift || true
TARGET_DB=""
while (( $# )); do
  case "$1" in
    --target-db) TARGET_DB="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) die "Unknown argument: $1" ;;
  esac
done
[[ -n "${BACKUP_FILE}" ]] || usage
[[ -f "${BACKUP_FILE}" ]] || die "Backup file not found: ${BACKUP_FILE}"

require_cmd docker
require_env_file
cd "${REPO_ROOT}"

PROD_DB="$(env_value POSTGRES_DB)"
TARGET_DB="${TARGET_DB:-${PROD_DB}}"
[[ "${TARGET_DB}" =~ ^[a-zA-Z_][a-zA-Z0-9_]{0,62}$ ]] || die "Invalid database name: ${TARGET_DB}"
[[ -n "$(compose ps -q postgres)" ]] || die "postgres container is not running"

if [[ -f "${BACKUP_FILE}.sha256" ]]; then
  log "Verifying checksum"
  ( cd "$(dirname "${BACKUP_FILE}")" && sha256sum --check --status "$(basename "${BACKUP_FILE}").sha256" ) \
    || die "Checksum mismatch for ${BACKUP_FILE}"
else
  warn "No checksum file found; skipping checksum verification"
fi

log "Verifying archive"
compose exec -T postgres pg_restore --list > /dev/null < "${BACKUP_FILE}" \
  || die "Not a valid pg_dump custom-format archive: ${BACKUP_FILE}"

APPS_STOPPED=0
restart_apps() {
  if (( APPS_STOPPED )); then
    log "Restarting application containers"
    compose up -d backend frontend || warn "Failed to restart apps; run: docker compose up -d"
  fi
}
trap restart_apps EXIT

if [[ "${TARGET_DB}" == "${PROD_DB}" ]]; then
  warn "This will REPLACE all data in the production database '${PROD_DB}'."
  read -r -p "Type the database name to continue: " CONFIRM
  [[ "${CONFIRM}" == "${PROD_DB}" ]] || die "Confirmation did not match; aborting."

  log "Taking safety backup of current database"
  "${SCRIPT_DIR}/backup-db.sh"

  log "Stopping application containers"
  compose stop backend frontend
  APPS_STOPPED=1
else
  log "Creating scratch database '${TARGET_DB}' if missing"
  compose exec -T postgres sh -c \
    "psql -v ON_ERROR_STOP=1 --username=\"\$POSTGRES_USER\" --dbname=postgres -tc \"SELECT 1 FROM pg_database WHERE datname='${TARGET_DB}'\" | grep -q 1 \
     || createdb --username=\"\$POSTGRES_USER\" '${TARGET_DB}'"
fi

log "Restoring ${BACKUP_FILE} into '${TARGET_DB}'"
compose exec -T postgres sh -c \
  "pg_restore --username=\"\$POSTGRES_USER\" --dbname='${TARGET_DB}' --clean --if-exists --no-owner --no-privileges --single-transaction --exit-on-error" \
  < "${BACKUP_FILE}"

log "Restore complete into '${TARGET_DB}'"
if [[ "${TARGET_DB}" != "${PROD_DB}" ]]; then
  log "Inspect it with: docker compose exec postgres psql -U \"\$POSTGRES_USER\" -d ${TARGET_DB}"
  log "Drop it when done: docker compose exec postgres dropdb -U \"\$POSTGRES_USER\" ${TARGET_DB}"
fi
