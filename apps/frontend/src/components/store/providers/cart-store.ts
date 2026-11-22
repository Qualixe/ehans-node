'use client';

import { useSyncExternalStore } from 'react';

/**
 * Browser cart, persisted in localStorage under the template's key so it is the
 * same on every page and tab. Server-side carts arrive with the checkout module.
 */
export interface CartItem {
  /** Line id: same product + variant + unit price = same line. */
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  img: string;
  /** Unit price in taka (bundle discounts already applied). */
  price: number;
  url: string;
  qty: number;
}

const KEY = 'ehans-mart-cart';
const MAX_QTY = 99;
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) items = parsed.filter(isCartItem);
  } catch {
    items = EMPTY;
  }
  cache = { raw, items };
  return items;
}

function isCartItem(value: unknown): value is CartItem {
  const v = value as Partial<CartItem>;
  return (
    typeof v?.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.price === 'number' &&
    typeof v.qty === 'number'
  );
}

function write(items: CartItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked: keep the in-memory value
    cache = { raw: null, items };
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const cartActions = {
  add(item: Omit<CartItem, 'qty'>, qty = 1): void {
    const items = read().map((i) => ({ ...i }));
    const existing = items.find((i) => i.id === item.id);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else items.push({ ...item, qty: Math.min(MAX_QTY, qty) });
    write(items);
  },
  setQty(id: string, qty: number): void {
    write(
      read().map((i) =>
        i.id === id ? { ...i, qty: Math.min(MAX_QTY, Math.max(1, Math.floor(qty) || 1)) } : i,
      ),
    );
  },
  remove(id: string): void {
    write(read().filter((i) => i.id !== id));
  },
  clear(): void {
    write([]);
  },
};

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  return { items, count, total, ...cartActions };
}
