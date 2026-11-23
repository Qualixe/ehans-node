'use client';

import type { AdminNavigation, AdminUser } from '@ehans/shared';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { signOut } from '@/lib/admin/actions';
import { money, timeAgo } from '@/lib/admin/format';
import { COMING_SOON, isActive, type MenuItem } from '@/lib/admin/menu';
import type { FlashMessage } from '@/lib/admin/flash';
import { Flash } from './feedback';
import { AdminIcon } from './icon';

const LOGO = '/assets/live/brand/ehans-mart-logo.webp';

/** Breadcrumb trail for the topbar (glowy passes it per view; here it follows the URL). */
function breadcrumbs(pathname: string): { label: string; href?: string }[] {
  const parts = pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean);
  if (!parts.length) return [{ label: 'Overview' }];
  const [section, second, third] = parts;
  switch (section) {
    case 'products':
      if (second === 'create')
        return [{ label: 'Products', href: '/admin/products' }, { label: 'Add product' }];
      if (third === 'edit')
        return [{ label: 'Products', href: '/admin/products' }, { label: 'Edit product' }];
      return [{ label: 'Products' }];
    case 'categories':
      if (second === 'create')
        return [{ label: 'Categories', href: '/admin/categories' }, { label: 'Add category' }];
      if (third === 'edit')
        return [{ label: 'Categories', href: '/admin/categories' }, { label: 'Edit category' }];
      return [{ label: 'Categories' }];
    case 'reviews':
      return [{ label: 'Reviews' }];
    case 'inventory':
      return [{ label: 'Inventory' }];
    case 'search':
      return [{ label: 'Search' }];
    case 'modules':
      return [{ label: COMING_SOON[second ?? ''] ?? 'Coming soon' }];
    default:
      return [{ label: section!.charAt(0).toUpperCase() + section!.slice(1) }];
  }
}

function setRootClass(name: string, on: boolean, storageKey: string, value: string) {
  document.documentElement.classList.toggle(name, on);
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    /* storage unavailable */
  }
}

