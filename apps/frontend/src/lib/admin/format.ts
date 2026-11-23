/** "৳1,250": glowy's Money::format (whole taka). */
export function money(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

export function number(value: number): string {
  return value.toLocaleString('en-US');
}

/** "3 hours ago": Carbon's diffForHumans(). */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  const units: [string, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, size] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

export const plural = (word: string, count: number) => (count === 1 ? word : `${word}s`);
