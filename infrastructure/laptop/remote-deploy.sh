#!/usr/bin/env bash
# Runs ON THE LAPTOP. Uploaded and started by infrastructure/laptop/deploy-laptop.ps1, which puts
# the code in /tmp/ehans-deploy.tgz and sets APP_VERSION.
#
#   1. Backs up the live database (pg_dump) when the stack is running; keeps the latest 30.
#   2. Swaps in the new code (the previous version stays in ~/ehans-prev) and keeps the server's .env.
#      First install: writes a new .env with a random database password (it never leaves the laptop).
#   3. Builds the images BEFORE stopping anything, applies migrations (prisma migrate deploy),
#      loads the demo catalog on the first install only, then starts the containers.
#   4. Checks health through the nginx entry point on 127.0.0.1:${EHANS_PORT:-8086}.
set -Eeuo pipefail

APP="${HOME}/ehans"
HOST_NAME="${EHANS_HOST:-ehans.qualixe.com}"
PORT="${EHANS_PORT:-8086}"
export APP_VERSION="${APP_VERSION:-laptop}"
compose() { docker compose -f docker-compose.yml -f infrastructure/laptop/compose.laptop.yaml "$@"; }
psql_count() { compose exec -T postgres sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -tAc \"$1\"" </dev/null 2>/dev/null | tr -d '[:space:]'; }

mkdir -p "${HOME}/backups"

# ---------------------------------------------------------------- 1. backup
if [ -d "${APP}" ] && [ -n "$(cd "${APP}" && compose ps -q postgres 2>/dev/null)" ]; then
  echo "--> Backing up the database"
  stamp="$(date +%F_%H%M)"
  backup="${HOME}/backups/ehans_${stamp}.dump"
  if (cd "${APP}" && compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' </dev/null >"${backup}") \
      && [ -s "${backup}" ]; then
    echo "    ${backup}"
  else
    rm -f "${backup}"
    echo "    (backup failed; stopping so nothing is lost)"
    exit 1
  fi
  # uploaded images (admin) are not in the database dump
  if docker volume inspect ehans_uploads >/dev/null 2>&1; then
    docker image inspect alpine:3.20 >/dev/null 2>&1 || docker pull -q alpine:3.20 >/dev/null
    if docker run --rm -v ehans_uploads:/u:ro -v "${HOME}/backups":/b alpine:3.20 \
        tar czf "/b/ehans_uploads_${stamp}.tgz" -C /u . </dev/null; then
      echo "    ${HOME}/backups/ehans_uploads_${stamp}.tgz"
    else
      echo "    (uploads backup failed; stopping so nothing is lost)"
      exit 1
    fi
  fi
  # keep the latest 30 of each
  for pattern in 'ehans_*.dump' 'ehans_uploads_*.tgz'; do
    find "${HOME}/backups" -maxdepth 1 -name "${pattern}" -printf '%T@ %p\n' | sort -rn | tail -n +31 | cut -d' ' -f2- | xargs -r rm --
  done
else
  echo "--> First install (nothing running yet)"
fi

# ---------------------------------------------------------------- 2. code + .env
echo "--> Unpacking the new code"
rm -rf "${HOME}/ehans-new" && mkdir "${HOME}/ehans-new"
tar -xzf /tmp/ehans-deploy.tgz -C "${HOME}/ehans-new"
rm -f /tmp/ehans-deploy.tgz

if [ -f "${APP}/.env" ]; then
  cp "${APP}/.env" "${HOME}/ehans-new/.env"
else
  echo "    Writing a new .env for https://${HOST_NAME} (random database password)"
  cat >"${HOME}/ehans-new/.env" <<ENV
# ehans on the laptop. Written by the first deploy; later deploys keep this file.
APP_VERSION=${APP_VERSION}
POSTGRES_USER=ehans
POSTGRES_PASSWORD=$(openssl rand -hex 32)
POSTGRES_DB=ehans
CORS_ORIGINS=https://${HOST_NAME}
TRUST_PROXY=1
COOKIE_DOMAIN=
SWAGGER_ENABLED=false
LOG_LEVEL=log
NEXT_PUBLIC_API_URL=https://${HOST_NAME}/api/v1
NEXT_PUBLIC_SITE_URL=https://${HOST_NAME}
EHANS_PORT=${PORT}
ENV
fi
chmod 600 "${HOME}/ehans-new/.env"

# The port must be free, or already ours (a redeploy).
if ss -ltnH "( sport = :${PORT} )" | grep -q . \
    && ! docker ps --format '{{.Names}} {{.Ports}}' | grep -q "^ehans-proxy-.*127.0.0.1:${PORT}->"; then
  echo "    Port ${PORT} is used by something else on this laptop. Set EHANS_PORT in ~/ehans/.env or free it."
  rm -rf "${HOME}/ehans-new"
  exit 1
fi

rm -rf "${HOME}/ehans-prev"
[ -d "${APP}" ] && mv "${APP}" "${HOME}/ehans-prev"
mv "${HOME}/ehans-new" "${APP}"
cd "${APP}"

# ---------------------------------------------------------------- 3. build, migrate, seed, start
echo "--> Validating the compose configuration"
compose config --quiet

echo "--> Building images (the first build takes several minutes)"
compose --profile tools build </dev/null 2>&1 | grep -Ei "error|naming to|built" || true

echo "--> Starting PostgreSQL"
compose up -d postgres </dev/null 2>&1 | grep -Ei "error" || true
for _ in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$(compose ps -q postgres)" 2>/dev/null)" = "healthy" ] && break
  sleep 2
done

echo "--> Applying database migrations"
compose --profile tools run --rm migrate </dev/null

if [ "$(psql_count 'SELECT count(*) FROM products')" = "0" ]; then
  echo "--> Loading the demo catalog (first install only)"
  compose run --rm --no-deps -e SEED_ALLOW_PRODUCTION=true backend \
    node dist/database/seed/run-seed.js </dev/null
fi

echo "--> Starting the app"
compose up -d --remove-orphans backend frontend proxy </dev/null 2>&1 | grep -Ei "error|started|recreated|created" || true

# ---------------------------------------------------------------- 4. health
echo "--> Checking health"
for _ in $(seq 1 90); do
  web="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/api/health" || true)"
  api="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/api/v1/health/ready" || true)"
  if [ "${web}" = "200" ] && [ "${api}" = "200" ]; then
    echo "    Healthy"
    compose ps --format '    {{.Service}}: {{.Status}}'
    docker image prune -f >/dev/null
    if [ "$(psql_count "SELECT count(*) FROM users WHERE role = 'OWNER'")" = "0" ]; then
      echo "    No admin owner yet: run infrastructure/laptop/create-admin-laptop.ps1 from your PC."
    fi
    exit 0
  fi
  sleep 2
done
echo "    NOT HEALTHY. Recent logs:"
compose logs --tail 40 backend frontend proxy
echo "    To roll back: cd ~ && rm -rf ehans && mv ehans-prev ehans && cd ehans && docker compose -f docker-compose.yml -f infrastructure/laptop/compose.laptop.yaml up -d --build"
exit 1
