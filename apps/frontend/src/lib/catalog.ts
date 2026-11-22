import type {
  CategoryNode,
  HomeCatalog,
  ProductDetail,
  ProductListResponse,
  ProductSort,
} from '@ehans/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { ApiError, apiFetch } from './api-client';

/**
 * Server-side catalog reads. Each is a `use cache` function: results are cached
 * at runtime for a few minutes (callers run after `connection()`, so nothing is
 * fetched at build time). Tags allow on-demand revalidation from the admin later.
 */

export async function getCategories(): Promise<CategoryNode[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', 'categories');
  return apiFetch<CategoryNode[]>('/catalog/categories');
}

export async function getHomeCatalog(): Promise<HomeCatalog> {
  'use cache';
  cacheLife('minutes');
  cacheTag('catalog', 'home');
  return apiFetch<HomeCatalog>('/catalog/home');
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
  return apiFetch<ProductListResponse>(`/catalog/products?${search.toString()}`);
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
    throw error;
  }
}
