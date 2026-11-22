/**
 * Development seed: loads the ehans-mart template catalog (categories, products,
 * images, bundles, variants, cross-sells). Idempotent: upserts by slug/sku, and
 * rebuilds each seeded product's child rows.
 *
 *   pnpm db:seed
 *
 * Refuses to run when NODE_ENV=production unless SEED_ALLOW_PRODUCTION=true.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { loadLocalEnvFile } from '../../config/load-env-file.js';
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
    const categoryIds = new Map<string, string>();
    for (const c of seedCategories) {
      const parent = await prisma.category.upsert({
        where: { slug: c.slug },
        create: {
          slug: c.slug,
          name: c.name,
          image: c.image,
          description: c.description,
          position: c.position,
          homePosition: c.homePosition,
          homeTitle: c.homeTitle,
        },
        update: {
          name: c.name,
          image: c.image,
          description: c.description,
          position: c.position,
          homePosition: c.homePosition,
          homeTitle: c.homeTitle,
        },
      });
      categoryIds.set(c.slug, parent.id);
      // sub-categories reuse the parent's product photos (cycled) until real images are uploaded
      const photos = seedProducts
        .filter((p) => p.category === c.slug)
        .map((p) => p.images[0])
        .filter(Boolean);
      for (const child of c.children) {
        const image = photos.length ? photos[child.position % photos.length]! : c.image;
        await prisma.category.upsert({
          where: { slug: child.slug },
          create: {
            slug: child.slug,
            name: child.name,
            image,
            position: child.position,
            parentId: parent.id,
          },
          update: { name: child.name, image, position: child.position, parentId: parent.id },
        });
      }
    }

    const productIds = new Map<number, string>();
    for (const p of seedProducts) {
      const categoryId = categoryIds.get(p.category);
      if (!categoryId) throw new Error(`Unknown category ${p.category} for ${p.sku}`);
      const fields = {
        name: p.name,
        slug: p.slug,
        categoryId,
        brand: p.brand ?? null,
        tags: p.tags,
        description: p.description ?? null,
        specifications: p.specifications ?? undefined,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        soldCount: p.soldCount,
        ratingAverage: p.ratingAverage,
        ratingCount: p.ratingCount,
        isFeatured: p.isFeatured,
        isActive: true,
      };
      const product = await prisma.product.upsert({
        where: { sku: p.sku },
        create: { sku: p.sku, ...fields },
        update: fields,
      });
      productIds.set(p.ref, product.id);

      await prisma.$transaction([
        prisma.productVariant.deleteMany({ where: { productId: product.id } }),
        prisma.productOption.deleteMany({ where: { productId: product.id } }),
        prisma.productImage.deleteMany({ where: { productId: product.id } }),
        prisma.productBundle.deleteMany({ where: { productId: product.id } }),
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
          data: (p.options ?? []).map((o, i) => ({
            productId: product.id,
            name: o.name,
            values: o.values,
            position: i + 1,
          })),
        }),
        prisma.productVariant.createMany({
          data: (p.variants ?? []).map((v, i) => ({
            productId: product.id,
            title: v.title,
            option1: v.option1,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: p.stock,
            position: i + 1,
          })),
        }),
      ]);
    }

    // Cross-sells. Products without explicit ones get same-category suggestions.
    await prisma.productRelation.deleteMany({
      where: { productId: { in: [...productIds.values()] } },
    });
    for (const p of seedProducts) {
      const id = productIds.get(p.ref)!;
      const sameCategory = seedProducts
        .filter((o) => o.category === p.category && o.ref !== p.ref)
        .map((o) => o.ref);
      const others = seedProducts
        .filter((o) => o.ref !== p.ref && !sameCategory.includes(o.ref))
        .map((o) => o.ref);
      const buyWith = p.buyWith ?? sameCategory.slice(0, 2);
      const upsells = p.upsells ?? [...sameCategory.slice(2), ...others].slice(0, 3);
      const rows = [
        ...buyWith.map((ref, position) => ({
          productId: id,
          relatedProductId: productIds.get(ref)!,
          type: 'BUY_WITH' as const,
          position,
        })),
        ...upsells.map((ref, position) => ({
          productId: id,
          relatedProductId: productIds.get(ref)!,
          type: 'UPSELL' as const,
          position,
        })),
      ].filter((r) => r.relatedProductId);
      await prisma.productRelation.createMany({ data: rows, skipDuplicates: true });
    }

    const [categories, products] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
    ]);
    process.stdout.write(`Seed complete: ${categories} categories, ${products} products\n`);
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
