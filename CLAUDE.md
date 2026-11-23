# CLAUDE.md

Guidance for AI coding assistants (and humans) working in this repository.

## What this is

eCommerce **modular monolith** in a pnpm workspace:

- `apps/frontend`: Next.js 16 App Router, React 19. Storefront = ehans-mart template design
  (template CSS, no Tailwind); admin at `/admin` = Tailwind 4 port of glowy's admin
- `apps/backend`: NestJS 12 (ESM), Prisma 7, PostgreSQL 17
- `packages/shared`: `@ehans/shared`, framework-agnostic zod schemas, types and constants
- `design/ehans-mart`: the original static HTML template (its own git repo). **Reference only**,
  never served, never edited, never formatted
- `infrastructure/`: Dockerfiles, host Nginx config, deploy/backup scripts
- `docs/`: architecture, database design, deployment, development setup (read these first)

## Current scope

- **Dev data:** `pnpm db:seed` loads the live ehansmart.com catalog (33 collections with group parents, 46 products,
  collection memberships in live order); home media (hero, banners, logo, collection/product images) are local
  copies in `public/assets/live` (`src/lib/home-media.ts`). The home page mirrors the live site: hero, category
  row, grid banners, "Trending Items" grid (collection `trendy-items`, manual order, Show more).
- **Built:** catalog backend (categories, products, images, options/variants, bundles, cross-sells;
  public `GET /api/v1/catalog/*`), and the full storefront design (home, collections, product,
  cart, about, contact, FAQ, policies, blog, 404) with a browser cart (localStorage).
- **Checkout (glowy port, cash on delivery):** Buy-now popup and `/checkout` (cart) place real orders via
  `POST /api/v1/orders`; prices, bundle discounts and delivery (district → zone: ৳80 inside Dhaka, ৳130
  outside, `@ehans/shared` `delivery.ts`) are computed by the API (`POST /checkout/quote`), never the browser.
  Stock is reserved in the order transaction (`CatalogCheckoutService`). Confirmation: `/orders/<number>?t=<token>`
  (secret link, 30 days).
- **Admin (`/admin`), ported from the glowy Laravel app** (`C:\Users\hrido\Desktop\glowy`, reference only),
  slice by slice, matching glowy's screens and behaviour:
  - Slice 1 (done): sign-in + staff section permissions, glowy shell (sidebar, topbar, light/dark,
    collapse), dashboard (on glowy's orders schema; zeros until orders exist), Products (list + add/edit
    with media, options/variants, collections), Categories, Inventory, Reviews, admin search. Unported
    menu entries open `/admin/modules/<slug>` ("coming soon").
  - Slice 2: Orders done (list with status/date/search/channel filters, status popup, bulk status, inline
    notes, order page with fulfilment form, printable invoice at `/admin/invoice/<number>`; cancel/return
    restocks via `CatalogCheckoutService.release`; BD Courier fraud check in `modules/fraud`, results cached
    per phone in `fraud_checks`, key in `BDCOURIER_API_KEY`). Next: POS, customers. Then couriers, bKash, accounting, etc.
- Contact/newsletter forms validate and then say messaging is "launching soon". **Never fake a success screen** for an action that wasn't performed.

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

- Markup must match the live ehansmart.com theme (same owner), else `design/ehans-mart/*.html`, **class for
  class**; styling comes only from `src/styles/store/*.css` (verbatim copies of the live theme's CSS where it ships
  the file, otherwise the template's; `live-theme.css` holds the extra live rules; loaded in a fixed order by
  `index.css`). Don't add Tailwind or new CSS to store components; don't edit/format the copied CSS.
  The one exception is `ehans-additions.css` (loaded last): small rules for ehans-only features the theme
  lacks (e.g. the cross-sell variant picker). Keep it minimal and theme-consistent.
  If a design change is needed, change it in the template CSS and re-copy (only `../fonts/` URLs are rewritten).
