# syntax=docker/dockerfile:1.7
#
# Next.js frontend image (standalone output). Build context: repository root.
#   docker build -f infrastructure/docker/frontend.Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
#     -t ehans-frontend .
#
# NEXT_PUBLIC_* values are PUBLIC and inlined into the browser bundle at build time.
# Never pass secrets as build args. Server-only values (API_INTERNAL_URL) are runtime env.

ARG NODE_IMAGE=node:24-alpine
ARG PNPM_VERSION=12.9.1

# ---------- base ----------
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1
RUN npm install -g --allow-scripts=pnpm pnpm@${PNPM_VERSION} && npm cache clean --force
WORKDIR /repo

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store --filter "@ehans/frontend..."

# ---------- build ----------
FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
RUN test -n "$NEXT_PUBLIC_API_URL" && test -n "$NEXT_PUBLIC_SITE_URL" \
 || (echo "ERROR: NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SITE_URL build args are required" >&2; exit 1)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_OUTPUT=standalone \
    NODE_ENV=production
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
RUN pnpm --filter @ehans/shared build \
 && pnpm --filter @ehans/frontend build

# ---------- runtime ----------
FROM ${NODE_IMAGE} AS runtime
ARG APP_VERSION=0.0.0-dev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}
WORKDIR /app

# Standalone server + traced node_modules (monorepo layout preserved under /app).
COPY --from=build --chown=node:node /repo/apps/frontend/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build --chown=node:node /repo/apps/frontend/public ./apps/frontend/public

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/frontend/server.js"]
