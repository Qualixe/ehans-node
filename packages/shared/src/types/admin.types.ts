/**
 * Admin (back office) contracts shared by the API and the /admin frontend.
 * Ported from glowy: App\Enums\Permission, User::accessLevel(), DashboardMetrics.
 */

/** Sections of the admin a staff member can be given access to (the owner always has all). */
export const ADMIN_SECTIONS = [
  'analytics',
  'orders',
  'pos',
  'products',
  'inventory',
  'customers',
  'content',
  'marketing',
  'shipping',
  'settings',
  'accounts',
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export const ADMIN_SECTION_INFO: Record<AdminSection, { label: string; description: string }> = {
  analytics: {
    label: 'Dashboard & reports',
    description: 'Sales figures, revenue charts and the sales report.',
  },
  orders: {
    label: 'Orders',
    description: 'View, update, print and export orders, and add order notes.',
  },
  pos: { label: 'Point of sale', description: 'Ring up in-store and phone orders.' },
  products: { label: 'Products', description: 'Add and edit products, categories and reviews.' },
  inventory: { label: 'Inventory', description: 'Update stock levels.' },
  customers: {
    label: 'Customers',
    description: 'See customer details and reset customer passwords.',
  },
  content: {
    label: 'Content',
    description: 'Home banners, blog posts, pages, FAQs, comments and messages.',
  },
  marketing: { label: 'Marketing', description: 'Create and edit coupons.' },
  shipping: { label: 'Shipping & delivery', description: 'Shipments, couriers and delivery fees.' },
  settings: {
    label: 'Store settings',
    description: 'Store details, store status and payment settings.',
  },
  accounts: {
    label: 'Accounts & finance',
    description: 'Money accounts, income, expenses and profit reports.',
  },
};

/** "manage" = full access, "view" = read only. A missing section means no access. */
export type AccessLevel = 'view' | 'manage';
export type AdminPermissions = Partial<Record<AdminSection, AccessLevel>>;

export type AdminRole = 'owner' | 'staff';

/** The signed-in admin as returned by GET /admin/auth/me. */
export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  role: AdminRole;
  /** Effective permissions (every section is "manage" for the owner). */
  permissions: AdminPermissions;
}

export interface AdminLoginResponse {
  /** Opaque session token; the frontend keeps it in an httpOnly cookie. */
  token: string;
  expiresAt: string;
  user: AdminUser;
}

export function accessLevel(user: Pick<AdminUser, 'permissions'>, section: AdminSection) {
  return user.permissions[section] ?? null;
}

export function canView(user: Pick<AdminUser, 'permissions'>, section: AdminSection): boolean {
  return accessLevel(user, section) !== null;
}

export function canManage(user: Pick<AdminUser, 'permissions'>, section: AdminSection): boolean {
  return accessLevel(user, section) === 'manage';
}

// ---------------------------------------------------------------- orders (names shared with the UI)

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;
export type OrderStatusName = (typeof ORDER_STATUSES)[number];

export const ORDER_CHANNELS = ['organic', 'social', 'direct', 'referral', 'pos'] as const;
export type OrderChannelName = (typeof ORDER_CHANNELS)[number];

export const ORDER_CHANNEL_INFO: Record<OrderChannelName, { label: string; color: string }> = {
  organic: { label: 'Organic', color: '#3b82f6' },
  social: { label: 'Social', color: '#10b981' },
  direct: { label: 'Direct', color: '#f59e0b' },
  referral: { label: 'Referral', color: '#6366f1' },
  pos: { label: 'In-store (POS)', color: '#ec4899' },
};

// ---------------------------------------------------------------- dashboard

export const DASHBOARD_RANGES = { '7d': 'Last 7 days', '30d': 'Last 30 days', '1y': 'Last 12 months' } as const;
export type DashboardRange = keyof typeof DASHBOARD_RANGES;

export interface MetricChange {
  value: number;
  /** Percent change vs. the previous period; null when there is nothing to compare. */
  change: number | null;
}

export interface DashboardMetrics {
  range: DashboardRange;
  storeStatus: 'live' | 'paused';
  revenue: MetricChange & { previous: number };
  orders: MetricChange & { fulfilled: number };
  customers: MetricChange & { newThisMonth: number };
  aov: MetricChange & { target: number };
  chart: { labels: string[]; gross: number[]; net: number[] };
  channels: { channel: OrderChannelName; label: string; color: string; count: number; percent: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    number: string;
    customerName: string;
    status: OrderStatusName;
    channel: OrderChannelName;
    total: number;
    itemCount: number;
    createdAt: string;
  }[];
  lowStock: { id: string; slug: string; name: string; stock: number; image: string | null }[];
}

/** Sidebar badges and the topbar notification feed (only what the admin may see). */
export interface AdminNavigation {
  counts: {
    pendingOrders: number;
    lowStock: number;
    pendingReviews: number;
    pendingComments: number;
    unreadMessages: number;
  };
  notifications: { id: string; number: string; customerName: string; total: number; createdAt: string }[];
}
