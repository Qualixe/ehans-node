import { fraudRisk } from '@ehans/shared';
import { describe, expect, it } from 'vitest';
import { normalizePhone, parseBdCourier } from './bd-courier.js';

describe('parseBdCourier', () => {
  it('reads the per-courier map and the summary', () => {
    const parsed = parseBdCourier({
      status: 'success',
      data: {
        pathao: { name: 'Pathao', total_parcel: 10, success_parcel: 8, cancelled_parcel: 2 },
        steadfast: { name: 'Steadfast', total_parcel: 0, success_parcel: 0, cancelled_parcel: 0 },
        redx: { total_parcels: '5', delivered: '5', cancel: 0 },
        summary: { total_parcel: 15, success_parcel: 13, cancelled_parcel: 2 },
      },
    });
    expect(parsed).toEqual({
      totalParcels: 15,
      successParcels: 13,
      cancelledParcels: 2,
      successRatio: 87,
      couriers: [
        { name: 'Pathao', total: 10, success: 8, cancelled: 2 },
        { name: 'Redx', total: 5, success: 5, cancelled: 0 },
      ],
    });
  });

  it('adds the couriers up when there is no summary, and accepts courierData', () => {
    const parsed = parseBdCourier({
      courierData: { paperfly: { total: 4, success: 1, cancelled: 3 } },
    });
    expect(parsed.totalParcels).toBe(4);
    expect(parsed.successRatio).toBe(25);
  });

  it('a number with no parcels has no ratio', () => {
    expect(parseBdCourier({ data: { summary: { total_parcel: 0 } } }).successRatio).toBeNull();
    expect(parseBdCourier(null).totalParcels).toBe(0);
  });
});

describe('fraudRisk (glowy FraudCheck::risk)', () => {
  it('new / safe / watch / risky', () => {
    expect(fraudRisk({ totalParcels: 0, successRatio: null })).toBe('new');
    expect(fraudRisk({ totalParcels: 9, successRatio: 80 })).toBe('safe');
    expect(fraudRisk({ totalParcels: 9, successRatio: 50 })).toBe('watch');
    expect(fraudRisk({ totalParcels: 9, successRatio: 49 })).toBe('risky');
  });
});

describe('normalizePhone', () => {
  it('drops +88, spaces and dashes', () => {
    expect(normalizePhone('+88 017-1234 5678')).toBe('01712345678');
    expect(normalizePhone('8801712345678')).toBe('01712345678');
  });
});