function Sidebar({
  menu,
  mobileOpen,
  onClose,
}: {
  menu: MenuItem[];
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const fullPath = search ? `${pathname}?${search}` : pathname;
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(menu.map((item) => [item.label, isActive(item, pathname)])),
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        hidden={!mobileOpen}
        onClick={onClose}
      ></div>
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink-700 bg-ink-900 transition-[width,transform] duration-200 lg:translate-x-0 ${mobileOpen ? '' : '-translate-x-full'}`}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-ink-700 px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-md shadow-blue-600/25 ring-1 ring-ink-600">
              <img
                src="/assets/images/fav.png"
                alt=""
                width={36}
                height={36}
                className="size-7 object-contain"
              />
            </span>
            <span className="sidebar-label min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-wide text-fg uppercase">
                Ehans Mart
              </span>
              <span className="block font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                Admin v1.0
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="hidden size-8 shrink-0 place-items-center rounded-lg border border-ink-600 text-slate-400 transition hover:bg-ink-800 hover:text-fg lg:grid"
            aria-label="Collapse sidebar"
            onClick={() => {
              const collapsed = !document.documentElement.classList.contains('sidebar-collapsed');
              setRootClass(
                'sidebar-collapsed',
                collapsed,
                'admin.sidebar',
                collapsed ? 'collapsed' : 'expanded',
              );
            }}
          >
            <AdminIcon
              name="chevrons-left"
              className="sidebar-collapse-icon size-4 transition-transform"
            />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-fg lg:hidden"
            aria-label="Close menu"
            onClick={onClose}
          >
            <AdminIcon name="x" className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]" aria-label="Admin">
          <ul className="space-y-1">
            {menu.map((item) => {
              const active = isActive(item, pathname);
              const badge = item.badge ? (
                <span
                  className={`sidebar-badge rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${item.badgeClass}`}
                >
                  {item.badge}
                </span>
              ) : null;
              if (!item.children) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href!}
                      title={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${active ? 'bg-blue-600/10 text-fg ring-1 ring-blue-500/20' : 'text-slate-300 hover:bg-ink-800 hover:text-fg'}`}
                    >
                      <AdminIcon name={item.icon} className={`size-5 shrink-0 ${item.color}`} />
                      <span className="sidebar-label flex-1 truncate">{item.label}</span>
                      {badge}
                    </Link>
                  </li>
                );
              }
              const expanded = open[item.label] ?? false;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    title={item.label}
                    aria-expanded={expanded}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition ${active ? 'text-fg' : 'text-slate-300 hover:bg-ink-800 hover:text-fg'}`}
                    onClick={() => {
                      const root = document.documentElement;
                      if (
                        root.classList.contains('sidebar-collapsed') &&
                        window.innerWidth >= 1024
                      ) {
                        setRootClass('sidebar-collapsed', false, 'admin.sidebar', 'expanded');
                      }
                      setOpen((o) => ({ ...o, [item.label]: !expanded }));
                    }}
                  >
                    <AdminIcon name={item.icon} className={`size-5 shrink-0 ${item.color}`} />
                    <span className="sidebar-label flex-1 truncate">{item.label}</span>
                    {badge}
                    <AdminIcon
                      name="chevron-down"
                      className={`sidebar-chevron size-4 shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <ul
                    className="sidebar-submenu mt-1 ml-[1.35rem] space-y-0.5 border-l border-ink-600 pl-4"
                    hidden={!expanded}
                  >
                    {item.children.map((child) => {
                      const childActive = fullPath === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`block rounded-lg px-3 py-1.5 text-sm transition ${childActive ? 'bg-ink-800 font-medium text-fg' : 'text-slate-400 hover:bg-ink-800 hover:text-fg'}`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-ink-700 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-ink-800 hover:text-fg"
            title="View store"
          >
            <AdminIcon name="external" className="size-5 shrink-0" />
            <span className="sidebar-label">View storefront</span>
          </a>
        </div>
      </aside>
    </>
  );
}

function Dropdown({
  button,
  panelClass,
  children,
  label,
}: {
  button: (props: { 'aria-expanded': boolean; onClick: () => void }) => ReactNode;
  panelClass: string;
  children: ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div className="relative" ref={ref} aria-label={label}>
      {button({ 'aria-expanded': open, onClick: () => setOpen((o) => !o) })}
      <div className={panelClass} hidden={!open} onClick={() => setOpen(false)}>
        {children}
      </div>
    </div>
  );
}

function Topbar({
  user,
  navigation,
  onOpenMenu,
}: {
  user: AdminUser;
  navigation: AdminNavigation;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const searchQuery = useSearchParams().get('q') ?? '';
  const searchRef = useRef<HTMLInputElement>(null);
  const crumbs = breadcrumbs(pathname);
  const { counts, notifications } = navigation;
  const notificationCount =
    notifications.length + counts.pendingReviews + counts.pendingComments + counts.unreadMessages;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && searchRef.current) {
        e.preventDefault();
        searchRef.current.focus();
        searchRef.current.select();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-ink-700 bg-ink-950/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        className="grid size-9 place-items-center rounded-lg border border-ink-600 text-slate-300 lg:hidden"
        aria-label="Open menu"
        onClick={onOpenMenu}
      >
        <AdminIcon name="menu" className="size-5" />
      </button>

      <nav className="hidden min-w-0 items-center gap-2 text-sm md:flex" aria-label="Breadcrumb">
        <Link href="/admin" className="text-slate-400 hover:text-fg">
          Store
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.label} className="contents">
            <AdminIcon name="chevron-right" className="size-3.5 text-slate-600" />
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="truncate text-slate-400 hover:text-fg">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-semibold text-fg">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <form
          action="/admin/search"
          method="get"
          role="search"
          className="relative hidden sm:block"
        >
          <label htmlFor="admin-search" className="sr-only">
            Search catalog and orders
          </label>
          <AdminIcon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
          />
          <input
            ref={searchRef}
            id="admin-search"
            name="q"
            type="search"
            key={pathname === '/admin/search' ? searchQuery : 'search'}
            defaultValue={pathname === '/admin/search' ? searchQuery : ''}
            placeholder="Search catalog, orders..."
            autoComplete="off"
            className="h-10 w-56 rounded-xl border border-ink-600 bg-ink-850 pr-14 pl-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none xl:w-72"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-ink-500 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </form>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-ink-600 bg-ink-850 text-slate-300 transition hover:text-fg"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          onClick={() => {
            const dark = !document.documentElement.classList.contains('dark');
            setRootClass('dark', dark, 'admin.theme', dark ? 'dark' : 'light');
          }}
        >
          <AdminIcon name="moon" className="theme-icon-light size-[18px]" />
          <AdminIcon name="sun" className="theme-icon-dark size-[18px]" />
        </button>

        <Dropdown
          label="Notifications"
          panelClass="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-ink-600 bg-ink-850 shadow-2xl shadow-black/50"
          button={(props) => (
            <button
              type="button"
              className="relative grid size-10 place-items-center rounded-xl border border-ink-600 bg-ink-850 text-slate-300 transition hover:text-fg"
              aria-label={`Notifications (${notificationCount})`}
              {...props}
            >
              <AdminIcon name="bell" className="size-[18px]" />
              {notificationCount > 0 ? (
                <span className="absolute top-2 right-2 size-2 rounded-full bg-blue-500 ring-2 ring-ink-850"></span>
              ) : null}
            </button>
          )}
        >
          <div className="border-b border-ink-700 px-4 py-3 text-sm font-semibold text-fg">
            Notifications
          </div>
          <ul className="max-h-80 divide-y divide-ink-700 overflow-y-auto text-sm">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/admin/orders/${n.number}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-ink-800"
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                    <AdminIcon name="cart" className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-200">New order {n.number}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {n.customerName} · {money(n.total)} · {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {counts.pendingReviews ? (
              <li>
                <Link
                  href="/admin/reviews"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-800"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                    <AdminIcon name="star" className="size-4" />
                  </span>
                  <span className="text-slate-200">
                    {counts.pendingReviews} reviews awaiting approval
                  </span>
                </Link>
              </li>
            ) : null}
            {notificationCount === 0 ? (
              <li className="px-4 py-8 text-center text-slate-400">You&apos;re all caught up 🎉</li>
            ) : null}
          </ul>
        </Dropdown>

        <Dropdown
          label="Account menu"
          panelClass="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-600 bg-ink-850 py-1 shadow-2xl shadow-black/50"
          button={(props) => (
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white"
              aria-label="Account menu"
              {...props}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          )}
        >
          <div className="border-b border-ink-700 px-4 py-3">
            <p className="truncate text-sm font-semibold text-fg">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <Link
            href="/admin/modules/account"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-ink-800 hover:text-fg"
          >
            <AdminIcon name="settings" className="size-4" /> My account
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-ink-800 hover:text-fg"
            >
              <AdminIcon name="logout" className="size-4" /> Sign out
            </button>
          </form>
        </Dropdown>
      </div>
    </header>
  );
}

/** glowy components/admin/layout: sidebar + topbar + main. */
export function AdminShell({
  user,
  navigation,
  menu,
  readOnly = false,
  flash = null,
  children,
}: {
  user: AdminUser;
  navigation: AdminNavigation;
  menu: MenuItem[];
  readOnly?: boolean;
  flash?: FlashMessage | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  // close the mobile drawer after navigating
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', mobileOpen);
  }, [mobileOpen]);

  return (
    <div className="min-h-full">
      <Sidebar menu={menu} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="admin-main transition-[padding] duration-200 lg:pl-64">
        <Topbar user={user} navigation={navigation} onOpenMenu={() => setMobileOpen(true)} />
        <main
          className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          data-readonly={readOnly ? '' : undefined}
        >
          <Flash message={flash} />
          {children}
        </main>
      </div>
    </div>
  );
}

export { LOGO as ADMIN_LOGO };
