import type {
  CategoryNode,
  HomeCatalog,
  ProductCard,
  ProductDetail,
  ProductListResponse,
  ProductSort,
} from '@ehans/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { ApiError, apiFetch } from './api-client';

// Demo data (generated from the backend seed catalog). Used as a fallback when
// the backend is not running, so the storefront can be previewed standalone.
// Regenerate with: node scripts/generate-demo-data.mjs
import localCategories from '@/data/categories.json';
import localHome from '@/data/home.json';
import localProducts from '@/data/products.json';
import localProductLists from '@/data/product-lists.json';

/**
 * Server-side catalog reads. Each is a `use cache` function: results are cached
 * at runtime for a few minutes (callers run after `connection()`, so nothing is
 * fetched at build time). Tags allow on-demand revalidation from the admin later.
 *
 * Every function tries the live API first and falls back to bundled demo JSON when
 * the backend is unreachable. This lets you run `pnpm dev` without the backend.
 */

export async function getCategories(): Promise<CategoryNode[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', 'categories');
  try {
    return await apiFetch<CategoryNode[]>('/catalog/categories');
  } catch {
    return localCategories as unknown as CategoryNode[];
  }
}

export async function getHomeCatalog(): Promise<HomeCatalog> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', 'home');
  try {
    return await apiFetch<HomeCatalog>('/catalog/home');
  } catch {
    return localHome as unknown as HomeCatalog;
  }
}

export interface ProductListParams {
  category?: string;
  q?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export async function getProducts(params: ProductListParams): Promise<ProductListResponse> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', 'products');
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  try {
    return await apiFetch<ProductListResponse>(`/catalog/products?${search.toString()}`);
  } catch {
    return getLocalProducts(params);
  }
}

/** Returns null when the product does not exist (caller renders notFound()). */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', `product:${slug}`);
  try {
    return await apiFetch<ProductDetail>(`/catalog/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    // Backend unreachable — fall back to demo data
    const details = localProducts as unknown as Record<string, ProductDetail>;
    return details[slug] ?? null;
  }
}

// ── Local demo data helpers ─────────────────────────────────────────────────

function getLocalProducts(params: ProductListParams): ProductListResponse {
  const lists = localProductLists as unknown as Record<string, ProductListResponse>;
  const list = lists[params.category ?? '__all__'] ?? lists['__all__'];
  if (!list) {
    return {
      items: [],
      page: 1,
      pageSize: 24,
      total: 0,
      totalPages: 1,
      priceRange: { min: 0, max: 0 },
    };
  }

  let items = [...list.items] as ProductCard[];

  // Search filter (name or slug)
  if (params.q) {
    const q = params.q.toLowerCase();
    items = items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }

  // Sort
  switch (params.sort) {
    case 'price-asc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items.sort((a, b) => b.price - a.price);
      break;
    // 'manual', 'featured', 'newest', 'best-selling' — keep original order
  }

  // Paginate
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const prices = list.items.map((p) => p.price);
  return {
    items: pageItems,
    page,
    pageSize,
    total,
    totalPages,
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
  };
}
