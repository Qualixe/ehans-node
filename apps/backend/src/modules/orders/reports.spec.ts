import { describe, expect, it } from 'vitest';
import { orderProfit, type ProfitInput } from './reports.service.js';

const base: ProfitInput = {
  status: 'delivered',
  total: 1080,
  advance: 0,
  codAmount: null,
  courierFee: null,
  shippingFee: 80,
  cost: 600,
};

describe('orderProfit', () => {
  it('delivered: total − product cost − courier charge − 1% COD', () => {
    // COD 1080 → fee 11; courier falls back to the delivery fee (80)
    expect(orderProfit(base)).toEqual({
      revenue: 1080,
      productCost: 600,
      courier: 91,
      returnLoss: 0,
      profit: 389,
    });
  });

  it('uses the booked courier charge and leaves the advance out of COD', () => {
    const p = orderProfit({ ...base, courierFee: 70, advance: 80 })!;
    expect(p.courier).toBe(70 + 10);
    expect(p.profit).toBe(1080 - 600 - 80);
  });

  it('returned: keeps the advance, loses delivery + half again for the return', () => {
    expect(orderProfit({ ...base, status: 'returned', advance: 100 })).toEqual({
      revenue: 100,
      productCost: 0,
      courier: 0,
      returnLoss: 120,
      profit: -20,
    });
  });

  it('partly delivered: counts only the collected share', () => {
    const p = orderProfit({ ...base, status: 'partial', codAmount: 540 })!;
    expect(p.revenue).toBe(540);
    expect(p.productCost).toBe(300);
    expect(p.courier).toBe(80 + 5);
  });

  it('open and cancelled orders have no profit yet', () => {
    for (const status of ['pending', 'confirmed', 'shipped', 'cancelled', 'fake'] as const) {
      expect(orderProfit({ ...base, status })).toBeNull();
    }
  });
});
