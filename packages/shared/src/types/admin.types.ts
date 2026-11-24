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

/** The order panel's statuses, in tab order. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'no_answer',
  'follow_up',
  'ready',
  'shipped',
  'delivered',
  'partial',
  'returned',
  'fake',
  'cancelled',
] as const;
export type OrderStatusName = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusName, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  no_answer: 'Call not received',
  follow_up: 'Follow up',
  ready: 'Ready for delivery',
  shipped: 'Shipped',
  delivered: 'Delivered',
  partial: 'Partial delivery',
  returned: 'Return',
  fake: 'Fake order',
  cancelled: 'Cancelled',
};

/** Still being worked on (duplicates are looked for among these). */
export const OPEN_STATUSES: readonly OrderStatusName[] = [
  'pending',
  'confirmed',
  'no_answer',
  'follow_up',
  'ready',
];
/** Waiting for the customer to confirm on the phone (the "Confirm" button shows). */
export const TO_CONFIRM_STATUSES: readonly OrderStatusName[] = [
  'pending',
  'no_answer',
  'follow_up',
];
/** Not a sale: left out of sales value and revenue, and their stock goes back. */
export const NOT_SALE_STATUSES: readonly OrderStatusName[] = ['cancelled', 'returned', 'fake'];

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

export const DASHBOARD_RANGES = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '1y': 'Last 12 months',
} as const;
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
  channels: {
    channel: OrderChannelName;
    label: string;
    color: string;
    count: number;
    percent: number;
  }[];
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
  notifications: {
    id: string;
    number: string;
    customerName: string;
    total: number;
    createdAt: string;
  }[];
}

// ---------------------------------------------------------------- catalog admin

export interface AdminCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  position: number;
  showInMenu: boolean;
  homePosition: number | null;
  homeTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  /** Products in this collection (memberships). */
  productCount: number;
}

/** Top-level departments with their sub-categories (admin Categories list). */
export type AdminCategoryTree = (AdminCategory & { children: AdminCategory[] })[];

/** One page of an admin list (Laravel's paginate()). */
export interface AdminPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ReviewStatusFilter = 'pending' | 'approved' | 'all';

export interface AdminReview {
  id: string;
  product: { id: string; name: string; slug: string };
  name: string;
  email: string | null;
  rating: number;
  body: string;
  isApproved: boolean;
  createdAt: string;
}

export type StockFilter = 'low' | 'out';

/** One stock line: a product variant, or a product without variants. */
export interface InventoryRow {
  kind: 'variant' | 'product';
  id: string;
  productId: string;
  productName: string;
  categoryName: string | null;
  /** Variant title (null for a product without variants). */
  variantTitle: string | null;
  sku: string | null;
  stock: number;
  price: number;
  image: string | null;
}

export interface InventoryPage extends AdminPage<InventoryRow> {
  threshold: number;
  summary: { units: number; value: number; low: number; out: number };
}

export interface StockAdjustment {
  mode: 'set' | 'add';
  quantity: number;
}

export type ProductStatusFilter = 'active' | 'draft';

/** A row of the admin Products list. */
export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  categoryName: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  variantCount: number;
  soldCount: number;
  isActive: boolean;
  isFeatured: boolean;
  image: string | null;
}

/** Topbar search results (glowy SearchController): only sections the admin may open. */
export interface AdminSearchResults {
  term: string;
  products: AdminProductRow[];
  orders: {
    id: string;
    number: string;
    customerName: string;
    phone: string;
    status: OrderStatusName;
    total: number;
    createdAt: string;
  }[];
}

/** One variant in the product form ("Default Title" holds a simple product's details). */
export interface AdminVariantInput {
  id?: string | null;
  /** Option values in option order ([] for a product without options). */
  options: string[];
  price: number;
  compareAtPrice: number | null;
  costPerItem: number | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  weightGrams: number | null;
  /** One of the product's existing images. */
  imageId: string | null;
}

export interface AdminProductOption {
  name: string;
  values: string[];
}

/** Everything the product form edits (sent as JSON next to the uploaded images). */
export interface AdminProductInput {
  name: string;
  slug: string | null;
  sku: string | null;
  categoryId: string;
  /** Extra collections the product is listed in (the category is always one). */
  collectionIds: string[];
  brand: string | null;
  productType: string | null;
  tags: string[];
  shortDescription: string | null;
  /** Rich text; sanitized by the API. */
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  /** Show the product page "Bundle & Save" tiers (and apply their discounts). */
  bundlesEnabled: boolean;
  /** Show the variant dropdown (off: the default variant is sold, no choice). */
  variantPickerEnabled: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  /** Existing image ids in display order (the first is the main image). */
  imageOrder: string[];
  removeImages: string[];
  options: AdminProductOption[];
  variants: AdminVariantInput[];
  /** Product page "Buy it with" checkboxes, in order. */
  buyWithIds: string[];
  /** Product page "Complete your …" list, in order. */
  upsellIds: string[];
  buyWithTitle: string | null;
  upsellTitle: string | null;
}

/** A product picked as a cross-sell (shown in the product form). */
export interface AdminCrossSellItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  isActive: boolean;
}

export interface AdminProductDetail extends Omit<
  AdminProductInput,
  'imageOrder' | 'removeImages' | 'variants' | 'buyWithIds' | 'upsellIds'
> {
  buyWith: AdminCrossSellItem[];
  upsells: AdminCrossSellItem[];
  id: string;
  slug: string;
  sku: string;
  soldCount: number;
  stock: number;
  images: { id: string; path: string }[];
  variants: (AdminVariantInput & { id: string })[];
  /** The product's Bundle & Save tiers (shown in the admin; edited later). */
  bundleTiers: { quantity: number; discountPercent: number; freeDelivery: boolean }[];
}

export interface AdminProductSuggestions {
  brands: string[];
  types: string[];
  tags: string[];
  /** Suggested product code for a new product. */
  nextSku: string;
}
