import type { ShippingZone } from '../delivery.js';
import type { OrderStatusName } from './admin.types.js';

/**
 * Storefront checkout contracts (glowy QuickCheckout + Checkout).
 * Prices, stock and discounts are always computed by the API from the catalog; the browser
 * only says which products, variants and quantities.
 */

export type CheckoutMode = 'buy_now' | 'cart';

export interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CheckoutLine {
  productId: string;
  variantId: string | null;
  name: string;
  variantTitle: string | null;
  image: string | null;
  /** Catalog price per unit (before the bundle discount). */
  unitPrice: number;
  quantity: number;
  /** Bundle & Save tier applied to this line ("Buy 3, save 15%"), 0 when none. */
  discountPercent: number;
  /** unitPrice × quantity. */
  lineSubtotal: number;
  /** Taka taken off by the bundle tier. */
  lineDiscount: number;
}

export interface CheckoutQuote {
  lines: CheckoutLine[];
  subtotal: number;
  discount: number;
  /** A bundle tier with free delivery applies. */
  freeShipping: boolean;
  /** null until a district is chosen. */
  zone: ShippingZone | null;
  shipping: number;
  total: number;
}

export interface CheckoutQuoteRequest {
  items: CheckoutItemInput[];
  district?: string | null;
}

export interface PlaceOrderRequest {
  mode: CheckoutMode;
  items: CheckoutItemInput[];
  customerName: string;
  phone: string;
  address: string;
  district: string;
  note?: string | null;
  /** The browser's incomplete-checkout draft, marked recovered by this order */
  sessionKey?: string | null;
}

/** Where the customer goes after ordering: /orders/<number>?t=<token> (valid 30 days). */
export interface PlacedOrder {
  number: string;
  token: string;
}

/** The customer's order confirmation page. */
export interface OrderConfirmation {
  number: string;
  status: OrderStatusName;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  note: string | null;
  items: {
    name: string;
    variantTitle: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
}
