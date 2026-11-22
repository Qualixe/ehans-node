# Development setup

## Prerequisites

| Tool                     | Version                 | Check                              |
| ------------------------ | ----------------------- | ---------------------------------- |
| Node.js                  | 24.x LTS (see `.nvmrc`) | `node -v`                          |
| pnpm                     | ≥ 12.9                  | `pnpm -v` (`npm i -g pnpm@12.9.1`) |
| Docker (with Compose v2) | recent                  | `docker compose version`           |
| Git                      | any                     |                                    |

> **Windows:** use Git Bash or WSL for the shell scripts. Line endings are normalized to LF by `.gitattributes`.

## First-time setup

```bash
pnpm install                                   # all workspace packages
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
pnpm db:up                                     # PostgreSQL 17 on 127.0.0.1:5432 (waits until healthy)
pnpm db:migrate                                # apply migrations (none exist yet; generates client)
pnpm dev                                       # shared (watch) + backend + frontend
```

| URL                                       | What                                               |
| ----------------------------------------- | -------------------------------------------------- |
| http://localhost:3000                     | Storefront (shows backend connectivity status)     |
| http://localhost:3000/api/health          | Frontend liveness                                  |
| http://localhost:4000/api/v1/health       | Backend liveness                                   |
| http://localhost:4000/api/v1/health/ready | Backend readiness (checks DB)                      |
| http://localhost:4000/api/docs            | Swagger UI (`/api/docs-json` for the OpenAPI JSON) |

Run a single app: `pnpm dev:backend` or `pnpm dev:frontend`.

## Everyday commands (repository root)

| Command                             | Does                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                          | Run everything in watch mode                                  |
| `pnpm build`                        | Build shared → backend → frontend                             |
| `pnpm lint`                         | oxlint (backend), ESLint (frontend), tsc (shared)             |
| `pnpm typecheck`                    | `tsc --noEmit` in every package                               |
| `pnpm test`                         | Unit tests (Vitest for the backend, `node --test` for shared) |
| `pnpm test:e2e`                     | Backend HTTP e2e tests (DB stubbed, no Postgres needed)       |
| `pnpm format` / `pnpm format:check` | Prettier                                                      |
| `pnpm db:up` / `pnpm db:down`       | Start / stop local Postgres (data persists in a volume)       |
| `pnpm db:migrate --name <name>`     | Create and apply a migration (`prisma migrate dev`)           |
| `pnpm db:status`                    | Migration status                                              |
| `pnpm db:studio`                    | Prisma Studio                                                 |
| `pnpm db:generate`                  | Regenerate Prisma Client                                      |

Run a package script directly with `pnpm --filter @ehans/backend <script>`.

## Environment files

| File                                                      | Used by                                        | Committed?   |
| --------------------------------------------------------- | ---------------------------------------------- | ------------ |
| `apps/backend/.env.example` → `apps/backend/.env`         | backend (`main.ts`) and Prisma CLI, local only | example only |
| `apps/frontend/.env.example` → `apps/frontend/.env.local` | `next dev` / `next build`                      | example only |
| `.env.example` → `.env`                                   | `docker-compose.yml` (production)              | example only |

The backend validates its environment at startup and exits with a list of problems if
something is wrong (see `apps/backend/src/config/env.schema.ts`).

## Adding things

- **A backend feature module:** see `apps/backend/src/modules/README.md`. Generate scaffolding with
  `pnpm --filter @ehans/backend exec nest g module modules/catalog` (then fix imports to end in `.js` if needed).
- **A shadcn/ui component:** `cd apps/frontend && pnpm dlx shadcn@latest add button`. Components land in
  `src/components/ui`. The CLI adds its own small deps (e.g. `class-variance-authority`, `lucide-react`).
- **A shared type or schema:** add it under `packages/shared/src`, export it from `src/index.ts`, then
  `pnpm --filter @ehans/shared build` (or keep `pnpm dev` running, which watches it).
- **A dependency:** `pnpm --filter @ehans/backend add <pkg>`. Pin exact versions. pnpm 12 refuses
  packages published less than a day ago (`minimumReleaseAge`). Don't bypass it.
  New install scripts must be explicitly allowed in `pnpm-workspace.yaml` → `allowBuilds`.

## Running the production stack locally (optional)

```bash
cp .env.example .env          # set POSTGRES_PASSWORD; set NEXT_PUBLIC_* and CORS_ORIGINS to http://localhost:3000-style values
docker compose build
docker compose --profile tools run --rm migrate
docker compose up -d
```

## Troubleshooting

| Symptom                                                | Fix                                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `Cannot find module '@ehans/shared'`                   | `pnpm --filter @ehans/shared build` (the root `dev`/`test`/`typecheck` scripts do this) |
| `Cannot find module '../generated/prisma/client.js'`   | `pnpm db:generate`                                                                      |
| Backend exits with `Invalid environment configuration` | Fix the listed variables in `apps/backend/.env`                                         |
| Port 5432 in use                                       | Stop the other Postgres, or set `DEV_POSTGRES_PORT=5433` and update `DATABASE_URL`      |
| Frontend shows "API unreachable"                       | Backend not running, or `API_INTERNAL_URL` / `NEXT_PUBLIC_API_URL` wrong                |
| Browser CORS error                                     | Add the exact frontend origin to `CORS_ORIGINS` (no trailing slash)                     |
