# Architecture

## Overview

eHans is an eCommerce platform built as a **modular monolith**: one backend process
with internally separated feature modules, and one frontend application. Both live in a
single pnpm workspace but are **independent applications**. Each has its own
dependencies, build, Docker image and release lifecycle. This is deliberately **not** a
microservices system.

```
                Internet
                   │  :80 / :443
           ┌───────▼────────┐   Ubuntu 24.04 VPS (host)
           │  Nginx (host)  │   TLS (Let's Encrypt), HSTS, rate limits, X-Request-Id
           └──┬──────────┬──┘
 example.com  │          │  api.example.com
 127.0.0.1:3000          127.0.0.1:4000
   ┌──────────▼───┐    ┌──▼────────────────┐
   │  frontend    │    │  backend          │   Docker Compose
   │  Next.js 16  │───▶│  NestJS 12        │   network "web"
   │  (SSR/RSC)   │    │  /api/v1          │
   └──────────────┘    └──┬────────────────┘
     http://backend:4000  │ network "db" (internal: no internet, no host ports)
                       ┌──▼────────────────┐
                       │ PostgreSQL 17     │  named volume postgres_data
                       └───────────────────┘
```

- **The browser** calls the API at `NEXT_PUBLIC_API_URL` (`https://api.example.com/api/v1`).
- **Server Components** call the API over the Docker network (`API_INTERNAL_URL=http://backend:4000/api/v1`),
  which skips the TLS round trip through Nginx.
- **PostgreSQL** has no published port. Only `backend` and the one-off `migrate` job can reach it.

## Repository layout

| Path                     | Purpose                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `apps/frontend`          | Next.js App Router storefront (TypeScript strict, Tailwind v4, shadcn/ui-ready)           |
| `apps/backend`           | NestJS API (ESM), Prisma ORM, Swagger                                                     |
| `packages/shared`        | `@ehans/shared`: zod schemas, API contracts (`ApiErrorResponse`, health types), constants |
| `infrastructure/docker`  | Multi-stage Dockerfiles (backend `runtime` and `migrator` targets, frontend standalone)   |
| `infrastructure/nginx`   | Host Nginx config: `conf.d/`, `snippets/`, `sites-available/`                             |
| `infrastructure/scripts` | `deploy.sh`, `migrate.sh`, `backup-db.sh`, `restore-db.sh`                                |
| `docs`                   | Architecture, database, deployment and development guides                                 |

## Technology choices

| Concern         | Choice                                                                        | Notes                                                                                          |
| --------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Runtime         | Node.js 24 LTS                                                                | `.nvmrc`, `engines` enforced (`engine-strict`)                                                 |
| Package manager | pnpm 12 workspaces                                                            | Lockfile and supply-chain policy (`minimumReleaseAge`, `allowBuilds`)                          |
| Language        | TypeScript 6.0                                                                | TS 7 (native compiler) is not yet supported by typescript-eslint, ts tooling, or the Nest CLI  |
| Frontend        | Next.js 16, React 19, Tailwind 4                                              | Cache Components on; `output: standalone` in Docker                                            |
| Backend         | NestJS 12 (Express adapter)                                                   | ESM only; Vitest; oxlint                                                                       |
| ORM             | Prisma 7                                                                      | `prisma-client` generator (TS output), `@prisma/adapter-pg` driver adapter, `prisma.config.ts` |
| Database        | PostgreSQL 17 (alpine image)                                                  | SCRAM auth, named volume                                                                       |
| Validation      | class-validator / class-transformer (HTTP DTOs), zod (env and shared schemas) |                                                                                                |
| Logging         | Nest `ConsoleLogger` in JSON mode                                             | No extra dependency; secrets redacted by key                                                   |

## Backend design

