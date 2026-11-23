import {
  DASHBOARD_RANGES,
  type DashboardMetrics,
  type DashboardRange,
  canView,
} from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminIcon } from '@/components/admin/icon';
import { LineChart } from '@/components/admin/line-chart';
import { Donut, StatCard, StatusBadge } from '@/components/admin/ui';
import { money, number, plural, timeAgo } from '@/lib/admin/format';
import { adminHomePath } from '@/lib/admin/menu';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Overview' };

const isRange = (value: unknown): value is DashboardRange =>
  typeof value === 'string' && value in DASHBOARD_RANGES;

/** glowy admin/dashboard ("Executive Overview"). */
export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  const user = await getCurrentAdmin();
  // staff without sales figures land on the first section they can use (glowy DashboardController)
  if (!canView(user, 'analytics')) {
    const home = adminHomePath(user);
    if (home !== '/admin') redirect(home);
    return <NoAccess name={user.name} />;
  }

  const requested = (await searchParams).range;
  const range: DashboardRange = isRange(requested) ? requested : '1y';
  const m = await adminApi<DashboardMetrics>(`/dashboard?range=${range}`);
  const live = m.storeStatus === 'live';
  const rangeLabel = DASHBOARD_RANGES[m.range];
  const channelTotal = m.channels.reduce((n, c) => n + c.count, 0);
  const topRevenue = m.topProducts[0]?.revenue ?? 0;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-fg">Executive Overview</h1>
          <p className="mt-1 text-sm text-slate-400">
            Store analytics and performance metrics for Ehans Mart · {rangeLabel}.
          </p>
        </div>
        <Link
          href="/admin/modules/settings"
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ${live ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'}`}
        >
          <span className="relative flex size-2">
            {live ? (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
            ) : null}
            <span className="relative inline-flex size-2 rounded-full bg-current"></span>
          </span>
          Store Status: {live ? 'Live' : 'Paused'}
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
        <StatCard
          label="Total Revenue"
          value={money(m.revenue.value)}
          change={m.revenue.change}
          sub={`vs. ${money(m.revenue.previous)} previous period`}
          icon="dollar"
          tone="blue"
        />
        <StatCard
          label="Total Orders"
          value={number(m.orders.value)}
          change={m.orders.change}
          sub={`${number(m.orders.fulfilled)} orders fulfilled`}
          icon="bag"
          tone="indigo"
        />
        <StatCard
          label="Customers"
          value={number(m.customers.value)}
          change={m.customers.change}
          sub={`${number(m.customers.newThisMonth)} new this month`}
          icon="users"
          tone="emerald"
        />
        <StatCard
          label="Avg. Order Value"
          value={money(m.aov.value)}
          change={m.aov.change}
          sub={`Target ${money(m.aov.target)}`}
          icon="bars"
          tone="amber"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="admin-card p-6 xl:col-span-8">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-fg">Revenue Performance</h2>
              <p className="text-sm text-slate-400">Gross revenue vs net store earnings</p>
            </div>
            <div
              className="inline-flex rounded-xl border border-ink-600 bg-ink-900 p-1"
              role="tablist"
              aria-label="Date range"
            >
              {(['7d', '30d', '1y'] as const).map((r) => (
                <Link
                  key={r}
                  href={`/admin?range=${r}`}
                  role="tab"
                  aria-selected={m.range === r}
                  scroll={false}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${m.range === r ? 'bg-ink-600 text-fg shadow' : 'text-slate-400 hover:text-fg'}`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>
          <LineChart
            id="revenue"
            labels={m.chart.labels}
            series={[
              { label: 'Gross Revenue', values: m.chart.gross, color: '#f03a39', fill: true },
              { label: 'Net Earnings', values: m.chart.net, color: '#10b981', dashed: true },
            ]}
          />
        </div>

        <div className="admin-card flex flex-col p-6 xl:col-span-4">
          <div>
            <h2 className="text-lg font-bold text-fg">Traffic Acquisition</h2>
            <p className="text-sm text-slate-400">Orders by acquisition channel</p>
          </div>
          <div className="flex flex-1 items-center py-6">
            {m.channels.length === 0 ? (
              <p className="w-full py-12 text-center text-sm text-slate-500">
                No orders in this period yet.
              </p>
            ) : (
              <Donut
                segments={m.channels}
                centerValue={number(channelTotal)}
                centerLabel="orders"
              />
            )}
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-600 pt-4 text-sm">
            {m.channels.map((c) => (
              <li key={c.channel} className="flex items-center gap-2 text-slate-300">
                <span className="size-2 rounded-full" style={{ background: c.color }}></span>
                {c.label}: {Number(c.percent.toFixed(1))}%
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="admin-card overflow-hidden xl:col-span-8">
          <div className="flex items-center justify-between border-b border-ink-600 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-fg">Recent Orders</h2>
              <p className="text-sm text-slate-400">Latest activity across all channels</p>
            </div>
            <Link href="/admin/modules/orders" className="admin-link text-sm">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {m.recentOrders.length ? (
                  m.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href="/admin/modules/orders" className="admin-link font-mono text-xs">
                          {o.number}
                        </Link>
                        <p className="text-xs text-slate-500">{timeAgo(o.createdAt)}</p>
                      </td>
                      <td>
                        <p className="font-medium text-slate-200">{o.customerName}</p>
                        <p className="text-xs text-slate-500">
                          {o.itemCount} {plural('item', o.itemCount)}
                        </p>
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="text-slate-400">
                        {o.channel === 'pos'
                          ? 'In-store (POS)'
                          : o.channel.charAt(0).toUpperCase() + o.channel.slice(1)}
                      </td>
                      <td className="text-right font-semibold text-fg">{money(o.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-fg">Top Products</h2>
            <p className="text-sm text-slate-400">By revenue · {rangeLabel.toLowerCase()}</p>
            <ol className="mt-4 space-y-3">
              {m.topProducts.length ? (
                m.topProducts.map((p) => (
                  <li key={p.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-200">{p.name}</span>
                      <span className="shrink-0 font-semibold text-fg">{money(p.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                        style={{ width: `${topRevenue > 0 ? (p.revenue / topRevenue) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.quantity} sold</p>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-sm text-slate-500">
                  No sales in this period.
                </li>
              )}
            </ol>
          </div>

          <div className="admin-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg">Low Stock</h2>
              <Link href="/admin/inventory?stock=low" className="admin-link text-sm">
                Manage
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {m.lowStock.length ? (
                m.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink-800 text-slate-500">
                        <AdminIcon name="image" className="size-4" />
                      </span>
                    )}
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="min-w-0 flex-1 truncate text-sm text-slate-200 hover:text-fg"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}
                    >
                      {p.stock === 0 ? 'Out' : `${p.stock} left`}
                    </span>
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-sm text-slate-500">
                  All products are well stocked.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

/** glowy admin/no-access: staff with no sections yet. */
function NoAccess({ name }: { name: string }) {
  return (
    <div className="admin-card mx-auto max-w-xl p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500/10 text-amber-400">
        <AdminIcon name="shield" className="size-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-fg">Welcome, {name}</h1>
      <p className="mt-2 text-sm text-slate-400">
        Your account doesn&apos;t have access to any section yet. Ask the store owner to give you
        permissions under <em>Settings → Staff &amp; permissions</em>.
      </p>
      <Link href="/admin/modules/account" className="admin-btn-secondary mt-6">
        My account
      </Link>
    </div>
  );
}
