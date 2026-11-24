import { describe, expect, it } from 'vitest';
import { CourierService } from '../couriers/courier.service.js';
import { panelWindow } from './order-panel.service.js';

// 23 Nov 2026, 20:00 UTC = 24 Nov 02:00 in Dhaka
const NOW = new Date('2026-11-23T20:00:00Z');
const dhaka = (ymd: string) => new Date(`${ymd}T00:00:00+06:00`);

describe('panelWindow (order panel date filter, Dhaka days)', () => {
  it('quick ranges', () => {
    expect(panelWindow({ date: 'today' }, NOW)).toEqual({
      gte: dhaka('2026-11-24'),
      lt: dhaka('2026-11-25'),
    });
    expect(panelWindow({ date: 'yesterday' }, NOW)).toEqual({
      gte: dhaka('2026-11-23'),
      lt: dhaka('2026-11-24'),
    });
    expect(panelWindow({ date: '15d' }, NOW)?.gte).toEqual(dhaka('2026-11-10'));
    expect(panelWindow({ date: '30d' }, NOW)?.gte).toEqual(dhaka('2026-10-26'));
    expect(panelWindow({ date: 'all' }, NOW)).toBeNull();
  });

  it('custom range includes the whole last day', () => {
    expect(panelWindow({ date: 'custom', from: '2026-11-01', to: '2026-11-05' }, NOW)).toEqual({
      gte: dhaka('2026-11-01'),
      lt: dhaka('2026-11-06'),
    });
    expect(panelWindow({ date: 'custom' }, NOW)).toBeNull();
  });
});

describe('courier status → order status', () => {
  it('Steadfast', () => {
    expect(CourierService.orderStatusFor('steadfast', 'delivered')).toBe('delivered');
    expect(CourierService.orderStatusFor('steadfast', 'partial_delivered')).toBe('partial');
    expect(CourierService.orderStatusFor('steadfast', 'cancelled')).toBe('returned');
    expect(CourierService.orderStatusFor('steadfast', 'in_review')).toBeNull();
  });

  it('Pathao', () => {
    expect(CourierService.orderStatusFor('pathao', 'delivered')).toBe('delivered');
    expect(CourierService.orderStatusFor('pathao', 'partial_delivery')).toBe('partial');
    expect(CourierService.orderStatusFor('pathao', 'returned')).toBe('returned');
    expect(CourierService.orderStatusFor('pathao', 'pending')).toBeNull();
  });

  it('tracking links', () => {
    expect(CourierService.trackingUrl('steadfast', '123', 'ABC', '01712345678')).toBe(
      'https://steadfast.com.bd/t/ABC',
    );
    expect(CourierService.trackingUrl('pathao', 'DH123', null, '01712345678')).toContain(
      'consignment_id=DH123',
    );
  });
});
