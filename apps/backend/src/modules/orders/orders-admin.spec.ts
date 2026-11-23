import { describe, expect, it } from 'vitest';
import { dateWindow, orderWhere } from './orders-admin.service.js';

// 23 Nov 2026, 20:00 UTC = 24 Nov 02:00 in Dhaka
const NOW = new Date('2026-11-23T20:00:00Z');
const dhakaMidnight = (ymd: string) => new Date(`${ymd}T00:00:00+06:00`);

describe('dateWindow (Dhaka days)', () => {
  it('today / yesterday / last 7 days / this month', () => {
    expect(dateWindow({ range: 'today' }, NOW)).toEqual({
      gte: dhakaMidnight('2026-11-24'),
      lt: dhakaMidnight('2026-11-25'),
    });
    expect(dateWindow({ range: 'yesterday' }, NOW)).toEqual({
      gte: dhakaMidnight('2026-11-23'),
      lt: dhakaMidnight('2026-11-24'),
    });
    expect(dateWindow({ range: '7days' }, NOW)?.gte).toEqual(dhakaMidnight('2026-11-18'));
    expect(dateWindow({ range: 'month' }, NOW)?.gte).toEqual(dhakaMidnight('2026-11-01'));
  });

  it('custom from/to includes the whole "to" day', () => {
    expect(dateWindow({ range: 'custom', from: '2026-11-01', to: '2026-11-10' }, NOW)).toEqual({
      gte: dhakaMidnight('2026-11-01'),
      lt: dhakaMidnight('2026-11-11'),
    });
    expect(dateWindow({}, NOW)).toBeNull();
  });
});

describe('orderWhere', () => {
  it('maps status, channel and a search over number, name, phone, email and exact IP', () => {
    const where = orderWhere({ status: 'pending', channel: 'direct', q: ' 0171 ' }, NOW);
    expect(where.status).toBe('PENDING');
    expect(where.channel).toBe('DIRECT');
    expect(where.OR).toContainEqual({ phone: { contains: '0171' } });
    expect(where.OR).toContainEqual({ ipAddress: '0171' });
    expect(where.createdAt).toBeUndefined();
  });
});
