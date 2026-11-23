import {
  type AdminOrderFilters,
  type AdminOrdersPage,
  canManage,
  ORDER_CHANNEL_INFO,
  ORDER_CHANNELS,
  ORDER_DATE_RANGES,
  ORDER_PAGE_SIZES,
  ORDER_STATUSES,
  type OrderChannelName,
  type OrderDateRange,
  type OrderStatusName,
} from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmitSelect } from '@/components/admin/auto-submit-select';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { AdminIcon } from '@/components/admin/icon';
import { OrderStatusTabs } from '@/components/admin/order-status-tabs';
import { OrdersTable } from '@/components/admin/orders-table';
import { Pagination } from '@/components/admin/pagination';
import { PageHeader } from '@/components/admin/ui';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Orders' };

type Query = AdminOrderFilters & { perPage?: string };

const pick = <T extends string>(list: readonly T[], value: unknown): T | undefined =>
  typeof value === 'string' && (list as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
const date = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

/** Builds an /admin/orders link from the current filters plus changes (empty values dropped). */
const link = (query: Query, changes: Partial<Record<keyof Query, string | undefined>> = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...changes })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : '/admin/orders';
};

/** Tab icons (names from components/admin/icon). */
const STATUS_ICONS: Record<OrderStatusName | 'all', string> = {
  all: 'bars',
  pending: 'clock',
  confirmed: 'check',
  processing: 'settings',
  shipped: 'truck',
  delivered: 'box',
  cancelled: 'x',
  returned: 'refresh',
};

const tab = (active: boolean, activeClass = 'bg-ink-600 text-fg shadow') =>
  `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? activeClass : 'text-slate-400 hover:text-fg'}`;

/** glowy admin/orders/index: status, date, search and channel filters over the order list. */
export default async function OrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  const sp = await searchParams;
  const query: Query = {
    status: pick<OrderStatusName>(ORDER_STATUSES, sp.status),
    channel: pick<OrderChannelName>(ORDER_CHANNELS, sp.channel),
    q: typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) || undefined : undefined,
    range: pick<OrderDateRange>(Object.keys(ORDER_DATE_RANGES) as OrderDateRange[], sp.range),
    from: date(sp.from),
    to: date(sp.to),
    perPage: pick(ORDER_PAGE_SIZES.map(String), sp.perPage),
  };
  const page = Math.max(1, Number(sp.page) || 1);
  const api = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) api.set(key, value);
  if (page > 1) api.set('page', String(page));

  const [user, orders] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminOrdersPage>(`/orders?${api.toString()}`),
  ]);
  const manage = canManage(user, 'orders');
  const allCount = Object.values(orders.statusCounts).reduce((n, c) => n + c, 0);
  const activeRange = query.range ?? (query.from || query.to ? 'custom' : undefined);
  const noDates = { range: undefined, from: undefined, to: undefined };

  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <PageHeader
        title="Orders Management"
        description="Monitor status, check customers for fraud, process shipping and add quick notes."
      />

      <div className="admin-card overflow-visible">
        <OrderStatusTabs
          tabs={[undefined, ...ORDER_STATUSES].map((s) => ({
            key: s ?? 'all',
            label: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All orders',
            icon: STATUS_ICONS[s ?? 'all'],
            count: s ? orders.statusCounts[s] : allCount,
            href: link(query, { status: s }),
            active: query.status === s,
          }))}
        />
        <div className="flex flex-col gap-4 border-b border-ink-600 p-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <nav
                className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-ink-800 p-1 ring-1 ring-ink-600"
                aria-label="Order date"
              >
                {[undefined, ...(Object.keys(ORDER_DATE_RANGES) as OrderDateRange[])].map((r) => {
                  const active = activeRange === r;
                  return (
                    <Link
                      key={r ?? 'all'}
                      href={link(query, { ...noDates, range: r })}
                      className={tab(active, 'bg-blue-600 text-white shadow')}
                      aria-current={active ? 'true' : undefined}
                    >
                      {r ? ORDER_DATE_RANGES[r] : 'All time'}
                    </Link>
                  );
                })}
              </nav>
              {activeRange === 'custom' ? (
                <form method="get" className="flex flex-wrap items-center gap-2">
                  {(['status', 'channel', 'q', 'perPage'] as const).map((k) =>
                    query[k] ? <input key={k} type="hidden" name={k} value={query[k]} /> : null,
                  )}
                  <input type="hidden" name="range" value="custom" />
                  <label className="sr-only" htmlFor="f-from">
                    From
                  </label>
                  <input
                    id="f-from"
                    type="date"
                    name="from"
                    defaultValue={query.from}
                    className="admin-input h-9 w-auto py-1"
                  />
                  <span className="text-sm text-slate-500">to</span>
                  <label className="sr-only" htmlFor="f-to">
                    To
                  </label>
                  <input
                    id="f-to"
                    type="date"
                    name="to"
                    defaultValue={query.to}
                    className="admin-input h-9 w-auto py-1"
                  />
                  <button type="submit" className="admin-btn-primary h-9">
                    Apply
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <form method="get" className="flex flex-wrap items-center gap-2">
            {(['status', 'range', 'from', 'to', 'perPage'] as const).map((k) =>
              query[k] ? <input key={k} type="hidden" name={k} value={query[k]} /> : null,
            )}
            <div className="relative">
              <AdminIcon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
              />
              <input
                type="search"
                name="q"
                defaultValue={query.q}
                placeholder="Search order, name, phone…"
                aria-label="Search orders"
                className="admin-input w-64 pl-9"
              />
            </div>
            <details className="relative" open={Boolean(query.channel)}>
              <summary className="admin-btn-secondary h-[38px] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                Filters{' '}
                {query.channel ? (
                  <span className="rounded-full bg-blue-600 px-1.5 text-[10px] text-white">1</span>
                ) : null}
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-72 space-y-3 rounded-xl border border-ink-600 bg-ink-850 p-4 shadow-2xl">
                <div>
                  <label className="admin-label" htmlFor="f-channel">
                    Channel
                  </label>
                  <select
                    id="f-channel"
                    name="channel"
                    defaultValue={query.channel ?? ''}
                    className="admin-input"
                  >
                    <option value="">All channels</option>
                    {ORDER_CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {ORDER_CHANNEL_INFO[c].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between gap-2">
                  <Link href={link(query, { channel: undefined })} className="admin-btn-secondary">
                    Reset
                  </Link>
                  <button type="submit" className="admin-btn-primary">
                    Apply
                  </button>
                </div>
              </div>
            </details>
          </form>
        </div>

        <OrdersTable
          orders={orders.items}
          manage={manage}
          fraudChecks={orders.fraudChecks}
          fraudEnabled={orders.fraudEnabled}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-600 px-4 py-3 text-sm text-slate-400">
          <form method="get" className="flex items-center gap-2">
            {(['status', 'channel', 'q', 'range', 'from', 'to'] as const).map((k) =>
              query[k] ? <input key={k} type="hidden" name={k} value={query[k]} /> : null,
            )}
            <label htmlFor="per-page">Show</label>
            <AutoSubmitSelect
              id="per-page"
              name="perPage"
              defaultValue={String(orders.pageSize)}
              className="admin-input h-8 w-20 py-0"
            >
              {ORDER_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </AutoSubmitSelect>
            <span>
              per page · {orders.total} {orders.total === 1 ? 'order' : 'orders'}
            </span>
          </form>
        </div>
        <Pagination
          {...orders}
          basePath="/admin/orders"
          query={{ ...query, perPage: query.perPage }}
        />
      </div>
    </>
  );
}
