# syntax=docker/dockerfile:1.7
#
# NestJS backend image. Build context: repository root.
#   docker build -f infrastructure/docker/backend.Dockerfile --target runtime  -t ehans-backend .
#   docker build -f infrastructure/docker/backend.Dockerfile --target migrator -t ehans-migrator .
#
# Targets:
#   runtime  – lean production image (prod dependencies + compiled dist, non-root)
#   migrator – one-off image that runs `prisma migrate deploy` (never `migrate dev`)
#
# No secrets are baked in: all configuration arrives as environment variables at runtime.

ARG NODE_IMAGE=node:24-alpine
ARG PNPM_VERSION=12.9.1

# ---------- base: Node + pnpm ----------
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
ENV CI=true \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN npm install -g --allow-scripts=pnpm pnpm@${PNPM_VERSION} && npm cache clean --force
WORKDIR /repo

# ---------- deps: full dependency install (cached by manifests only) ----------
FROM base AS deps
# Prisma's schema engine (used by the migrator) needs OpenSSL on Alpine.
RUN apk add --no-cache openssl
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store --filter "@ehans/backend..."

# ---------- build: compile shared + backend ----------
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN pnpm --filter @ehans/shared build \
 && pnpm --filter @ehans/backend build

# ---------- prod-deps: production dependencies only ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile --prod --store-dir /pnpm-store --filter "@ehans/backend..."

# ---------- migrator: applies committed migrations, then exits ----------
FROM deps AS migrator
COPY apps/backend/prisma apps/backend/prisma
COPY apps/backend/prisma.config.ts apps/backend/
WORKDIR /repo/apps/backend
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ---------- runtime: minimal production image ----------
FROM ${NODE_IMAGE} AS runtime
ARG APP_VERSION=0.0.0-dev
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000 \
    APP_VERSION=${APP_VERSION}
WORKDIR /app

# Files stay root-owned (read-only for the app user); the app only writes to /app/uploads.
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=prod-deps /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist

# Admin image uploads: the only writable path (a named volume in docker-compose.yml).
# Created here so the volume starts out owned by the app user.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

WORKDIR /app/apps/backend
USER node
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--enable-source-maps", "dist/main.js"]
