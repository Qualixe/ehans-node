# CLAUDE.md

Guidance for AI coding assistants (and humans) working in this repository.

## What this is

eCommerce **modular monolith** in a pnpm workspace:

- `apps/frontend`: Next.js 16 App Router, React 19. Storefront = ehans-mart template design
  (template CSS, no Tailwind); admin (planned, at `/admin`) = Tailwind 4 + shadcn/ui
- `apps/backend`: NestJS 12 (ESM), Prisma 7, PostgreSQL 17
- `packages/shared`: `@ehans/shared`, framework-agnostic zod schemas, types and constants
- `design/ehans-mart`: the original static HTML template (its own git repo). **Reference only**,
  never served, never edited, never formatted
- `infrastructure/`: Dockerfiles, host Nginx config, deploy/backup scripts
- `docs/`: architecture, database design, deployment, development setup (read these first)

## Current scope

- **Dev data:** `pnpm db:seed` loads the live ehansmart.com catalog (25 collections, 36 products); home media
  (hero, banners, logo, category/product images) are local copies in `public/assets/live` (`src/lib/home-media.ts`).
- **Built:** catalog backend (categories, products, images, options/variants, bundles, cross-sells;
  public `GET /api/v1/catalog/*`), and the full storefront design (home, collections, product,
  cart, about, contact, FAQ, policies, blog, 404) with a browser cart (localStorage).
