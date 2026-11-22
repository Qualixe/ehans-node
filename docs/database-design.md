# Database design

## Current state

PostgreSQL 17 with Prisma 7. Implemented: the **catalog** module (migration `…_catalog`).
Each further module (orders, customers, content, accounting, … ported from glowy) adds its
models together with a migration.

### Catalog tables (module `apps/backend/src/modules/catalog`)

Mirrors glowy's catalog so the admin port can reuse it, plus two tables the ehans-mart design needs.

| Table               | Purpose                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `categories`        | Two-level tree (`parent_id`). `position` = menu/slider order; `home_position` + `home_title` = home page product sliders                                                                                           |
| `products`          | Name, slug, sku, brand, `tags[]` (English search terms for Bangla names), HTML description, `specifications` JSON, `price`/`compare_at_price`, `stock`, `sold_count`, denormalized `rating_average`/`rating_count` |
| `product_images`    | Ordered images (`position`); first = card image, second = card hover image                                                                                                                                         |
| `product_options`   | Option name + values (e.g. Pack: 1 Pc / 2 Pcs / 3 Pcs), optional swatches                                                                                                                                          |
| `product_variants`  | Up to 3 option values, own price/compare/stock/sku (glowy's variant model)                                                                                                                                         |
| `product_bundles`   | "Bundle & Save" tiers: quantity, title, discount %, badge, free delivery, default tier                                                                                                                             |
| `product_relations` | Merchandising links per product: `BUY_WITH` ("Buy it with") and `UPSELL` ("Complete your …")                                                                                                                       |

Dev data: `pnpm db:seed` loads the template's 9 categories (+72 sub-categories) and 33 products
(`apps/backend/src/database/seed`). It is idempotent and refuses to run with `NODE_ENV=production`.

## Prisma setup

| File                                        | Role                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/backend/prisma/schema.prisma`         | Data model (single source of truth)                                                      |
| `apps/backend/prisma/migrations/`           | Committed, ordered SQL migrations. **Never edit an applied migration.**                  |
| `apps/backend/prisma.config.ts`             | CLI config: schema path, migrations path, `DATABASE_URL`                                 |
| `apps/backend/src/generated/prisma/`        | Generated client (git-ignored; `prisma generate` runs in build, dev, test and typecheck) |
| `apps/backend/src/prisma/prisma.service.ts` | The app's single `PrismaClient` (driver adapter `@prisma/adapter-pg`)                    |

Prisma 7 notes:

- Uses the `prisma-client` generator with ESM output, imported from `../generated/prisma/client.js`.
- No Rust query engine at runtime. Queries go through the `pg` driver adapter.
- The CLI does **not** auto-load `.env`. `prisma.config.ts` loads `apps/backend/.env` locally
  with Node's `process.loadEnvFile`. In containers, `DATABASE_URL` comes from the environment.

## Migration workflow

### Development

```bash
pnpm db:up                                   # local Postgres (docker-compose.dev.yml)
# edit prisma/schema.prisma
pnpm db:migrate --name add_products       # prisma migrate dev: creates + applies migration, regenerates client
pnpm --filter @ehans/backend prisma:migrate:create --name tweak   # create only, to hand-edit SQL first
```

Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` and commit it
together with the schema change.

### Production

```bash
./infrastructure/scripts/migrate.sh          # = docker compose --profile tools run --rm migrate
./infrastructure/scripts/migrate.sh status
```

- Production runs **only** `prisma migrate deploy`, which applies committed migrations in order
  and never generates or resets anything.
- **Never** run `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against production.
  They can drop data. The production image doesn't contain a workflow for them.
- `deploy.sh` always takes a backup before migrating.
- **Use expand → migrate → contract** for breaking changes. Add new columns or tables as nullable or
  with defaults, deploy code that writes both, backfill, then remove the old structure in a later release.
  This keeps the running app version compatible with the schema during the deploy window.
- Large data backfills belong in a separate script or job, not inside a schema migration.

## Conventions for future models

| Topic        | Convention                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table names  | `@@map("snake_case_plural")`, e.g. model `OrderItem` → `order_items`                                                                               |
| Column names | camelCase in Prisma, `@map("snake_case")` in the DB                                                                                                |
| Primary keys | `String @id @default(uuid(7)) @db.Uuid` (time-ordered UUIDv7, index-friendly, not guessable)                                                       |
| Timestamps   | `createdAt DateTime @default(now()) @db.Timestamptz(3)`, `updatedAt DateTime @updatedAt @db.Timestamptz(3)`                                        |
| Money        | **Never floats.** Integer **taka** (BDT has no minor unit in practice; matches glowy). Add a currency column only if multi-currency is ever needed |
| Soft delete  | Only where business-required (`deletedAt DateTime?`). Prefer status enums for orders                                                               |
| Enums        | Prisma `enum` for closed sets (order status, payment status)                                                                                       |
| Foreign keys | Always explicit relations. Choose `onDelete` deliberately (`Restrict` for orders/payments)                                                         |
| Indexes      | Index every foreign key and every column used in `WHERE` / `ORDER BY` on hot paths                                                                 |
| Snapshots    | Orders copy product name, price and tax at purchase time. Never read live prices for a past order                                                  |

## Planned domain (for orientation only, not implemented)

```
customers ─┬─< addresses
           ├─< carts ──< cart_items >── product_variants
           └─< orders ─┬─< order_items (price/name snapshot) >── product_variants
                       └─< payments (provider ref, status, amount_cents)
categories ─< products ─< product_variants (sku, price_cents, stock)
```

Each block belongs to one feature module (`catalog`, `customers`, `cart`, `orders`,
`payments`), and only that module reads and writes its tables.

## Operations

- **Connection pooling:** one `pg` pool per backend process (Prisma adapter defaults). Add
  PgBouncer only if you scale to many backend replicas.
- **Backups:** `infrastructure/scripts/backup-db.sh` (pg_dump custom format, verified, checksummed,
  retention pruning). See [deployment.md](deployment.md#backups-and-restore).
- **Access:** no host port in production. For ad-hoc SQL use
  `docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"`, or an SSH tunnel to a
  temporarily published port. Never open 5432 in the firewall.
- **Upgrades:** minor 17.x updates happen by pulling the image (`docker compose pull postgres && docker compose up -d postgres`).
  A major upgrade (17 → 18) needs dump/restore or `pg_upgrade`, never just changing the image tag.
