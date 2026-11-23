import type { FraudCourierRow } from '@ehans/shared';

export interface ParsedCheck {
  totalParcels: number;
  successParcels: number;
  cancelledParcels: number;
  successRatio: number | null;
  couriers: FraudCourierRow[];
}

type Row = Record<string, unknown>;
const isRow = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The first of these keys that holds a number (BD Courier's field names vary). */
const number = (row: Row, ...keys: string[]): number => {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return Math.max(0, Math.trunc(n));
    }
  }
  return 0;
};
const TOTAL = ['total_parcel', 'total_parcels', 'total'];
const SUCCESS = ['success_parcel', 'success_parcels', 'delivered', 'success'];
const CANCELLED = ['cancelled_parcel', 'cancelled_parcels', 'cancel', 'cancelled'];

/**
 * BD Courier's per-courier map plus an optional "summary" entry (glowy BdCourier::parse),
 * tolerant of missing fields. The reply may wrap it in "data" or "courierData".
 */
export function parseBdCourier(json: unknown): ParsedCheck {
  const root = isRow(json) ? json : {};
  const data = isRow(root.data) ? root.data : isRow(root.courierData) ? root.courierData : root;

  const couriers = Object.entries(data)
    .filter(([key, row]) => key !== 'summary' && key !== 'reports' && isRow(row))
    .map(([key, row]) => {
      const r = row as Row;
      return {
        name:
          typeof r.name === 'string' && r.name
            ? r.name
            : key.charAt(0).toUpperCase() + key.slice(1),
        total: number(r, ...TOTAL),
        success: number(r, ...SUCCESS),
        cancelled: number(r, ...CANCELLED),
      };
    });

  const summary = isRow(data.summary) ? data.summary : null;
  const sum = (k: 'total' | 'success' | 'cancelled') => couriers.reduce((n, c) => n + c[k], 0);
  const total = summary ? number(summary, ...TOTAL) : sum('total');
  const success = summary ? number(summary, ...SUCCESS) : sum('success');
  const cancelled = summary ? number(summary, ...CANCELLED) : sum('cancelled');

  return {
    totalParcels: total,
    successParcels: success,
    cancelledParcels: cancelled,
    successRatio: total > 0 ? Math.round((success / total) * 100) : null,
    couriers: couriers.filter((c) => c.total > 0),
  };
}

/** "+88 017-1234 5678" → "01712345678" (glowy Phone::normalize). */
export const normalizePhone = (phone: string): string =>
  phone.replace(/[\s\-()]/g, '').replace(/^\+?88(?=01)/, '');
