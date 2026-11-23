import 'server-only';
import { updateTag } from 'next/cache';

/**
 * After an admin change to the catalog (products, categories, reviews, stock): expire the
 * storefront's cached catalog data (every `'use cache'` reader in lib/catalog.ts is tagged
 * "catalog"), so the shop shows the change on the very next visit instead of minutes later.
 * Only callable from server actions (Next.js updateTag).
 */
export function refreshStorefront(): void {
  updateTag('catalog');
}
