import type {
  CategorySummary,
  CrossSellCard,
  ProductBundleDto,
  ProductCard,
  ProductDetail,
  ProductImageDto,
  ProductSpecification,
} from '@ehans/shared';
import { Prisma } from '../../generated/prisma/client.js';

export const categorySummarySelect = {
  id: true,
  slug: true,
  name: true,
  image: true,
} satisfies Prisma.CategorySelect;

/** Relations needed to render a product card. */
export const productCardInclude = {
  images: { orderBy: { position: 'asc' }, take: 2, select: { path: true, alt: true } },
  category: { select: categorySummarySelect },
  options: { select: { id: true }, take: 1 },
} satisfies Prisma.ProductInclude;

export type ProductCardRecord = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export const productDetailInclude = {
  images: { orderBy: { position: 'asc' }, select: { id: true, path: true, alt: true } },
  category: { select: { ...categorySummarySelect, parent: { select: categorySummarySelect } } },
  options: { orderBy: { position: 'asc' } },
  variants: { orderBy: { position: 'asc' }, include: { image: { select: { path: true } } } },
  bundles: { orderBy: { quantity: 'asc' } },
  relations: {
    orderBy: { position: 'asc' },
    where: { relatedProduct: { isActive: true } },
    include: {
      relatedProduct: {
        include: {
          ...productCardInclude,
          variants: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              image: { select: { path: true, alt: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductDetailRecord = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

export function discountPercent(price: number, compareAtPrice: number | null): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  // rounded down, like the live theme (240/360 off → -66%)
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}

const image = (
  img: { path: string; alt: string | null } | undefined,
  fallbackAlt: string,
): ProductImageDto | null => (img ? { url: img.path, alt: img.alt ?? fallbackAlt } : null);

const toCategorySummary = (c: CategorySummary): CategorySummary => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  image: c.image,
});

export function toProductCard(p: ProductCardRecord): ProductCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    discountPercent: discountPercent(p.price, p.compareAtPrice),
    image: image(p.images[0], p.name),
    hoverImage: image(p.images[1], p.name),
    ratingAverage: p.ratingAverage === null ? null : Number(p.ratingAverage),
    ratingCount: p.ratingCount,
    inStock: p.stock > 0,
    category: toCategorySummary(p.category),
    hasVariants: p.options.length > 0,
  };
}

function specifications(value: Prisma.JsonValue | null): ProductSpecification[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) =>
    row &&
    typeof row === 'object' &&
    !Array.isArray(row) &&
    typeof row.label === 'string' &&
    typeof row.value === 'string'
      ? [{ label: row.label, value: row.value }]
      : [],
  );
}

function swatches(value: Prisma.JsonValue | null): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value).filter((e): e is [string, string] => typeof e[1] === 'string'),
  );
}

export function toProductDetail(p: ProductDetailRecord, related: ProductCard[]): ProductDetail {
  const card = toProductCard({
    ...p,
    images: p.images.slice(0, 2),
    category: p.category,
    options: p.options.slice(0, 1).map((o) => ({ id: o.id })),
  });
  const bundles: ProductBundleDto[] = p.bundles.map((b) => ({
    quantity: b.quantity,
    title: b.title,
    discountPercent: b.discountPercent,
    badge: b.badge,
    freeDelivery: b.freeDelivery,
    isDefault: b.isDefault,
  }));
  const relationCards = (type: 'BUY_WITH' | 'UPSELL'): CrossSellCard[] =>
    p.relations
      .filter((r) => r.type === type)
      .map(({ relatedProduct: rp }) => {
        const card = toProductCard(rp);
        return {
          ...card,
          // variants only matter when the shopper has to choose one
          variants: card.hasVariants
            ? rp.variants.map((v) => ({
                id: v.id,
                title: v.title,
                price: v.price,
                compareAtPrice:
                  v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : null,
                inStock: v.stock > 0,
                image: image(v.image ?? undefined, rp.name),
              }))
            : [],
        };
      });

  return {
    ...card,
    sku: p.sku,
    brand: p.brand,
    tags: p.tags,
    shortDescription: p.shortDescription,
    descriptionHtml: p.description,
    specifications: [
      ...specifications(p.specifications),
      { label: 'Category', value: p.category.name },
    ],
    images: p.images.map((img) => ({ url: img.path, alt: img.alt ?? p.name })),
    stock: p.stock,
    soldCount: p.soldCount,
    options: p.options.map((o) => ({
      name: o.name,
      values: o.values,
      swatches: swatches(o.swatches),
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      title: v.title,
      options: [v.option1, v.option2, v.option3].filter((o): o is string => Boolean(o)),
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      imageUrl: v.image?.path ?? null,
    })),
    bundles,
    buyWith: relationCards('BUY_WITH'),
    upsells: relationCards('UPSELL'),
    buyWithTitle: p.buyWithTitle,
    upsellTitle: p.upsellTitle,
    related,
    breadcrumbs: [p.category.parent, p.category]
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map(toCategorySummary),
  };
}
