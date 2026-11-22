import { Prisma } from '../../generated/prisma/client.js';
import {
  discountPercent,
  type ProductCardRecord,
  type ProductDetailRecord,
  toProductCard,
  toProductDetail,
} from './catalog.mapper.js';

const category = { id: 'c1', slug: 'home-kitchen', name: 'Home & Kitchen', image: '/c.jpg' };

function cardRecord(overrides: Partial<ProductCardRecord> = {}): ProductCardRecord {
  return {
    id: 'p1',
    categoryId: 'c1',
    name: 'Beewax',
    slug: 'beewax',
    sku: 'EHM-1',
    brand: null,
    productType: null,
    tags: [],
    shortDescription: null,
    description: null,
    specifications: null,
    price: 290,
    compareAtPrice: 490,
    stock: 62,
    soldCount: 28,
    ratingAverage: new Prisma.Decimal(4.9),
    ratingCount: 66,
    isFeatured: true,
    isActive: true,
    metaTitle: null,
    metaDescription: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      { path: '/1.jpg', alt: null },
      { path: '/2.jpg', alt: 'second' },
    ],
    category,
    options: [],
    ...overrides,
  };
}

describe('catalog mapper', () => {
  it('computes rounded discount percentages only for real discounts', () => {
    expect(discountPercent(290, 490)).toBe(40);
    expect(discountPercent(120, 360)).toBe(66);
    expect(discountPercent(500, null)).toBeNull();
    expect(discountPercent(500, 500)).toBeNull();
    expect(discountPercent(500, 400)).toBeNull();
  });

  it('maps a product card', () => {
    const card = toProductCard(cardRecord());
    expect(card).toMatchObject({
      price: 290,
      discountPercent: 40,
      image: { url: '/1.jpg', alt: 'Beewax' },
      hoverImage: { url: '/2.jpg', alt: 'second' },
      ratingAverage: 4.9,
      inStock: true,
      hasVariants: false,
    });
  });

  it('flags out-of-stock and variant products', () => {
    const card = toProductCard(
      cardRecord({ stock: 0, options: [{ id: 'o1' }] as ProductCardRecord['options'] }),
    );
    expect(card.inStock).toBe(false);
    expect(card.hasVariants).toBe(true);
  });

  it('maps product detail with relations, specs and breadcrumbs', () => {
    const base = cardRecord();
    const related = cardRecord({ id: 'p2', slug: 'gloves', name: 'Gloves' });
    const detail = toProductDetail(
      {
        ...base,
        specifications: [{ label: 'Brand', value: 'Mintiml' }, { bogus: true }],
        images: [{ id: 'i1', path: '/1.jpg', alt: null }],
        category: { ...category, parent: null },
        options: [],
        variants: [],
        bundles: [
          {
            id: 'b',
            productId: 'p1',
            quantity: 2,
            title: 'Buy 2',
            discountPercent: 10,
            badge: null,
            freeDelivery: false,
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        relations: [
          {
            id: 'r1',
            productId: 'p1',
            relatedProductId: 'p2',
            type: 'BUY_WITH',
            position: 0,
            createdAt: new Date(),
            relatedProduct: related,
          },
          {
            id: 'r2',
            productId: 'p1',
            relatedProductId: 'p2',
            type: 'UPSELL',
            position: 0,
            createdAt: new Date(),
            relatedProduct: related,
          },
        ],
      } as unknown as ProductDetailRecord,
      [],
    );
    expect(detail.specifications).toEqual([
      { label: 'Brand', value: 'Mintiml' },
      { label: 'Category', value: 'Home & Kitchen' },
    ]);
    expect(detail.bundles).toEqual([
      {
        quantity: 2,
        title: 'Buy 2',
        discountPercent: 10,
        badge: null,
        freeDelivery: false,
        isDefault: true,
      },
    ]);
    expect(detail.buyWith.map((p) => p.slug)).toEqual(['gloves']);
    expect(detail.upsells.map((p) => p.slug)).toEqual(['gloves']);
    expect(detail.breadcrumbs.map((c) => c.slug)).toEqual(['home-kitchen']);
  });
});
