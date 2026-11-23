'use server';

import type {
  CheckoutItemInput,
  CheckoutQuote,
  PlacedOrder,
  PlaceOrderRequest,
} from '@ehans/shared';
import { headers } from 'next/headers';
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
  try {
    const order = await apiFetch<PlacedOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(input),
      cache: 'no-store',
      headers: ip ? { 'X-Forwarded-For': ip } : {},
    });
    return { order };
  } catch (error) {
    return {
      errors: messages(error, 'We could not place your order. Please try again or call us.'),
    };
  }
}
