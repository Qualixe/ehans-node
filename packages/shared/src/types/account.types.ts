import type { OrderStatusName } from './admin.types.js';

/** A storefront customer (glowy's "customer" guard). Signs in with mobile number + password. */
export interface CustomerProfile {
  id: string;
  name: string;
  /** 01XXXXXXXXX */
  phone: string;
  email: string | null;
  /** Default delivery address and district key, filled into checkout. */
  address: string | null;
  district: string | null;
  createdAt: string;
}

export interface CustomerSession {
  token: string;
  expiresAt: string;
  customer: CustomerProfile;
}

export interface CustomerLoginRequest {
  phone: string;
  password: string;
  remember?: boolean;
}

export interface CustomerRegisterRequest {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
}

export interface CustomerProfileUpdate {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  district?: string | null;
}

export interface CustomerPasswordUpdate {
  currentPassword: string;
  password: string;
}

/** Minimum password length (glowy Password::defaults()). */
export const CUSTOMER_PASSWORD_MIN = 8;

/** One row of "My orders" (glowy account/index). */
export interface CustomerOrderRow {
  number: string;
  createdAt: string;
  status: OrderStatusName;
  total: number;
  itemCount: number;
  /** Up to three product images */
  images: string[];
}

/** The admin customer page's "Customer account" card. */
export interface AdminCustomerAccount {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
}
