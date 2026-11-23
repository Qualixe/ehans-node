import { describe, expect, it } from 'vitest';
import type { ResolvedLine } from '../catalog/catalog-checkout.service.js';
import { orderNumber, totalsFor } from './checkout.service.js';

const line = (over: Partial<ResolvedLine> = {}): ResolvedLine => ({
  productId: 'p',
  variantId: null,
  name: 'Item',
  variantTitle: null,
  image: null,
  unitPrice: 350,
  quantity: 2,
  discountPercent: 10,
  lineSubtotal: 700,
  lineDiscount: 70,
  freeDelivery: false,
  ...over,
});

describe('totalsFor', () => {
  it('charges the Dhaka fee inside Dhaka and the outside fee elsewhere', () => {
    expect(totalsFor([line()], 'dhaka')).toMatchObject({ shipping: 80, total: 710 });
    expect(totalsFor([line()], 'rangpur')).toMatchObject({
      zone: 'outside_dhaka',
      shipping: 130,
      total: 760,
    });
  });

  it('charges nothing for delivery until a district is chosen', () => {
    expect(totalsFor([line()], null)).toMatchObject({ zone: null, shipping: 0, total: 630 });
  });

  it('gives free delivery when any line has a free-delivery bundle', () => {
    const t = totalsFor([line(), line({ freeDelivery: true })], 'rangpur');
    expect(t).toMatchObject({ freeShipping: true, shipping: 0, subtotal: 1400, total: 1260 });
  });
});

describe('orderNumber', () => {
  it('is EH + Dhaka date + 5 characters', () => {
    // 20:00 UTC on 23 Nov is already 24 Nov in Dhaka (UTC+6)
    expect(orderNumber(new Date('2026-11-23T20:00:00Z'))).toMatch(/^EH261124[A-Z2-9]{5}$/);
  });
});
