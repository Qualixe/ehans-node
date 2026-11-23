import {
  addDays,
  addMonths,
  bucketKey,
  bucketLabel,
  startOfDay,
  startOfMonth,
} from './dhaka-time.js';
import { percentChange } from './order-stats.service.js';

describe('percentChange (glowy DashboardMetrics::change)', () => {
  it('is null with nothing before and nothing now, 100 when starting from zero', () => {
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(500, 0)).toBe(100);
  });

  it('rounds to one decimal', () => {
    expect(percentChange(150, 120)).toBe(25);
    expect(percentChange(100, 300)).toBe(-66.7);
  });
});

describe('Dhaka calendar', () => {
  // 2026-11-21 20:30 UTC is already 2026-11-22 02:30 in Dhaka
  const lateNightUtc = new Date('2026-11-21T20:30:00Z');

  it('starts the day at Dhaka midnight', () => {
    expect(startOfDay(lateNightUtc).toISOString()).toBe('2026-11-21T18:00:00.000Z');
    expect(bucketKey(lateNightUtc, 'day')).toBe('2026-11-22');
    expect(bucketLabel(lateNightUtc, 'day')).toBe('Nov 22');
  });

  it('steps days and months across boundaries', () => {
    expect(bucketKey(addDays(startOfDay(lateNightUtc), -22), 'day')).toBe('2026-10-31');
    const start = addMonths(startOfMonth(lateNightUtc), -11);
    expect(bucketKey(start, 'month')).toBe('2025-12');
    expect(bucketLabel(start, 'month')).toBe('Dec');
  });
});
