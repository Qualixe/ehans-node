import type { OrderStatusName } from './admin.types.js';
import type { PanelKpis } from './order-panel.types.js';

/**
 * Dashboard and Reports (from the order-panel demo). Money is integer taka.
 *
 * Profit per order ("realised"): delivered = order total − product cost − courier charge − 1% COD fee;
 * partly delivered = the collected share; returned = advance − courier charge × 1.5 (delivery + return);
 * other statuses have no profit yet. The courier charge is the one the courier booked, else the
 * delivery fee the customer was charged. Product cost is the variant's "cost per item".
 */

/** One day of the profit statement (Dhaka calendar day, "2026-11-24"). */
export interface ProfitDay {
  day: string;
  delivered: number;
  returned: number;
  /** delivered sales incl. delivery charge, plus advances kept on returns */
  revenue: number;
  productCost: number;
  courier: number;
  returnLoss: number;
  /** null until Accounts (expenses, ad spend) is built: shown as "not tracked", never invented */
  ads: null;
  expenses: null;
  profit: number;
}

export interface DashboardAlert {
  kind: 'dup' | 'blocked' | 'stock';
  text: string;
  /** order to open (dup / blocked) */
  number?: string;
}

export interface DashboardOverview {
  kpis: PanelKpis;
  finance: {
    profit7: number;
    revenue7: number;
    /** money with couriers: COD on parcels in transit + delivered COD not paid out yet (after fees) */
    withCouriers: number;
    readyForPayout: number;
    /** pending orders whose number was never fraud-checked */
    unchecked: number;
  };
  /** last 7 days, oldest first: orders placed that day and how many of them are delivered */
  days: { day: string; orders: number; delivered: number }[];
  attention: DashboardAlert[];
  /** last 30 days */
  statuses: { status: OrderStatusName; count: number }[];
  team: {
    id: string | null;
    name: string;
    handled: number;
    confirmed: number;
    cancelled: number;
  }[];
  bestSellers: { productId: string; name: string; image: string | null; quantity: number }[];
  /** sold lines (last 30 days) whose product has no cost set: profit counts them at ৳0 cost */
  missingCost: number;
}

export const REPORT_TABS = {
  daily: 'Daily P&L',
  products: 'Products',
  district: 'Districts',
  source: 'Order sources',
  courier: 'Couriers',
  team: 'Teams',
  status: 'Status',
} as const;
export type ReportTab = keyof typeof REPORT_TABS;

export const REPORT_PERIODS = [7, 30, 90, 365] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export type ReportColumnKind = 'text' | 'int' | 'money' | 'pct';
export interface ReportColumn {
  label: string;
  kind: ReportColumnKind;
}

export interface ReportPage {
  tab: ReportTab;
  days: ReportPeriod;
  summary: { sales: number; delivered: number; profit: number; returned: number };
  head: ReportColumn[];
  /** values match `head` kinds: text = string, the rest = numbers (pct = whole percent, null = —) */
  rows: (string | number | null)[][];
  note: string | null;
  missingCost: number;
}
