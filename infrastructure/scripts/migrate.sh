#!/usr/bin/env bash
# Production database migrations. Only ever runs `prisma migrate deploy` / `status`.
# `prisma migrate dev`, `migrate reset` and `db push` are development-only and must
# never be run against production.
#
# Usage:
#   ./infrastructure/scripts/migrate.sh           # apply pending committed migrations
#   ./infrastructure/scripts/migrate.sh status    # show migration status

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_cmd docker
require_env_file
cd "${REPO_ROOT}"

case "${1:-deploy}" in
  deploy)
    log "Building migrator image"
    compose --profile tools build migrate
    log "Running prisma migrate deploy"
    compose --profile tools run --rm migrate
    ;;
  status)
    compose --profile tools run --rm migrate node_modules/.bin/prisma migrate status
    ;;
  *)
    die "Unknown command '${1}'. Use: deploy | status"
    ;;
esac
