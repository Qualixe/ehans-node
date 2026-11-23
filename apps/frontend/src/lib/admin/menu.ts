import {
  type AdminNavigation,
  type AdminSection,
  type AdminUser,
  canManage,
  canView,
} from '@ehans/shared';

/**
 * The admin sidebar, ported from glowy's AdminNavigationComposer. Entries whose module is not
 * ported yet open /admin/modules/<slug> ("coming soon") instead of a screen that doesn't exist.
 */
export interface MenuChild {
  label: string;
  href: string;
  can?: string;
}

export interface MenuItem {
  label: string;
  icon: string;
  color: string;
  can?: string;
  href?: string;
  /** Path prefixes that mark the item active ("/admin" itself matches exactly). */
  active: string[];
  badge?: string | null;
  badgeClass?: string;
  children?: MenuChild[];
}

/** Modules on the menu that are not ported yet (slug → name). */
export const COMING_SOON: Record<string, string> = {
  pos: 'POS',
  accounts: 'Accounts',
  customers: 'Customers',
  reports: 'Reports',
  'landing-pages': 'Landing Pages',
  content: 'Content',
  shipping: 'Shipping & Delivery',
  'fraud-security': 'Fraud & Security',
  'auto-dialer': 'Auto Dialer',
  marketing: 'Marketing',
  'modules-tools': 'Modules & Tools',
  settings: 'Settings',
  staff: 'Staff & permissions',
  account: 'My account',
};

export const soon = (slug: string) => `/admin/modules/${slug}`;

