'use client';

import { BD_MOBILE } from '@ehans/shared';
import { captureIncomplete } from '@/lib/checkout-actions';

const KEY = 'ehans-checkout-session';

/** A random id for this browser's checkout draft (kept until an order is placed). */
export function checkoutSessionKey(): string {
  try {
    let key = window.localStorage.getItem(KEY);
    if (!key) {
      key = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) =>
        b.toString(36).padStart(2, '0'),
      )
        .join('')
        .slice(0, 32);
      window.localStorage.setItem(KEY, key);
    }
    return key;
  } catch {
    return '';
  }
}

/** After an order is placed the next checkout starts a fresh draft. */
export function resetCheckoutSession(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
}

let timer: number | undefined;
let last = '';

/**
 * Saves the shopper's draft once the phone number is valid (debounced): the order panel's
 * "Incomplete orders". `step` is the first thing still missing.
 */
export function saveDraft(draft: {
  phone: string;
  name: string;
  address: string;
  district: string;
  items: { productId: string; variantId?: string | null; quantity: number }[];
}): void {
  const phone = draft.phone.replace(/[\s-]/g, '').replace(/^\+?88(?=01)/, '');
  if (!BD_MOBILE.test(phone) || !draft.items.length) return;
  const step = !draft.name.trim()
    ? 'Name'
    : draft.address.trim().length < 8
      ? 'Address'
      : !draft.district
        ? 'District'
        : 'Place order';
  const payload = { ...draft, phone, step };
  const signature = JSON.stringify(payload);
  if (signature === last) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const sessionKey = checkoutSessionKey();
    if (!sessionKey) return;
    last = signature;
    void captureIncomplete({
      sessionKey,
      phone,
      name: draft.name.trim() || null,
      address: draft.address.trim() || null,
      district: draft.district || null,
      items: draft.items,
      step,
    });
  }, 1500);
}