```
apps/backend/src
├── main.ts                    # load .env (dev only) → validate env → create app → listen
├── app.module.ts              # root module: Config, Prisma, Health, global filter/pipe, middleware
├── bootstrap/configure-app.ts # trust proxy, helmet, CORS, /api/v1 prefix, Swagger (shared with e2e tests)
├── config/                    # env schema (zod), .env loader, cookie defaults
├── common/
│   ├── filters/               # AllExceptionsFilter → ApiErrorResponse
│   ├── middleware/            # request id + structured access log
│   └── logging/               # logger factory (json/pretty, levels, redaction)
├── prisma/                    # global PrismaModule + PrismaService (connect/disconnect lifecycle)
├── health/                    # GET /api/v1/health (liveness), /api/v1/health/ready (DB readiness)
├── modules/                   # future feature modules (catalog, cart, checkout, orders, payments)
└── generated/prisma/          # Prisma Client output (git-ignored, generated on build)
```

**Request lifecycle:** Nginx (adds `X-Request-Id`) → helmet/CORS → `RequestContextMiddleware`
(request id and access log) → `ValidationPipe` (whitelist, forbid unknown, transform) → controller
→ service → `PrismaService`. Every thrown error is converted by `AllExceptionsFilter` into:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "…",
  "path": "/api/v1/…",
  "timestamp": "…",
  "requestId": "…"
}
```

Unexpected errors are logged with the stack trace and returned as a generic 500. Known Prisma
errors map to 409 (unique / foreign-key violations) and 404 (record not found).

**Configuration:** `src/config/env.schema.ts` is the single env contract. It is validated before
the Nest app is created, so the process exits with a readable list of problems if anything is
wrong. Production defaults are secure: Swagger off, JSON logs, and CORS origins required.

**Health:** `/health` never touches dependencies and backs the Docker `HEALTHCHECK`, so a DB blip
doesn't restart-loop the API. `/health/ready` checks the database (2 s timeout) and returns 503
when it can't reach it. Point uptime monitors at `/health/ready`.

### Module boundaries (rules for future features)

- One folder per bounded context under `src/modules/<feature>` with module, controller, service and DTOs.
- Controllers handle HTTP only. Business logic lives in services.
- A module may use another module only through that module's **exported service**. It never queries
  another module's tables directly. This keeps a later extraction possible, but extraction is not a goal.
- Cross-module workflows (for example checkout → orders → payments) are orchestrated by a service in
  the owning module, inside a Prisma transaction when they must be atomic.

## Frontend design

```
apps/frontend/src
├── app/                 # App Router: layout, page, api/health route
├── components/ui/       # shadcn/ui components (added via CLI)
├── lib/env.ts           # zod-validated public (build-time) and server (runtime) env
├── lib/api-client.ts    # typed fetch wrapper; internal URL on the server, public URL in the browser
├── lib/utils.ts         # cn() helper (clsx + tailwind-merge)
└── instrumentation.ts   # validates server env once at startup
```

- `NEXT_PUBLIC_*` values are inlined **at build time**, so changing them requires rebuilding the image.
- Server-only values (`API_INTERNAL_URL`) are read **at runtime** (after `connection()` or another request-time API).
- `GET /api/health` is the frontend liveness probe.

## Shared package

`@ehans/shared` compiles to ESM in `dist/` and is consumed by both apps through `workspace:*`.
It contains **only** framework-agnostic code: zod schemas, TypeScript types for API contracts,
and constants. It must never import from NestJS, Next.js, Prisma or Node-only APIs.

## Cross-cutting concerns

| Concern                  | Where                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| TLS, HSTS, rate limiting | Nginx (`infrastructure/nginx`)                                      |
| Security headers         | helmet (API), `next.config.ts` `headers()` (web)                    |
| CORS                     | backend `CORS_ORIGINS` (exact origins, credentials enabled)         |
| Proxy trust              | backend `TRUST_PROXY=1` (exactly one hop: host Nginx)               |
| Cookies                  | `baseCookieOptions()`: HttpOnly, SameSite=Lax, Secure in production |
| Request correlation      | `X-Request-Id` (Nginx → backend → response and logs)                |
| Logs                     | stdout/stderr JSON → Docker `json-file` driver (10 MB × 5 rotation) |
| Secrets                  | `.env` on the server only (mode 600). Never in Git or images        |