const children = (slug: string, labels: string[]): MenuChild[] =>
  labels.map((label, i) => ({
    label,
    href:
      i === 0
        ? soon(slug)
        : `${soon(slug)}?view=${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  }));

export function buildMenu(counts: AdminNavigation['counts']): MenuItem[] {
  const content = counts.unreadMessages + counts.pendingComments;
  return [
    {
      label: 'Dashboard',
      can: 'analytics',
      icon: 'grid',
      color: 'text-blue-400',
      href: '/admin',
      active: ['/admin'],
    },
    {
      label: 'Orders',
      can: 'orders',
      icon: 'cart',
      color: 'text-emerald-400',
      active: ['/admin/orders', '/admin/invoice'],
      badge: counts.pendingOrders ? String(counts.pendingOrders) : null,
      badgeClass: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
      children: [
        { label: 'All orders', href: '/admin/orders' },
        ...['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((label) => ({
          label,
          href: `/admin/orders?status=${label.toLowerCase()}`,
        })),
      ],
    },
    {
      label: 'POS',
      can: 'pos',
      icon: 'monitor',
      color: 'text-fuchsia-400',
      href: soon('pos'),
      active: [soon('pos')],
    },
    {
      label: 'Accounts',
      can: 'accounts',
      icon: 'wallet',
      color: 'text-emerald-400',
      active: [soon('accounts')],
      children: [
        ...children('accounts', ['Overview', 'Transactions']),
        {
          label: 'Add expense',
          can: 'accounts.manage',
          href: `${soon('accounts')}?view=add-expense`,
        },
        { label: 'Profit & loss', href: `${soon('accounts')}?view=profit-loss` },
      ],
    },
    {
      label: 'Products',
      can: 'products',
      icon: 'box',
      color: 'text-sky-400',
      active: ['/admin/products', '/admin/categories', '/admin/reviews'],
      badge: counts.lowStock ? `${counts.lowStock} Alert` : null,
      badgeClass: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
      children: [
        { label: 'All products', href: '/admin/products' },
        { label: 'Add product', href: '/admin/products/create' },
        { label: 'Categories', href: '/admin/categories' },
        {
          label: `Reviews${counts.pendingReviews ? ` (${counts.pendingReviews})` : ''}`,
          href: '/admin/reviews',
        },
      ],
    },
    {
      label: 'Customers',
      can: 'customers',
      icon: 'users',
      color: 'text-cyan-400',
      active: [soon('customers')],
      children: children('customers', ['All customers', 'Top spenders']),
    },
    {
      label: 'Inventory',
      can: 'inventory',
      icon: 'warehouse',
      color: 'text-orange-400',
      active: ['/admin/inventory'],
      children: [
        { label: 'Stock levels', href: '/admin/inventory' },
        { label: 'Low stock', href: '/admin/inventory?stock=low' },
        { label: 'Out of stock', href: '/admin/inventory?stock=out' },
      ],
    },
    {
      label: 'Reports',
      icon: 'chart',
      color: 'text-indigo-400',
      active: [soon('reports')],
      children: [
        { label: 'Sales report', can: 'analytics', href: soon('reports') },
        { label: 'Export orders (CSV)', can: 'orders', href: `${soon('reports')}?view=export` },
      ],
    },
    {
      label: 'Landing Pages',
      can: 'marketing',
      icon: 'home',
      color: 'text-yellow-400',
      active: [soon('landing-pages')],
      children: [
        { label: 'All landing pages', href: soon('landing-pages') },
        {
          label: 'Create landing page',
          can: 'marketing.manage',
          href: `${soon('landing-pages')}?view=create`,
        },
      ],
    },
    {
      label: 'Content',
      can: 'content',
      icon: 'edit',
      color: 'text-rose-400',
      active: [soon('content')],
      badge: content ? String(content) : null,
      badgeClass: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
      children: children('content', [
        'Home banners',
        'Featured collections',
        'Footer',
        'Blog posts',
        'Pages',
        'FAQs',
        'Comments',
        'Messages',
      ]),
    },
    {
      label: 'Shipping & Delivery',
      can: 'shipping',
      icon: 'truck',
      color: 'text-teal-400',
      active: [soon('shipping')],
      children: children('shipping', ['Shipments', 'Delivery zones & fees', 'Courier integration']),
    },
    {
      label: 'Fraud & Security',
      can: 'orders',
      icon: 'shield',
      color: 'text-red-400',
      href: soon('fraud-security'),
      active: [soon('fraud-security')],
    },
    {
      label: 'Auto Dialer',
      can: 'manage-staff',
      icon: 'phone',
      color: 'text-amber-400',
      href: soon('auto-dialer'),
      active: [soon('auto-dialer')],
    },
    {
      label: 'Marketing',
      can: 'marketing',
      icon: 'megaphone',
      color: 'text-pink-400',
      active: [soon('marketing')],
      children: children('marketing', [
        'Coupons',
        'Create coupon',
        'Pixels & tracking',
        'Delayed purchase events',
      ]),
    },
    {
      label: 'Modules & Tools',
      can: 'manage-staff',
      icon: 'puzzle',
      color: 'text-purple-400',
      href: soon('modules-tools'),
      active: [soon('modules-tools')],
    },
    {
      label: 'Settings',
      icon: 'settings',
      color: 'text-slate-300',
      active: [soon('settings'), soon('staff'), soon('account')],
      children: [
        { label: 'Store settings', can: 'settings', href: soon('settings') },
        { label: 'Branding', can: 'settings', href: `${soon('settings')}?view=branding` },
        { label: 'Staff & permissions', can: 'manage-staff', href: soon('staff') },
        { label: 'My account', href: soon('account') },
      ],
    },
  ];
}

/** glowy Gate abilities: "<section>", "<section>.manage", "manage-staff" (owner only). */
export function can(user: AdminUser, ability: string): boolean {
  if (user.role === 'owner') return true;
  if (ability === 'manage-staff') return false;
  const [section, level] = ability.split('.') as [AdminSection, string | undefined];
  return level === 'manage' ? canManage(user, section) : canView(user, section);
}

/** Drops entries (and sub-links) the admin may not open; empty groups disappear. */
export function visibleMenu(menu: MenuItem[], user: AdminUser): MenuItem[] {
  return menu.flatMap((item) => {
    if (item.can && !can(user, item.can)) return [];
    if (!item.children) return [item];
    const kids = item.children.filter((c) => !c.can || can(user, c.can));
    return kids.length ? [{ ...item, children: kids }] : [];
  });
}

/** Whether a menu item is active for the current path. */
export function isActive(item: Pick<MenuItem, 'active'>, pathname: string): boolean {
  return item.active.some((prefix) =>
    prefix === '/admin'
      ? pathname === '/admin'
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Where an admin lands after signing in (glowy User::adminHomeRoute). */
export function adminHomePath(user: AdminUser): string {
  if (canView(user, 'analytics')) return '/admin';
  const sections: [AdminSection, string][] = [
    ['orders', '/admin/orders'],
    ['pos', soon('pos')],
    ['products', '/admin/products'],
    ['inventory', '/admin/inventory'],
    ['customers', soon('customers')],
    ['content', soon('content')],
    ['marketing', soon('marketing')],
    ['shipping', soon('shipping')],
    ['settings', soon('settings')],
  ];
  return sections.find(([section]) => canView(user, section))?.[1] ?? '/admin';
}
