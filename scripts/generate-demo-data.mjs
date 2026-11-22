/**
 * One-off: transforms the backend seed data (already compiled in apps/backend/dist)
 * into static JSON matching the catalog API response shapes, so the frontend can
 * render without the backend.
 *
 *   node scripts/generate-demo-data.mjs
 *
 * Writes: apps/frontend/src/data/*.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedCategories, seedProducts, seedBundles } from '../apps/backend/dist/database/seed/catalog.seed-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../apps/frontend/src/data');
mkdirSync(outDir, { recursive: true });

const HOME_GRID_COLLECTION = 'trendy-items';
const HOME_GRID_TITLE = 'Trending Items';
const HOME_GRID_PAGE_SIZE = 20;
const POPULAR_SIZE = 8;

// ── helpers (mirror catalog.mapper.ts) ──────────────────────────────────────

function discountPercent(price, compareAtPrice) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.floor(((compareAtPrice - price) / compareAtPrice) * 100);
}

function image(img, fallbackAlt) {
  return img ? { url: img, alt: fallbackAlt } : null;
}

function catSummary(cat) {
  return { id: `cat-${cat.slug}`, slug: cat.slug, name: cat.name, image: cat.image };
}

// Build a lookup: slug → SeedCategory
const catBySlug = new Map(seedCategories.map((c) => [c.slug, c]));

// Build a lookup: slug → child categories
const childrenBySlug = new Map();
for (const c of seedCategories) {
  const parent = c.parent;
  if (!parent) continue;
  if (!childrenBySlug.has(parent)) childrenBySlug.set(parent, []);
  childrenBySlug.get(parent).push(c);
}

// Count products per category (by primary category + collections)
const productCountByCat = new Map();
for (const p of seedProducts) {
  const cats = new Set([p.category, ...p.collections.map((m) => m.collection)]);
  for (const slug of cats) {
    productCountByCat.set(slug, (productCountByCat.get(slug) ?? 0) + 1);
  }
}

// ── ProductCard ─────────────────────────────────────────────────────────────

function toProductCard(p) {
  const cat = catBySlug.get(p.category);
  return {
    id: `prod-${p.ref}`,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    discountPercent: discountPercent(p.price, p.compareAtPrice),
    image: image(p.images[0], p.name),
    hoverImage: image(p.images[1] ?? null, p.name),
    ratingAverage: null,
    ratingCount: 0,
    inStock: p.stock > 0,
    category: cat ? catSummary(cat) : { id: 'cat-unknown', slug: p.category, name: p.category, image: null },
    hasVariants: p.options.length > 0,
  };
}

// ── ProductDetail ───────────────────────────────────────────────────────────

function toProductDetail(p) {
  const cat = catBySlug.get(p.category);
  const parentCat = cat?.parent ? catBySlug.get(cat.parent) : null;

  // breadcrumbs: parent then category
  const breadcrumbs = [parentCat, cat].filter(Boolean).map(catSummary);

  // cross-sells: same primary category (first 2 = buyWith, rest = upsells)
  const sameCat = seedProducts.filter((o) => o.category === p.category && o.ref !== p.ref);
  const others = seedProducts.filter((o) => o.ref !== p.ref && o.category !== p.category);
  const buyWith = sameCat.slice(0, 2).map(toProductCard);
  const upsells = [...sameCat.slice(2), ...others].slice(0, 3).map(toProductCard);
  const related = [...sameCat, ...others].slice(0, 8).map(toProductCard);

  return {
    ...toProductCard(p),
    sku: p.sku,
    brand: p.brand,
    tags: p.tags,
    shortDescription: null,
    descriptionHtml: p.description,
    specifications: [{ label: 'Category', value: cat?.name ?? p.category }],
    images: p.images.map((img) => ({ url: img, alt: p.name })),
    stock: p.stock,
    soldCount: 0,
    options: p.options.map((o) => ({ name: o.name, values: o.values, swatches: null })),
    variants: p.variants.map((v, i) => ({
      id: `var-${p.ref}-${i}`,
      title: v.title,
      options: v.options,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
      imageUrl: null,
    })),
    bundles: seedBundles.map((b) => ({
      quantity: b.quantity,
      title: b.title,
      discountPercent: b.discountPercent,
      badge: b.badge,
      freeDelivery: b.freeDelivery,
      isDefault: b.isDefault,
    })),
    buyWith,
    upsells,
    related,
    breadcrumbs,
  };
}

// ── 1. CategoryNode[] (/catalog/categories) ────────────────────────────────

const categoryTree = seedCategories
  .filter((c) => c.parent === null && c.showInMenu)
  .sort((a, b) => a.position - b.position)
  .map((c) => {
    const children = (childrenBySlug.get(c.slug) ?? [])
      .filter((ch) => ch.showInMenu)
      .sort((a, b) => a.position - b.position)
      .map(catSummary);
    const ownCount = productCountByCat.get(c.slug) ?? 0;
    const childrenCount = children.reduce(
      (n, ch) => n + (productCountByCat.get(ch.slug) ?? 0),
      0,
    );
    return {
      ...catSummary(c),
      description: c.description,
      productCount: ownCount || childrenCount,
      children,
    };
  });

writeFileSync(resolve(outDir, 'categories.json'), JSON.stringify(categoryTree, null, 2));

// ── 2. HomeCatalog (/catalog/home) ─────────────────────────────────────────

const homeCategories = seedCategories
  .filter((c) => c.homePosition !== null)
  .sort((a, b) => a.homePosition - b.homePosition)
  .map(catSummary);

const popular = seedProducts
  .slice()
  .sort((a, b) => (b.stock - a.stock)) // "best-selling" proxy
  .slice(0, POPULAR_SIZE)
  .map(toProductCard);

const trendingProducts = seedProducts
  .filter((p) => p.collections.some((m) => m.collection === HOME_GRID_COLLECTION))
  .sort((a, b) => {
    const pa = a.collections.find((m) => m.collection === HOME_GRID_COLLECTION)?.position ?? 9999;
    const pb = b.collections.find((m) => m.collection === HOME_GRID_COLLECTION)?.position ?? 9999;
    return pa - pb;
  });
const trendingCat = catBySlug.get(HOME_GRID_COLLECTION);

const homeCatalog = {
  categories: homeCategories,
  trending:
    trendingProducts.length && trendingCat
      ? {
          title: HOME_GRID_TITLE,
          category: catSummary(trendingCat),
          items: trendingProducts.slice(0, HOME_GRID_PAGE_SIZE).map(toProductCard),
          total: trendingProducts.length,
          pageSize: HOME_GRID_PAGE_SIZE,
        }
      : null,
  popular,
};

writeFileSync(resolve(outDir, 'home.json'), JSON.stringify(homeCatalog, null, 2));

// ── 3. Products detail map (/catalog/products/:slug) ───────────────────────

const productDetails = {};
for (const p of seedProducts) {
  productDetails[p.slug] = toProductDetail(p);
}
writeFileSync(resolve(outDir, 'products.json'), JSON.stringify(productDetails, null, 2));

// ── 4. All products as cards (for collection pages & search) ────────────────

const allCards = seedProducts.map(toProductCard);

// Build a simple product list response for each category
const productLists = {};
const allCats = new Set(seedProducts.map((p) => p.category));
for (const c of seedCategories) {
  allCats.add(c.slug);
}

for (const slug of allCats) {
  // Products in this category (by primary category or collection membership)
  const items = seedProducts
    .filter(
      (p) =>
        p.category === slug || p.collections.some((m) => m.collection === slug),
    )
    .map(toProductCard);

  if (items.length === 0) continue;

  const prices = items.map((p) => p.price);
  productLists[slug] = {
    items,
    page: 1,
    pageSize: items.length,
    total: items.length,
    totalPages: 1,
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
  };
}

// Also create an "all products" list
const allPrices = allCards.map((p) => p.price);
productLists['__all__'] = {
  items: allCards,
  page: 1,
  pageSize: allCards.length,
  total: allCards.length,
  totalPages: 1,
  priceRange: { min: Math.min(...allPrices), max: Math.max(...allPrices) },
};

writeFileSync(resolve(outDir, 'product-lists.json'), JSON.stringify(productLists, null, 2));

// ── summary ────────────────────────────────────────────────────────────────

console.log(
  [
    `Generated demo data in ${outDir}:`,
    `  categories.json     — ${categoryTree.length} top-level categories`,
    `  home.json            — ${homeCategories.length} home categories, ${trendingProducts.length} trending, ${popular.length} popular`,
    `  products.json        — ${Object.keys(productDetails).length} product details`,
    `  product-lists.json   — ${Object.keys(productLists).length} collection lists`,
  ].join('\n'),
);