- **Next, ported from the glowy Laravel app** (`C:\Users\hrido\Desktop\glowy`, reference only):
  checkout + orders, then the `/admin` dashboard (same screens and behaviour as glowy's admin),
  then couriers, bKash, accounting, etc. Port feature by feature; match glowy's behaviour.
- Until checkout exists, order/contact/newsletter forms validate and then say ordering/messaging
  is "launching soon". **Never fake a success screen** for an action that wasn't performed.

## Hard rules

1. **Modular monolith, not microservices.** Don't add message brokers, service meshes, extra
   deployable services, or inter-service HTTP calls. Features are NestJS modules in `apps/backend/src/modules`.
2. **Frontend and backend stay independent.** Never import backend code into the frontend or vice
   versa. Share only through `packages/shared` (no Nest, Next, Prisma or Node-only APIs there).
3. **Build only what is asked, in the agreed order** (see Current scope). Don't start new business
   modules (orders, payments, admin screens) without the user asking.
4. **Never run `prisma migrate dev`, `migrate reset` or `db push` against production.** Production uses
   `prisma migrate deploy` only (`infrastructure/scripts/migrate.sh`). Never edit an applied migration.
5. **No secrets in Git, images or build args.** Only `.env.example` files are committed, with placeholders.
   `NEXT_PUBLIC_*` values are public by definition.
6. **Don't invent** production domains, IPs, credentials or API keys. Use `example.com` placeholders.
7. **No destructive or live-server actions.** Don't deploy, SSH, drop databases, delete volumes, or
   force-push.
8. **Avoid unnecessary dependencies.** Prefer Node built-ins and first-party Nest/Next features. Pin exact
   versions. Don't bypass pnpm's `minimumReleaseAge`. New install scripts must be added to
   `allowBuilds` in `pnpm-workspace.yaml` deliberately.
9. **Ask before changing the stack** (framework, ORM, database, package manager, deployment model).

## Versions and their gotchas

- **TypeScript 6.0**, not 7. TS 7's native compiler isn't supported by typescript-eslint, ts tooling or the Nest CLI yet.
- **NestJS 12 is ESM-only.** Relative imports end in `.js` (`import { X } from './x.js'`). There is no
  `__dirname` (use `import.meta.dirname`). Tests use Vitest (`vi.fn()`, not `jest.fn()`).
- **Prisma 7:** client is generated into `apps/backend/src/generated/prisma` (git-ignored). Import from
  `../generated/prisma/client.js`. The driver adapter is `@prisma/adapter-pg`. The CLI reads `prisma.config.ts`
  and does not auto-load `.env`.
- **Next.js 16 differs from older versions.** Before writing frontend code, read the relevant guide in
  `apps/frontend/node_modules/next/dist/docs/`. Cache Components are enabled: reading runtime env or
  uncached data requires `await connection()` (or another request-time API) inside a `<Suspense>` boundary.
- `NEXT_PUBLIC_*` values are inlined at **build** time and must be referenced literally (`process.env.NEXT_PUBLIC_X`).

## Commands (repository root)

```bash
pnpm install
pnpm db:up                      # local Postgres (127.0.0.1:5432)
pnpm dev                        # shared watch + backend :4000 + frontend :3000
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build   # full verification
pnpm db:migrate --name <name>   # new migration (dev only)
pnpm db:seed                    # load the ehans-mart demo catalog (dev only)
pnpm format
```

Run the full verification line before saying a change is done.

## Backend conventions

- Feature layout: `src/modules/<feature>/{<feature>.module.ts, .controller.ts, .service.ts, dto/, *.spec.ts}`.
  Register the module in `app.module.ts`.
- Controllers: routing, DTOs, Swagger decorators only. Services: business logic and Prisma access.
- Modules interact only through **exported services**, never by querying another module's tables.
- Every request body, query and param uses a **class-validator DTO**. The global `ValidationPipe` uses
  `whitelist` and `forbidNonWhitelisted`. Annotate DTOs with `@ApiProperty` for Swagger.
- Throw Nest `HttpException`s (`NotFoundException`, …). `AllExceptionsFilter` formats every error as
  `ApiErrorResponse` (from `@ehans/shared`). Never return raw errors or stack traces.
- Log with `new Logger(Context)` and structured params: `this.logger.log('order created', { orderId })`.
  Never log secrets, tokens, passwords or full card data. Never use `console.*` (lint error).
- New env var: add it to `src/config/env.schema.ts`, both `.env.example` files, and `docs/deployment.md`.
  Read config via `ConfigService<Env, true>`, never `process.env` in feature code.
- Money is integer **taka** (BDT, whole units, same as glowy). Never floats. Multi-step writes use `prisma.$transaction`.
- Tests: unit tests beside the code (`*.spec.ts`), HTTP tests in `test/*.e2e-spec.ts` using `configureApp()`.

## Frontend conventions

- Server Components by default. Add `'use client'` only for interactivity.
- Call the API through `src/lib/api-client.ts` (`apiFetch`), which picks the internal URL on the server
  and the public URL in the browser.
- Env access goes through `src/lib/env.ts` (zod-validated). Don't read `process.env` ad hoc.
- Path alias: `@/*` → `src/*`.

### Storefront (`src/app/(store)`, `src/components/store`) — exact template design

- Markup must match `design/ehans-mart/*.html` **class for class**; styling comes only from
  `src/styles/store/*.css` (verbatim copies of the template CSS, loaded in a fixed order by
  `index.css`). Don't add Tailwind or new CSS to store components; don't edit/format the copied CSS.
  If a design change is needed, change it in the template CSS and re-copy (only `../fonts/` URLs are rewritten).
- Template behaviours (`design/ehans-mart/assets/js/script.js`) are re-implemented in React; keep the
  same classes/states (`active`, `loading`, `added`, `show`, body `active`) the CSS expects.
- Sliders: `components/store/slider.tsx` (vanilla Swiper 11.1.4, the template's version, with the
  template's options). Media lives in `public/assets/**` with the template's paths.
- Data comes from the catalog API (`src/lib/catalog.ts`, `'use cache'` functions). Anything reading
  runtime data, `params`/`searchParams` or `usePathname()` must sit inside `<Suspense>` (Cache Components).
- The browser cart is `components/store/providers/cart-store.ts` (localStorage key `ehans-mart-cart`).
- Store contact details/shipping options: `src/lib/store-config.ts` (moves to admin Settings later).
- `<img>` is used on purpose in store components (template markup); the lint rule is disabled there.

### Admin (`/admin`, planned) — Tailwind 4 + shadcn/ui

- Styles: `src/styles/admin.tailwind.css` (only `*.tailwind.css` files go through the Tailwind loader).
- UI components: `pnpm dlx shadcn@latest add <component>` (in `apps/frontend`) → `src/components/ui`,
  `cn()` from `@/lib/utils`. Port screens and behaviour from glowy's `resources/views/admin`.

## Database conventions

See `docs/database-design.md`: snake_case table and column mapping, UUIDv7 ids, `timestamptz`,
integer money, explicit relations and indexes, expand → migrate → contract for breaking changes.

## Infrastructure

- `docker-compose.yml` is **production**. `docker-compose.dev.yml` is local Postgres only.
- App ports bind to `127.0.0.1`. PostgreSQL publishes no port and sits on an `internal` network. Keep it that way.
- Containers run as non-root with `no-new-privileges` and `cap_drop: ALL`. The backend has a read-only root FS.
- Shell scripts use `set -Eeuo pipefail`, never `source .env`, and must pass shellcheck.