- Template behaviours (`design/ehans-mart/assets/js/script.js`) are re-implemented in React; keep the
  same classes/states (`active`, `loading`, `added`, `show`, body `active`) the CSS expects.
- Sliders: `components/store/slider.tsx` (vanilla Swiper 11.1.4, the template's version, with the
  template's options). Media lives in `public/assets/**` with the template's paths.
- Data comes from the catalog API (`src/lib/catalog.ts`, `'use cache'` functions). Anything reading
  runtime data, `params`/`searchParams` or `usePathname()` must sit inside `<Suspense>` (Cache Components).
- The browser cart is `components/store/providers/cart-store.ts` (localStorage key `ehans-mart-cart`).
- Store contact details/shipping options: `src/lib/store-config.ts`; menus, search words and category groups:
  `src/lib/store-nav.ts` (both move to admin Settings later).
- Listings filter by collection **membership** (`product_categories`); `sort=manual` = the collection's own order.
- `<img>` is used on purpose in store components (template markup); the lint rule is disabled there.

### Admin (`/admin`): Tailwind 4 port of glowy's admin

- Styles: `src/styles/admin.tailwind.css`, a port of glowy's `resources/css/admin.css` (ink/fg theme, light by
  default, `html.dark`, `html.sidebar-collapsed`, `.admin-card`/`.admin-btn-*`/`.admin-table`, `.auth-*`).
  Ehans accent `#ff5554` in the `blue-*` slot and Figtree instead of Jost; everything else stays glowy's.
  Only `*.tailwind.css` files go through the Tailwind loader. Not shadcn: port glowy's markup and classes.
- Screens: port `resources/views/admin/**` class for class into `src/app/admin/(panel)/**`; shared pieces
  live in `src/components/admin` (icons, stat card, charts, shell) and `src/lib/admin` (menu, format).
- Auth: the API issues an opaque session token (only its hash is stored in `sessions`); the sign-in server
  action keeps it in the httpOnly cookie `ehans_admin` (path `/admin`). Admin data is fetched **server-side
  only** with `adminApi()` (`src/lib/admin/session.ts`), never from the browser. Mutations are server
  actions that call `adminApi()` again (it re-checks the session).
- Permissions are glowy's: owner = everything; staff = `{ section: 'view' | 'manage' }` (`AdminSection` in
  `@ehans/shared`). Backend routes use `@AdminOnly('<section>')` (GET needs view, writes need manage);
  the menu hides what the admin can't open (`visibleMenu`). View-only staff see read-only screens.
- Image uploads: the API stores them in `UPLOADS_DIR` (dev: `apps/backend/storage/uploads`, prod: the
  `uploads` volume) as `/uploads/<folder>/<random>.<ext>`, served by the API at `/api/v1/uploads/*`
  and proxied by the frontend route `app/uploads/[...path]`. Product descriptions are sanitized by the
  API (`html-sanitizer.ts`, glowy's allowlist).
- Every admin section folder has a `loading.tsx` (re-exporting the panel one): Cache Components needs
  a Suspense boundary around each page's data reads.
- The owner account: `pnpm db:seed` with `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (dev), or
  `node dist/database/create-admin.js` (production, see docs/deployment.md).

## Database conventions

See `docs/database-design.md`: snake_case table and column mapping, UUIDv7 ids, `timestamptz`,
integer money, explicit relations and indexes, expand → migrate → contract for breaking changes.

## Infrastructure

- `docker-compose.yml` is **production**. `docker-compose.dev.yml` is local Postgres only.
- App ports bind to `127.0.0.1`. PostgreSQL publishes no port and sits on an `internal` network. Keep it that way.
- Containers run as non-root with `no-new-privileges` and `cap_drop: ALL`. The backend has a read-only root FS.
- Shell scripts use `set -Eeuo pipefail`, never `source .env`, and must pass shellcheck.
