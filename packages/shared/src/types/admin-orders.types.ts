import type { AdminPage, OrderChannelName, OrderStatusName } from './admin.types.js';

/** glowy Order::DATE_RANGES (the orders list's quick date filter). */
export const ORDER_DATE_RANGES = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7days': 'Last 7 days',
  month: 'This month',
  custom: 'Custom',
} as const;
export type OrderDateRange = keyof typeof ORDER_DATE_RANGES;

export const ORDER_PAGE_SIZES = [20, 50, 100] as const;

/** Statuses whose stock went back to inventory (glowy OrderStatus::releasesStock). */
export const STOCK_RELEASING_STATUSES: readonly OrderStatusName[] = ['cancelled', 'returned'];

export interface AdminOrderFilters {
  status?: OrderStatusName;
  channel?: OrderChannelName;
  q?: string;
  range?: OrderDateRange;
  /** YYYY-MM-DD, with range=custom */
  from?: string;
  to?: string;
}

/** One row of the admin orders list (glowy admin/orders/index). */
export interface AdminOrderRow {
  id: string;
  number: string;
  status: OrderStatusName;
  channel: OrderChannelName;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  ipAddress: string | null;
  courier: string | null;
  trackingNumber: string | null;
  paymentMethod: string;
  paymentStatus: string | null;
  note: string | null;
  adminNote: string | null;
  total: number;
  quantity: number;
  /** Street address (city is separate). */
  address: string;
  items: {
    name: string;
    variantTitle: string | null;
    quantity: number;
    lineTotal: number;
    /** The product's main image (null when deleted or imageless). */
    image: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrdersPage extends AdminPage<AdminOrderRow> {
  /** Saved fraud checks for the phones on this page (key: 01XXXXXXXXX). */
  fraudChecks: Record<string, FraudCheckDto>;
  /** A BD Courier API key is configured. */
  fraudEnabled: boolean;
  /** Orders per status, across every filter but the status itself (the tab counts). */
  statusCounts: Record<OrderStatusName, number>;
}

/** The admin order page (glowy admin/orders/show). */
export interface AdminOrderDetail extends Omit<AdminOrderRow, 'items' | 'quantity'> {
  shippingZone: string;
  paymentReference: string | null;
  paymentAccount: string | null;
  couponCode: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  items: {
    id: string;
    productId: string | null;
    name: string;
    variantTitle: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  fraudCheck: FraudCheckDto | null;
  fraudEnabled: boolean;
  /** Orders from the same phone number (this one included). */
  customerOrderCount: number;
  /** Orders from the same IP address (this one included). */
  sameIpOrderCount: number;
}

/** The fulfilment form on the order page (glowy UpdateOrderRequest). */
export interface AdminOrderUpdate {
  status: OrderStatusName;
  courier: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
}

export interface AdminBulkStatusResult {
  updated: number;
  /** Order numbers that could not be reopened (not enough stock). */
  skipped: string[];
}

/** Couriers offered on the fulfilment form (glowy config('shop.couriers')). */
export const ORDER_COURIERS = [
  'Pathao',
  'Steadfast',
  'RedX',
  'Sundarban',
  'eCourier',
  'Own delivery',
];

// ---------------------------------------------------------------- fraud check (BD Courier)

export interface FraudCourierRow {
  name: string;
  total: number;
  success: number;
  cancelled: number;
}

/** A phone's courier delivery history (glowy FraudCheck). */
export interface FraudCheckDto {
  phone: string;
  totalParcels: number;
  successParcels: number;
  cancelledParcels: number;
  /** 0-100, null when the number has no parcels */
  successRatio: number | null;
  couriers: FraudCourierRow[];
  checkedAt: string;
}

export type FraudRisk = 'new' | 'safe' | 'watch' | 'risky';

/** glowy FraudCheck::risk(): no history = new; 80%+ safe; 50%+ watch; below that risky. */
export function fraudRisk(check: Pick<FraudCheckDto, 'totalParcels' | 'successRatio'>): FraudRisk {
  if (check.totalParcels === 0 || check.successRatio === null) return 'new';
  if (check.successRatio >= 80) return 'safe';
  if (check.successRatio >= 50) return 'watch';
  return 'risky';
}
