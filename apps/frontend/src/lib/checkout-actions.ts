'use server';

import type {
  CheckoutItemInput,
  CheckoutQuote,
  IncompleteCapture,
  PlacedOrder,
  PlaceOrderRequest,
} from '@ehans/shared';
import { headers } from 'next/headers';
import { getCustomerToken } from './account/session';
import { ApiError, apiFetch } from './api-client';

export type QuoteResult = { quote: CheckoutQuote } | { error: string };
export type PlaceResult = { order: PlacedOrder } | { errors: string[] };

const messages = (error: unknown, fallback: string): string[] => {
  if (error instanceof ApiError) {
    const m = error.body?.message ?? error.message;
    return Array.isArray(m) ? m : [m];
  }
  return [fallback];
};

/** Prices and totals from the API (the browser never decides prices). */
export async function quoteCheckout(
  items: CheckoutItemInput[],
  district: string | null,
): Promise<QuoteResult> {
  try {
    const quote = await apiFetch<CheckoutQuote>('/checkout/quote', {
      method: 'POST',
      body: JSON.stringify({ items, district }),
      cache: 'no-store',
    });
    return { quote };
  } catch (error) {
    return { error: messages(error, 'We could not load your order total. Please try again.')[0]! };
  }
}

/**
 * Places a cash-on-delivery order. The visitor's IP goes along so the API's per-visitor
 * order limit (10 a minute, like glowy) counts the shopper, not this server.
 */
export async function placeOrder(input: PlaceOrderRequest): Promise<PlaceResult> {
  const h = await headers();
  // our proxy (nginx) overwrites X-Forwarded-For with the real visitor, so it can't be faked
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip');
  // signed in: the order is saved to the customer's account ("My orders")
  const customer = await getCustomerToken();
  try {
    const order = await apiFetch<PlacedOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(input),
      cache: 'no-store',
      headers: {
        ...(ip ? { 'X-Forwarded-For': ip } : {}),
        ...(customer ? { Authorization: `Bearer ${customer}` } : {}),
      },
    });
    return { order };
  } catch (error) {
    return {
      errors: messages(error, 'We could not place your order. Please try again or call us.'),
    };
  }
}

/**
 * Saves the shopper's half-filled order form (order panel "Incomplete orders"), so staff can
 * call if they don't finish. Best effort: failures are ignored.
 */
export async function captureIncomplete(input: IncompleteCapture): Promise<void> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip');
  await apiFetch('/checkout/incomplete', {
    method: 'POST',
    body: JSON.stringify(input),
    cache: 'no-store',
    headers: ip ? { 'X-Forwarded-For': ip } : {},
  }).catch(() => undefined);
}
