'use client';

import {
  type DashboardOverview,
  ORDER_STATUS_LABELS,
  REPORT_PERIODS,
  REPORT_TABS,
  type ReportPage,
  type ReportTab,
} from '@ehans/shared';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { AdminIcon } from '../icon';
import { Head, Kpi } from './ops-pages';
import { STATUS_DOT, tk } from './panel-ui';

const C = {
  brand: '#ff5554',
  info: '#2F6DB0',
  ok: '#22865A',
  warn: '#A8690F',
  bad: '#C2414B',
  violet: '#7C5CC4',
};

const weekday = (day: string) =>
  new Date(`${day}T00:00:00+06:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    timeZone: 'Asia/Dhaka',
  });

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`admin-card p-5 ${className}`}>{children}</section>;
}
const Title = ({ children }: { children: ReactNode }) => (
  <h2 className="text-base font-bold text-fg">{children}</h2>
);
const Bar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
    <i
      className="block h-full rounded-full"
      style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
    />
  </div>
);
const Legend = ({ items }: { items: [string, string, ReactNode?][] }) => (
  <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-slate-500">
    {items.map(([color, label, n]) => (
      <span key={label} className="flex items-center gap-1.5">
        <i className="inline-block size-2.5 rounded-[3px]" style={{ background: color }} />
        {label}
        {n !== undefined ? <b className="text-fg tabular-nums">{n}</b> : null}
      </span>
    ))}
  </div>
);

function CostWarning({ n }: { n: number }) {
  if (!n) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
      <AdminIcon name="alert" className="mt-0.5 size-4 shrink-0" />
      <span>
        {n} sold {n === 1 ? 'line has' : 'lines have'} no product cost, so profit counts{' '}
        {n === 1 ? 'it' : 'them'} at ৳0 cost and reads too high. Set <b>Cost per item</b> on each
        product under{' '}
        <Link href="/admin/products" className="underline">
          Products
        </Link>
        .
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- Dashboard

function OrdersChart({ days }: { days: DashboardOverview['days'] }) {
  const W = 640,
    H = 230,
    pad = 34;
  const max = Math.max(1, ...days.map((d) => d.orders));
  const bw = (W - pad * 2) / days.length;
  const y = (v: number) => H - 28 - (v / max) * (H - 60);
  const ticks = [...new Set([0, Math.ceil(max / 2), max])];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Orders in the last 7 days"
      className="mt-2 text-slate-500"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={pad}
            x2={W - 8}
            y1={y(t)}
            y2={y(t)}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray={t ? '3 4' : undefined}
          />
          <text x={pad - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="currentColor">
            {t}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const x = pad + i * bw + bw * 0.18,
          w = bw * 0.64,
          last = i === days.length - 1;
        return (
          <g key={d.day}>
            <rect
              x={x}
              y={y(d.orders)}
              width={w}
              height={y(0) - y(d.orders)}
              rx={5}
              fill={C.brand}
              opacity={last ? 1 : 0.32}
            >
              <title>
                {d.orders} orders · {d.delivered} delivered
              </title>
            </rect>
            <rect
              x={x + w * 0.25}
              y={y(d.delivered)}
              width={w * 0.5}
              height={y(0) - y(d.delivered)}
              rx={3}
              fill={C.ok}
              opacity={0.85}
            />
            <text
              x={x + w / 2}
              y={y(d.orders) - 6}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              className="fill-fg"
            >
              {d.orders}
            </text>
            <text
              x={x + w / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize={11.5}
              fill="currentColor"
              fontWeight={last ? 700 : 500}
            >
              {last ? 'Today' : weekday(d.day)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Tile({
  href,
  label,
  value,
  hint,
  color,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
  color?: string;
}) {
  return (
    <Link
      href={href}
      className="admin-card flex flex-col gap-0.5 p-4 transition hover:ring-1 hover:ring-blue-500"
    >
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <b
        className="text-xl font-extrabold text-fg tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </b>
      <span className="text-xs text-slate-500">{hint}</span>
    </Link>
  );
}

export function DashboardView({ d, ordersHref }: { d: DashboardOverview; ordersHref: boolean }) {
  const k = d.kpis;
  const kpis: [string, string, string, string, string][] = [
    ["Today's orders", String(k.todayOrders), `${tk(k.todayValue)} order value`, C.brand, 'bag'],
    [
      'Waiting to confirm',
      String(k.waiting),
      `${k.noAnswer} call not received · ${k.followUp} follow up`,
      C.info,
      'phone',
    ],
    ['Shipped', String(k.shipped), `${tk(k.codToCollect)} COD to collect`, C.violet, 'truck'],
    [
      'Delivery success',
      `${k.deliverySuccess}%`,
      `${k.delivered} delivered · ${k.returned} returned`,
      C.ok,
      'check',
    ],
    ['Sales value', tk(k.salesValue), 'Excludes cancelled and returned', C.warn, 'cash'],
    ['Duplicate alerts', String(k.duplicates), 'Open orders with same phone or IP', C.bad, 'dup'],
  ];
  const f = d.finance;
  const total = d.statuses.reduce((n, s) => n + s.count, 0);
  const topMax = d.bestSellers[0]?.quantity ?? 1;
  const open = (number: string) => (ordersHref ? `/admin/orders?q=${number}` : '#');

  return (
    <>
      <Head title="Dashboard" sub="Today at a glance: orders, money and what needs you." />
      <CostWarning n={d.missingCost} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis.map(([l, v, h, c, i]) => (
          <Kpi key={l} label={l} value={v} hint={h} color={c} icon={i} />
        ))}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          href="/admin/reports"
          label="Net profit · 7 days"
          value={tk(f.profit7)}
          hint={`on ${tk(f.revenue7)} sales`}
          color={f.profit7 >= 0 ? C.ok : C.bad}
        />
        <Tile
          href="/admin/modules/accounts"
          label="Ad spend · 7 days"
          value="Not tracked"
          hint="Add ad costs in Accounts (coming soon)"
        />
        <Tile
          href="/admin/shipments"
          label="Money with couriers"
          value={tk(f.withCouriers)}
          hint={`${tk(f.readyForPayout)} ready for payout`}
        />
        <Tile
          href="/admin/fraud-checker"
          label="Unchecked new orders"
          value={String(f.unchecked)}
          hint="Open fraud checker"
        />
      </div>
      <div className="mb-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Title>Orders in the last 7 days</Title>
            <Legend
              items={[
                [C.brand, 'Orders placed'],
                [C.ok, 'Delivered'],
              ]}
            />
          </div>
          <OrdersChart days={d.days} />
        </Card>
        <Card>
          <Title>Needs attention</Title>
          <div className="mt-1.5 divide-y divide-ink-700">
            {d.attention.length ? (
              d.attention.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <span style={{ color: a.kind === 'dup' ? C.warn : C.bad }}>
                    <AdminIcon
                      name={a.kind === 'dup' ? 'dup' : a.kind === 'blocked' ? 'ban' : 'box'}
                      className="size-4"
                    />
                  </span>
                  <span className="flex-1 text-[13px] text-slate-200">{a.text}</span>
                  <Link
                    href={a.number ? open(a.number) : '/admin/inventory'}
                    className="admin-btn-secondary h-7 px-2.5 text-xs"
                  >
                    {a.number ? 'Open' : 'View'}
                  </Link>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">All clear.</p>
            )}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <Title>Order status · 30 days</Title>
          {total ? (
            <>
              <div className="my-3 flex h-3 gap-0.5 overflow-hidden rounded-full">
                {d.statuses.map((s) => (
                  <span
                    key={s.status}
                    title={`${ORDER_STATUS_LABELS[s.status]}: ${s.count}`}
                    style={{ flex: s.count, background: STATUS_DOT[s.status] }}
                  />
                ))}
              </div>
              <Legend
                items={d.statuses.map((s) => [
                  STATUS_DOT[s.status]!,
                  ORDER_STATUS_LABELS[s.status],
                  s.count,
                ])}
              />
            </>
          ) : (
            <p className="py-4 text-sm text-slate-500">No orders in the last 30 days.</p>
          )}
          <h2 className="mt-5 text-base font-bold text-fg">Team performance</h2>
          <div className="overflow-x-auto">
            <table className="admin-table mt-1.5 min-w-[520px] text-sm">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Handled</th>
                  <th>Confirmed+</th>
                  <th>Cancelled</th>
                  <th>Confirm rate</th>
                </tr>
              </thead>
              <tbody>
                {d.team.length ? (
                  d.team.map((t) => {
                    const rate = t.handled ? Math.round((t.confirmed / t.handled) * 100) : 0;
                    return (
                      <tr key={t.id ?? 'none'}>
                        <td className="font-bold text-fg">{t.name}</td>
                        <td className="tabular-nums">{t.handled}</td>
                        <td className="tabular-nums">{t.confirmed}</td>
                        <td className="tabular-nums">{t.cancelled}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="min-w-16 flex-1">
                              <Bar pct={rate} color={C.ok} />
                            </div>
                            <span className="text-xs tabular-nums">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <Title>Best sellers · 30 days</Title>
          <div className="mt-1.5 divide-y divide-ink-700">
            {d.bestSellers.length ? (
              d.bestSellers.map((p) => (
                <div key={p.productId} className="flex items-center gap-3 py-2.5">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt=""
                      className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-ink-600"
                    />
                  ) : (
                    <span className="size-10 shrink-0 rounded-lg bg-ink-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-200">
                      {p.name}
                    </div>
                    <div className="mt-1.5">
                      <Bar pct={(p.quantity / topMax) * 100} color={C.brand} />
                    </div>
                  </div>
                  <b className="tabular-nums text-fg">{p.quantity}</b>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No sales yet.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Reports

const cell = (v: string | number | null, kind: string) =>
  v === null
    ? '—'
    : kind === 'money'
      ? tk(Number(v))
      : kind === 'pct'
        ? `${v}%`
        : typeof v === 'number'
          ? v.toLocaleString('en-IN')
          : v;

export function ReportsView({ r }: { r: ReportPage }) {
  const [copied, setCopied] = useState(false);
  const s = r.summary;
  const tabHref = (tab: ReportTab, days = r.days) => `/admin/reports?tab=${tab}&days=${days}`;
  const copyCsv = async () => {
    const esc = (x: string) => (/[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
    const csv = [
      r.head.map((h) => h.label),
      ...r.rows.map((row) => row.map((v) => (v === null ? '' : String(v)))),
    ]
      .map((line) => line.map(esc).join(','))
      .join('\n');
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Head title="Reports" sub="Sales, profit and returns from your orders.">
        <div className="inline-flex rounded-lg bg-ink-800 p-0.5 text-sm">
          {REPORT_PERIODS.map((p) => (
            <Link
              key={p}
              href={tabHref(r.tab, p)}
              className={`rounded-md px-3 py-1.5 font-semibold ${r.days === p ? 'bg-white text-fg shadow dark:bg-ink-600' : 'text-slate-400'}`}
            >
              {p === 365 ? '1 year' : `${p} days`}
            </Link>
          ))}
        </div>
      </Head>
      <CostWarning n={r.missingCost} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={`Sales · ${r.days} days`}
          icon="cash"
          value={tk(s.sales)}
          hint={`${s.delivered} delivered orders`}
          color={C.info}
        />
        <Kpi
          label={`Net profit · ${r.days} days`}
          icon="check"
          value={tk(s.profit)}
          hint={`${s.sales ? Math.round((s.profit / s.sales) * 100) : 0}% margin · before ads and expenses`}
          color={C.ok}
        />
        <Kpi
          label="Return rate"
          icon="undo"
          value={`${s.delivered + s.returned ? Math.round((s.returned / (s.delivered + s.returned)) * 100) : 0}%`}
          hint={`${s.returned} parcels returned`}
          color={C.bad}
        />
        <Kpi
          label="Average order"
          icon="bag"
          value={tk(s.delivered ? Math.round(s.sales / s.delivered) : 0)}
          hint="Delivered orders"
          color={C.warn}
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(Object.keys(REPORT_TABS) as ReportTab[]).map((t) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${r.tab === t ? 'bg-blue-600 text-white ring-blue-600' : 'text-slate-300 ring-ink-600 hover:bg-ink-800'}`}
          >
            {REPORT_TABS[t]}
          </Link>
        ))}
      </div>
      <div className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-600 px-5 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-fg">{REPORT_TABS[r.tab]} report</h2>
            {r.note ? <p className="text-xs text-slate-500">{r.note}</p> : null}
          </div>
          <button type="button" className="admin-btn-secondary h-8 px-3 text-xs" onClick={copyCsv}>
            <AdminIcon name={copied ? 'check' : 'copy'} className="size-3.5" />{' '}
            {copied ? 'Copied' : 'Copy CSV'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[760px]">
            <thead>
              <tr>
                {r.head.map((h, i) => (
                  <th key={h.label} className={i ? 'text-right' : ''}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.length ? (
                r.rows.map((row, n) => (
                  <tr key={n}>
                    {row.map((v, i) => (
                      <td
                        key={i}
                        className={
                          i
                            ? `text-right tabular-nums ${r.head[i]!.label.includes('profit') && typeof v === 'number' && v < 0 ? 'text-rose-600' : ''}`
                            : 'font-bold text-fg'
                        }
                      >
                        {cell(v, r.head[i]!.kind)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={r.head.length} className="py-12 text-center text-slate-500">
                    No data for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
