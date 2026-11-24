import type { AdminPage, OrderStatusName } from './admin.types.js';
import type { FraudCheckDto } from './admin-orders.types.js';

// ---------------------------------------------------------------- order panel (orders, incomplete, manual orders)

/** Where an order came from. */
export const ORDER_SOURCES = [
  'Website',
  'Landing page',
  'Facebook',
  'Google',
  'Instagram',
  'TikTok',
  'WhatsApp',
  'Phone call',
  'POS',
] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];
/** Sources a staff member types in by hand ("Manual · Call"). */
export const MANUAL_SOURCES: readonly OrderSource[] = ['Phone call', 'WhatsApp', 'POS'];

export const ORDER_PAYMENTS = [
  'Cash on delivery',
  'bKash advance + COD',
  'Nagad advance + COD',
  'Full paid (bKash)',
] as const;
export type OrderPayment = (typeof ORDER_PAYMENTS)[number];

/** Open orders with the same phone or IP inside this window are duplicates. */
export const DUPLICATE_WINDOW_HOURS = 72;

export const PANEL_DATE_RANGES = {
  all: 'All dates',
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '15d': 'Last 15 days',
  '30d': 'Last 30 days',
  custom: 'Custom range…',
} as const;
export type PanelDateRange = keyof typeof PANEL_DATE_RANGES;

export type PanelTab = OrderStatusName | 'all' | 'dup' | 'blocked';

export interface PanelFilters {
  tab?: PanelTab;
  date?: PanelDateRange;
  /** YYYY-MM-DD, with date=custom */
  from?: string;
  to?: string;
  /** staff id, 'none' (unassigned) or empty for all */
  assignee?: string;
  /** courier service id, 'none' (not sent) or empty for all */
  courier?: string;
  /** an OrderSource, 'manual', 'recovered' or empty for all */
  source?: string;
  /** order number, name, phone, address, district, IP, CN or product name */
  q?: string;
}

export interface PanelStaff {
  id: string;
  name: string;
}

export interface PanelOrderRow {
  id: string;
  number: string;
  status: OrderStatusName;
  createdAt: string;
  updatedAt: string;
  source: string;
  /** Typed in by staff (POS / phone / WhatsApp, or the "Manual order" form). */
  manual: boolean;
  /** Staff who created a manual order */
  createdBy: string | null;
  ipAddress: string | null;
  /** Recovered from an incomplete checkout */
  recovered: boolean;
  customerName: string;
  phone: string;
  altPhone: string | null;
  address: string;
  district: string;
  insideDhaka: boolean;
  customerNote: string | null;
  items: {
    productId: string | null;
    variantId: string | null;
    name: string;
    variantTitle: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
  }[];
  subtotal: number;
  delivery: number;
  discount: number;
  advance: number;
  total: number;
  /** Cash to collect = total - advance */
  due: number;
  payment: string;
  assignedTo: PanelStaff | null;
  /** Who moved it to its current step ("Confirmed by Rakib, 2 h ago"); null = not handled yet. */
  handledBy: { name: string; at: string; text: string } | null;
  courier: {
    service: string;
    name: string;
    consignmentId: string | null;
    trackingCode: string | null;
    status: string | null;
  } | null;
  notes: {
    count: number;
    last: { body: string; author: string; at: string } | null;
    authors: string[];
  };
  /** Other open orders with the same phone or IP within the duplicate window. */
  duplicates: string[];
  blocked: boolean;
}

export interface PanelKpis {
  todayOrders: number;
  todayValue: number;
  waiting: number;
  noAnswer: number;
  followUp: number;
  shipped: number;
  codToCollect: number;
  deliverySuccess: number;
  delivered: number;
  returned: number;
  salesValue: number;
  duplicates: number;
}

export interface PanelOrdersPage extends AdminPage<PanelOrderRow> {
  /** Counts per tab inside the chosen date range. */
  tabs: Record<PanelTab, number>;
  kpis: PanelKpis;
  /** Orders matching the filters and their sales value (not cancelled/returned/fake). */
  summary: { count: number; value: number };
  allOrders: number;
  staff: PanelStaff[];
  couriers: { id: string; name: string; ready: boolean }[];
  fraudChecks: Record<string, FraudCheckDto>;
  fraudEnabled: boolean;
}

/** The edit / new order form (also used by "Make order" from an incomplete checkout). */
export interface PanelOrderInput {
  customerName: string;
  phone: string;
  altPhone?: string | null;
  address: string;
  /** district key */
  district: string;
  status: OrderStatusName;
  assignedToId?: string | null;
  source: string;
  payment: string;
  items: { productId: string; variantId?: string | null; unitPrice: number; quantity: number }[];
  delivery: number;
  discount: number;
  advance: number;
  note?: string | null;
  /** Incomplete checkout this order recovers */
  recoveredFromId?: string | null;
}

export interface PanelOrderDetail extends PanelOrderRow {
  districtKey: string | null;
  events: { text: string; at: string }[];
  noteList: { body: string; author: string; at: string }[];
  previousOrders: {
    number: string;
    createdAt: string;
    status: OrderStatusName;
    total: number;
    items: string;
    courier: string | null;
  }[];
  /** Same IP used by these customer names (fraud report) */
  ipNames: string[];
}

export interface BlockedContactDto {
  id: string;
  kind: 'phone' | 'ip';
  value: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** What the order forms show under the phone field. */
export interface CustomerHint {
  blocked: { reason: string | null } | null;
  previous: number;
  openOrders: string[];
}

// ---------------------------------------------------------------- incomplete checkouts

export type IncompleteState = 'new' | 'called' | 'recovered';

export interface IncompleteItem {
  productId: string;
  variantId: string | null;
  name: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  image?: string | null;
}

/** Sent by the storefront while the shopper fills Buy now / checkout. */
export interface IncompleteCapture {
  sessionKey: string;
  phone: string;
  name?: string | null;
  address?: string | null;
  district?: string | null;
  items: { productId: string; variantId?: string | null; quantity: number }[];
  step: string;
}

export interface IncompleteRow {
  id: string;
  createdAt: string;
  phone: string;
  name: string | null;
  /** Name from an earlier order, when they didn't type one */
  pastName: string | null;
  pastOrders: number;
  address: string | null;
  district: string | null;
  items: IncompleteItem[];
  value: number;
  step: string;
  state: IncompleteState;
  handledBy: { name: string; at: string } | null;
  orderNumber: string | null;
}

export interface IncompletePage {
  items: IncompleteRow[];
  counts: Record<IncompleteState | 'all', number>;
  kpis: {
    total: number;
    cartValue: number;
    notContacted: number;
    recovered: number;
    recoveredValue: number;
    atStake: number;
  };
}

// ---------------------------------------------------------------- manual orders (POS)

export interface ManualSummaryTile {
  range: 'today' | 'yesterday' | '7d' | '15d' | '30d';
  label: string;
  orders: number;
  value: number;
}
