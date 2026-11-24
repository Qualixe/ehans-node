import type { OrderStatusName } from './admin.types.js';
import type { FraudCheckDto } from './admin-orders.types.js';

// ---------------------------------------------------------------- Fraud & security

/** Order protection rules (Fraud & security). 0 turns a number rule off. */
export interface SecuritySettings {
  /** New orders whose courier success is below this % go to "Follow up" (0 = off). */
  autoHoldBelow: number;
  /** Most orders one phone number may place per day at checkout (0 = no limit). */
  maxPerDay: number;
  /** Open orders with the same phone or IP within this many hours are duplicates. */
  dupWindowHours: number;
  /** Run the BD Courier check as soon as an order arrives. */
  autoCheck: boolean;
}

export const DEFAULT_SECURITY: SecuritySettings = {
  autoHoldBelow: 0,
  maxPerDay: 0,
  dupWindowHours: 72,
  autoCheck: true,
};

export interface LoginEventDto {
  email: string;
  name: string | null;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface SecurityOverview {
  settings: SecuritySettings;
  blockedPhones: number;
  blockedIps: number;
  /** Open orders waiting to confirm whose saved courier success is below the hold rule */
  riskyOpen: number;
  failedLogins48h: number;
  logins: LoginEventDto[];
}

// ---------------------------------------------------------------- Fraud checker

export interface FraudLookup {
  phone: string;
  /** Name from their latest order */
  name: string | null;
  blocked: boolean;
  check: FraudCheckDto | null;
  enabled: boolean;
  orders: { number: string; createdAt: string; total: number; status: OrderStatusName }[];
}

export interface FraudCheckerPage {
  recent: string[];
  waiting: { number: string; customerName: string; phone: string; check: FraudCheckDto | null }[];
  enabled: boolean;
}

// ---------------------------------------------------------------- Courier & COD

export interface ShipmentsPage {
  couriers: {
    id: string;
    name: string;
    inTransit: number;
    /** Cash the courier will collect on parcels still in transit */
    inTransitCod: number;
    delivered: number;
    returned: number;
  }[];
  /** Delivered parcels whose COD the courier hasn't paid us yet */
  payouts: { courier: string; name: string; parcels: number; cod: number; fees: number; net: number }[];
  rows: {
    number: string;
    customerName: string;
    phone: string;
    district: string;
    courier: string;
    courierName: string;
    consignmentId: string | null;
    trackingCode: string | null;
    trackingUrl: string | null;
    courierStatus: string | null;
    sentAt: string | null;
    cod: number;
    status: OrderStatusName;
    settled: boolean;
  }[];
}

// ---------------------------------------------------------------- Team activity

export type ActivityType = 'order' | 'status' | 'courier' | 'note' | 'edit' | 'assign' | 'block';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** Acted in the last 15 minutes */
  online: boolean;
  lastActive: string | null;
  confirmed: number;
  ready: number;
  cancelled: number;
  fake: number;
  blocked: number;
  /** Orders assigned to them */
  handled: number;
  /** Average minutes from order to their confirmation */
  avgConfirmMinutes: number | null;
}

export interface TeamPage {
  people: TeamMember[];
  events: {
    at: string;
    who: string;
    type: ActivityType;
    text: string;
    orderNumber: string | null;
    customerName: string | null;
  }[];
  /** Staff actions per hour today (Dhaka), 24 values */
  hours: number[];
}
