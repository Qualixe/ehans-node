/**
 * Development seed: loads the live ehansmart.com catalog snapshot (collections with their
 * group parents, products, images, options/variants, collection memberships, bundles,
 * cross-sells). Idempotent: upserts by slug/sku and rebuilds each seeded product's
 * child rows. Earlier demo rows that are no longer in the seed are hidden, not deleted.
 *
 *   pnpm db:seed
 *
 * Also creates the /admin store owner when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set.
 *
 * Refuses to run when NODE_ENV=production unless SEED_ALLOW_PRODUCTION=true.
 */
import { HOME_GRID_COLLECTION } from '@ehans/shared';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { loadLocalEnvFile } from '../../config/load-env-file.js';
import { upsertOwner } from '../admin-account.js';
import { seedBundles, seedCategories, seedProducts } from './catalog.seed-data.js';

async function main(): Promise<void> {
  loadLocalEnvFile();
  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      'Refusing to seed with NODE_ENV=production (set SEED_ALLOW_PRODUCTION=true to override).',
    );
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    // 1) categories (two passes: rows first, then group parents)
    const categoryIds = new Map<string, string>();
    for (const c of seedCategories) {
      const fields = {
        name: c.name,
        description: c.description,
        image: c.image,
        position: c.position,
        homePosition: c.homePosition,
        homeTitle: null,
        showInMenu: c.showInMenu,
      };
      const row = await prisma.category.upsert({
        where: { slug: c.slug },
        create: { slug: c.slug, ...fields },
        update: fields,
      });
      categoryIds.set(c.slug, row.id);
    }
    for (const c of seedCategories) {
      await prisma.category.update({
        where: { id: categoryIds.get(c.slug)! },
        data: { parentId: c.parent ? (categoryIds.get(c.parent) ?? null) : null },
      });
    }

    // 2) products and their child rows
    const productIds = new Map<string, string>();
    for (const p of seedProducts) {
      const categoryId = categoryIds.get(p.category);
      if (!categoryId) throw new Error(`Unknown category ${p.category} for ${p.sku}`);
      const fields = {
        name: p.name,
        slug: p.slug,
        categoryId,
        brand: p.brand,
        tags: p.tags,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        soldCount: 0,
        ratingAverage: null,
        ratingCount: 0,
        isFeatured: p.collections.some((m) => m.collection === HOME_GRID_COLLECTION),
        isActive: true,
      };
      const product = await prisma.product.upsert({
        where: { sku: p.sku },
        create: { sku: p.sku, ...fields },
        update: fields,
      });
      productIds.set(p.ref, product.id);

      // memberships: every live collection + the primary category (never the home grid
      // collection, which only holds what the live store put in it)
      const addPrimary =
        p.category !== HOME_GRID_COLLECTION &&
        !p.collections.some((m) => m.collection === p.category);
      const memberships = [
        ...p.collections,
        ...(addPrimary ? [{ collection: p.category, position: 9999 }] : []),
      ].filter((m) => categoryIds.has(m.collection));

      await prisma.$transaction([
        prisma.productVariant.deleteMany({ where: { productId: product.id } }),
        prisma.productOption.deleteMany({ where: { productId: product.id } }),
        prisma.productImage.deleteMany({ where: { productId: product.id } }),
        prisma.productBundle.deleteMany({ where: { productId: product.id } }),
        prisma.productCategory.deleteMany({ where: { productId: product.id } }),
        prisma.productImage.createMany({
          data: p.images.map((path, position) => ({
            productId: product.id,
            path,
            alt: p.name,
            position,
          })),
        }),
        prisma.productBundle.createMany({
          data: seedBundles.map((b) => ({ ...b, productId: product.id })),
        }),
        prisma.productOption.createMany({
          data: p.options.map((o, i) => ({
            productId: product.id,
            name: o.name,
            values: o.values,
            position: i + 1,
          })),
        }),
        prisma.productVariant.createMany({
          data: p.variants.map((v, i) => ({
            productId: product.id,
            title: v.title,
            option1: v.options[0] ?? null,
            option2: v.options[1] ?? null,
            option3: v.options[2] ?? null,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            position: i + 1,
          })),
        }),
        prisma.productCategory.createMany({
          data: memberships.map((m) => ({
            productId: product.id,
            categoryId: categoryIds.get(m.collection)!,
            position: m.position,
          })),
          skipDuplicates: true,
        }),
      ]);
    }

    // 3) hide earlier demo rows that are no longer part of the seed
    const hiddenProducts = await prisma.product.updateMany({
      where: { sku: { notIn: seedProducts.map((p) => p.sku) }, isActive: true },
      data: { isActive: false },
    });
    const hiddenCategories = await prisma.category.updateMany({
      where: {
        slug: { notIn: seedCategories.map((c) => c.slug) },
        OR: [{ showInMenu: true }, { homePosition: { not: null } }],
      },
      data: { showInMenu: false, homePosition: null },
    });
    if (hiddenProducts.count || hiddenCategories.count) {
      process.stdout.write(
        `Hid ${hiddenProducts.count} old products and ${hiddenCategories.count} old categories\n`,
      );
    }

    // 4) cross-sells: same primary category first, then others
    await prisma.productRelation.deleteMany({
      where: { productId: { in: [...productIds.values()] } },
    });
    for (const p of seedProducts) {
      const id = productIds.get(p.ref)!;
      const same = seedProducts.filter((o) => o.category === p.category && o.ref !== p.ref);
      const others = seedProducts.filter((o) => o.ref !== p.ref && o.category !== p.category);
      const rows = [
        ...same.slice(0, 2).map((o, position) => ({
          productId: id,
          relatedProductId: productIds.get(o.ref)!,
          type: 'BUY_WITH' as const,
          position,
        })),
        ...[...same.slice(2), ...others].slice(0, 3).map((o, position) => ({
          productId: id,
          relatedProductId: productIds.get(o.ref)!,
          type: 'UPSELL' as const,
          position,
        })),
      ];
      await prisma.productRelation.createMany({ data: rows, skipDuplicates: true });
    }

    // 5) admin owner for /admin (dev only; production uses the admin:create command)
    if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
      const owner = await upsertOwner(prisma, {
        email: process.env.SEED_ADMIN_EMAIL,
        name: process.env.SEED_ADMIN_NAME ?? 'Store owner',
        password: process.env.SEED_ADMIN_PASSWORD,
      });
      process.stdout.write(`Admin owner ${owner.created ? 'created' : 'updated'}\n`);
    } else {
      process.stdout.write(
        'No SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD set: skipped the admin owner\n',
      );
    }

    const [categories, products] = await Promise.all([
      prisma.category.count({ where: { showInMenu: true } }),
      prisma.product.count({ where: { isActive: true } }),
    ]);
    process.stdout.write(
      `Seed complete: ${categories} menu categories, ${products} active products\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
