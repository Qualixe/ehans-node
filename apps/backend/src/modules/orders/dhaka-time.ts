/**
 * Calendar maths in the store's time zone (Asia/Dhaka, UTC+6, no daylight saving),
 * so "today" and "this month" match the shop owner's day, as glowy's app timezone does.
 */
export const STORE_TIME_ZONE = 'Asia/Dhaka';
const OFFSET_MS = 6 * 3600_000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Wall-clock parts of an instant in Dhaka. */
function parts(date: Date) {
  const local = new Date(date.getTime() + OFFSET_MS);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() };
}

const fromLocal = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) - OFFSET_MS);

export const startOfDay = (date: Date): Date => {
  const { y, m, d } = parts(date);
  return fromLocal(y, m, d);
};

export const startOfMonth = (date: Date): Date => {
  const { y, m } = parts(date);
  return fromLocal(y, m, 1);
};

export const addDays = (date: Date, days: number): Date => {
  const { y, m, d } = parts(date);
  return fromLocal(y, m, d + days);
};

export const addMonths = (date: Date, months: number): Date => {
  const { y, m } = parts(date);
  return fromLocal(y, m + months, 1);
};

/** Bucket key used to group orders: "2026-11-22" (day) or "2026-11" (month). */
export function bucketKey(date: Date, bucket: 'day' | 'month'): string {
  const { y, m, d } = parts(date);
  const mm = String(m + 1).padStart(2, '0');
  return bucket === 'day' ? `${y}-${mm}-${String(d).padStart(2, '0')}` : `${y}-${mm}`;
}

/** Chart label: "Nov 22" (day) or "Nov" (month), like glowy's 'M j' / 'M'. */
export function bucketLabel(date: Date, bucket: 'day' | 'month'): string {
  const { m, d } = parts(date);
  return bucket === 'day' ? `${MONTHS[m]} ${d}` : MONTHS[m]!;
}
