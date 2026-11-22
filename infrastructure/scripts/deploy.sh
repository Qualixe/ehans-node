#!/usr/bin/env bash
# Build and (re)deploy the production stack on the VPS.
#
# Usage (from the repository root on the server, after `git pull`):
#   ./infrastructure/scripts/deploy.sh            # backup -> build -> migrate -> up
#   ./infrastructure/scripts/deploy.sh --no-backup
#
# Order matters: images are built BEFORE anything is stopped, the database is backed
# up and migrated BEFORE new app containers start, and the script stops at the first
# failure so a broken build never replaces running containers.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

DO_BACKUP=1
for arg in "$@"; do
  case "${arg}" in
    --no-backup) DO_BACKUP=0 ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    *) die "Unknown argument: ${arg}" ;;
  esac
done

require_cmd docker
require_env_file
cd "${REPO_ROOT}"

log "Validating compose configuration"
compose config --quiet

log "Building images (APP_VERSION=$(env_value APP_VERSION latest))"
compose --profile tools build

log "Starting PostgreSQL"
compose up -d postgres
wait_healthy postgres 120

if (( DO_BACKUP )); then
  log "Taking pre-deploy database backup"
  "${SCRIPT_DIR}/backup-db.sh"
fi

log "Applying database migrations (prisma migrate deploy)"
compose --profile tools run --rm migrate

log "Starting application containers"
compose up -d --remove-orphans backend frontend
wait_healthy backend 120
wait_healthy frontend 120

log "Removing dangling images"
docker image prune -f >/dev/null

compose ps
log "Deploy complete"
