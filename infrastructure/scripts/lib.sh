#!/usr/bin/env bash
# Shared helpers for infrastructure scripts. Sourced, not executed.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-${REPO_ROOT}/docker-compose.yml}"

log()  { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
warn() { printf '[%s] WARN: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die()  { printf '[%s] ERROR: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; exit 1; }

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

require_env_file() {
  [[ -f "${ENV_FILE}" ]] || die "Missing ${ENV_FILE}. Copy .env.example to .env and fill in real values."
  local perms
  perms="$(stat -c '%a' "${ENV_FILE}" 2>/dev/null || echo '')"
  if [[ -n "${perms}" && "${perms}" != "600" && "${perms}" != "400" ]]; then
    warn "${ENV_FILE} has permissions ${perms}; run: chmod 600 ${ENV_FILE}"
  fi
  if grep -q 'CHANGE_ME' "${ENV_FILE}"; then
    die "${ENV_FILE} still contains CHANGE_ME placeholders."
  fi
}

# Reads KEY from .env without executing the file (never `source` .env).
env_value() {
  local key="$1" default="${2:-}" line
  line="$(grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null | tail -n 1 || true)"
  local value="${line#*=}"
  value="${value%\"}"; value="${value#\"}"
  printf '%s' "${value:-${default}}"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

# Waits until a compose service reports healthy (or fails after timeout seconds).
wait_healthy() {
  local service="$1" timeout="${2:-120}" waited=0 status cid
  while (( waited < timeout )); do
    cid="$(compose ps -q "${service}")"
    status="$( [[ -n "${cid}" ]] && docker inspect -f '{{.State.Health.Status}}' "${cid}" 2>/dev/null || echo 'missing')"
    [[ "${status}" == "healthy" ]] && { log "${service} is healthy"; return 0; }
    sleep 3; waited=$((waited + 3))
  done
  compose logs --tail 50 "${service}" >&2 || true
  die "${service} did not become healthy within ${timeout}s (last status: ${status})"
}
