'use client';

import {
  type FraudCheckDto,
  fraudRisk,
  ORDER_SOURCES,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatusName,
  PANEL_DATE_RANGES,
  type PanelFilters,
  type PanelOrderDetail,
  type PanelOrderRow,
  type PanelOrdersPage,
  type PanelTab,
  TO_CONFIRM_STATUSES,
} from '@ehans/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import {
  getPanelOrder,
  panelBulk,
  setPanelStatus,
  syncCourier,
} from '@/app/admin/(panel)/orders/panel-actions';
import { runFraudCheck } from '@/app/admin/(panel)/orders/actions';
import { AdminIcon } from '../icon';
import { OrderFormModal, seedFromOrder, emptySeed, type FormSeed } from './order-form-modal';
import {
  BlockModal,
  ConfirmModal,
  CourierModal,
  DuplicatesModal,
  FraudModal,
  NotesModal,
} from './order-modals';
import {
  ago,
  Avatar,
  clock,
  fmtPhone,
  type MenuItem,
  PopMenu,
  STATUS_DOT,
  STATUS_PILL,
  tk,
  ToastProvider,
  useCopy,
  useToast,
} from './panel-ui';

type Modal =
  | { kind: 'edit'; number: string | null; seed: FormSeed; detail: PanelOrderDetail | null }
  | { kind: 'notes' | 'dups' | 'fraud' | 'block' | 'delete'; order: PanelOrderRow }
  | { kind: 'courier'; orders: PanelOrderRow[] }
  | null;

const OPEN = ['pending', 'confirmed', 'no_answer', 'follow_up', 'ready'];
const STATUS_ICON: Record<OrderStatusName, string> = {
  pending: 'clock',
  confirmed: 'check',
  no_answer: 'phone',
  follow_up: 'pause',
  ready: 'box',
  shipped: 'truck',
  delivered: 'check',
  partial: 'box',
  returned: 'undo',
  fake: 'alert',
  cancelled: 'x',
};
const SRC_COLOR: Record<string, string> = {
  Website: '#2F6DB0',
  'Landing page': '#6A55B5',
  Facebook: '#1877F2',
  Google: '#D93025',
  Instagram: '#C13584',
  TikTok: '#25252B',
  WhatsApp: '#1F9D55',
  'Phone call': '#5E6470',
  POS: '#5E6470',
};
const SHORT: Record<string, string> = {
  WhatsApp: 'WA',
  'Phone call': 'Call',
  POS: 'POS',
  Facebook: 'FB',
  Instagram: 'IG',
  TikTok: 'TT',
  Website: 'Web',
  'Landing page': 'LP',
};

export function OrdersPanel(props: {
  data: PanelOrdersPage;
  filters: PanelFilters;
  manage: boolean;
  perPage: number;
}) {
  return (
    <ToastProvider>
      <Panel {...props} />
    </ToastProvider>
  );
}

function Panel({
  data,
  filters,
  manage,
  perPage,
}: {
  data: PanelOrdersPage;
  filters: PanelFilters;
  manage: boolean;
  perPage: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const copy = useCopy();
  const [, startNav] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Modal>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; items: MenuItem[] } | null>(null);
  // saved checks from the server, plus the ones run on this page since
  const [checked, setChecks] = useState<Record<string, FraudCheckDto>>({});
  const checks = { ...data.fraudChecks, ...checked };
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(filters.q ?? '');
  const rows = data.items;

  const go = (change: Partial<PanelFilters> & { page?: number; perPage?: number }) => {
    const next = { ...filters, perPage: String(perPage), ...change } as Record<string, unknown>;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next))
      if (
        v !== undefined &&
        v !== '' &&
        v !== null &&
        !(k === 'tab' && v === 'all') &&
        !(k === 'date' && v === 'all')
      )
        params.set(k, String(v));
    if (!change.page) params.delete('page');
    if (params.get('perPage') === '50') params.delete('perPage');
    setSelected(new Set());
    startNav(() => router.push(`/admin/orders${params.size ? `?${params}` : ''}`));
  };
  const refresh = () => {
    setModal(null);
    startNav(() => router.refresh());
  };

  // search as you type
  const typed = useRef(false);
  useEffect(() => {
    if (!typed.current) return;
    const t = window.setTimeout(() => go({ q: q || undefined }), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on typing
  }, [q]);

  const status = async (o: PanelOrderRow, s: OrderStatusName) => {
    if (s === 'shipped' && !o.courier) return setModal({ kind: 'courier', orders: [o] });
    const r = await setPanelStatus(o.number, s);
    if (!r.ok) return toast(r.error);
    toast(`#${o.number} → ${ORDER_STATUS_LABELS[s]}`);
    refresh();
  };
  const openEdit = async (o: PanelOrderRow, clone = false) => {
    const r = await getPanelOrder(o.number);
    if (!r.ok) return toast(r.error);
    const seed = seedFromOrder(r.data);
    setModal(
      clone
        ? {
            kind: 'edit',
            number: null,
            seed: { ...seed, status: 'pending', advance: 0 },
            detail: null,
          }
        : { kind: 'edit', number: o.number, seed, detail: r.data },
    );
  };
  const fraudQuick = async (numbers: string[]) => {
    setChecking((s) => new Set([...s, ...numbers]));
    let risky = 0;
    for (const n of numbers) {
      const r = await runFraudCheck(n, false);
      if (r.ok) {
        const o = rows.find((x) => x.number === n)!;
        setChecks((c) => ({ ...c, [o.phone]: r.check }));
        if (fraudRisk(r.check) === 'risky') risky++;
      }
    }
    setChecking((s) => new Set([...s].filter((x) => !numbers.includes(x))));
    toast(
      numbers.length === 1
        ? 'Courier check done'
        : `${numbers.length} orders checked${risky ? ` · ${risky} risky` : ''}`,
    );
  };
  const orderText = (o: PanelOrderRow) =>
    [
      `Order #${o.number}`,
      `${o.customerName} · ${o.phone}`,
      `${o.address}, ${o.district}`,
      ...o.items.map(
        (i) =>
          `${i.name}${i.variantTitle ? ` (${i.variantTitle})` : ''} × ${i.quantity} = ${tk(i.unitPrice * i.quantity)}`,
      ),
      `Delivery ${tk(o.delivery)}${o.discount ? ` · Discount −${tk(o.discount)}` : ''}`,
      `Total ${tk(o.total)}${o.advance ? ` · Advance ${tk(o.advance)} · Collect ${tk(o.due)}` : ''}`,
    ].join('\n');

  const moreMenu = (o: PanelOrderRow, anchor: HTMLElement) =>
    setMenu({
      anchor,
      items: [
        { label: 'Edit order', icon: 'edit', onSelect: () => void openEdit(o) },
        {
          label: 'Invoice',
          icon: 'printer',
          onSelect: () => window.open(`/admin/print?type=invoice&numbers=${o.number}`, '_blank'),
        },
        {
          label: 'Print slip',
          icon: 'tag',
          onSelect: () => window.open(`/admin/print?type=slip&numbers=${o.number}`, '_blank'),
        },
        {
          label: 'Fraud check',
          icon: 'shield',
          onSelect: () => setModal({ kind: 'fraud', order: o }),
        },
        {
          label: 'Copy order details',
          icon: 'copy',
          onSelect: () => copy(orderText(o), 'Order details copied'),
        },
        ...(manage
          ? ([
              {
                label: 'Duplicate this order',
                icon: 'dup',
                onSelect: () => void openEdit(o, true),
              },
              '-',
              {
                label: 'Call not received',
                icon: 'phone',
                onSelect: () => void status(o, 'no_answer'),
              },
              { label: 'Follow up', icon: 'clock', onSelect: () => void status(o, 'follow_up') },
              {
                label: 'Mark as fake order',
                icon: 'alert',
                danger: true,
                onSelect: () => void status(o, 'fake'),
              },
              {
                label: 'Cancel order',
                icon: 'x',
                danger: true,
                onSelect: () => void status(o, 'cancelled'),
              },
              {
                label: 'Block phone / IP',
                icon: 'ban',
                danger: true,
                onSelect: () => setModal({ kind: 'block', order: o }),
              },
              {
                label: 'Delete order',
                icon: 'trash',
                danger: true,
                onSelect: () => setModal({ kind: 'delete', order: o }),
              },
            ] as MenuItem[])
          : []),
      ],
    });
  const statusMenu = (o: PanelOrderRow, anchor: HTMLElement) =>
    setMenu({
      anchor,
      items: ORDER_STATUSES.map((s) => ({
        label: ORDER_STATUS_LABELS[s],
        icon: STATUS_ICON[s],
        danger: s === 'cancelled' || s === 'fake',
        onSelect: () => void status(o, s),
      })),
    });

  const bulk = async (
    action: 'status' | 'assign' | 'delete',
    extra: { status?: OrderStatusName; staffId?: string | null } = {},
  ) => {
    const r = await panelBulk(action, [...selected], extra);
    if (!r.ok) return toast(r.error);
    toast(
      action === 'delete'
        ? `${r.data.updated} orders deleted`
        : action === 'assign'
          ? `${r.data.updated} orders assigned`
          : `${r.data.updated} orders confirmed${r.data.skipped.length ? ` · ${r.data.skipped.length} skipped` : ''}`,
    );
    setSelected(new Set());
    refresh();
  };

  const k = data.kpis;
  const kpis = [
    {
      l: "Today's orders",
      v: String(k.todayOrders),
      h: `${tk(k.todayValue)} order value`,
      c: '#E5484D',
      i: 'bag',
    },
    {
      l: 'Waiting to confirm',
      v: String(k.waiting),
      h: `${k.noAnswer} call not received · ${k.followUp} follow up`,
      c: '#2F6DB0',
      i: 'phone',
    },
    {
      l: 'Shipped',
      v: String(k.shipped),
      h: `${tk(k.codToCollect)} COD to collect`,
      c: '#6A55B5',
      i: 'truck',
    },
    {
      l: 'Delivery success',
      v: `${k.deliverySuccess}%`,
      h: `${k.delivered} delivered · ${k.returned} returned`,
      c: '#22865A',
      i: 'check',
    },
    {
      l: 'Sales value',
      v: tk(k.salesValue),
      h: 'Excludes cancelled, returned and fake',
      c: '#A8690F',
      i: 'cash',
    },
    {
      l: 'Duplicate alerts',
      v: String(k.duplicates),
      h: 'Open orders with same phone or IP',
      c: '#C2414B',
      i: 'dup',
    },
  ];
  const tabs: [PanelTab, string][] = [
    ['all', 'All'],
    ...ORDER_STATUSES.map((s) => [s, ORDER_STATUS_LABELS[s]] as [PanelTab, string]),
    ['dup', 'Duplicates'],
    ['blocked', 'Blocked'],
  ];
  const tab = filters.tab ?? 'all';
  const allChecked = rows.length > 0 && rows.every((o) => selected.has(o.number));
  const selectedRows = rows.filter((o) => selected.has(o.number));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[28px]">Orders</h1>
          <p className="mt-1 text-sm text-slate-400">
            Confirm by phone, check couriers, ship and follow every order.
          </p>
        </div>
        {manage ? (
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() =>
              setModal({ kind: 'edit', number: null, seed: emptySeed(), detail: null })
            }
          >
            <AdminIcon name="plus" className="size-4" /> Manual order
          </button>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((x) => (
          <div
            key={x.l}
            className="admin-card relative overflow-hidden p-4"
            style={{ ['--k' as string]: x.c }}
          >
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: x.c }} />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span style={{ color: x.c }}>
                <AdminIcon name={x.i} className="size-4" />
              </span>
              {x.l}
            </div>
            <div className="mt-1.5 text-2xl font-extrabold text-fg tabular-nums">{x.v}</div>
            <div className="mt-0.5 truncate text-xs text-slate-500">{x.h}</div>
          </div>
        ))}
      </div>

      <div className="sticky top-[64px] z-20 -mx-1 space-y-3 bg-ink-950/95 px-1 pt-1 pb-3 backdrop-blur dark:bg-ink-950/95">
        <nav
          className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-ink-600 dark:bg-ink-900"
          aria-label="Order status"
        >
          {tabs.map(([key, label]) => {
            const on = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => go({ tab: key })}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition ${on ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-ink-800 hover:text-fg'}`}
                aria-current={on ? 'page' : undefined}
              >
                {STATUS_DOT[key] ? (
                  <span
                    className="size-2 rounded-full"
                    style={{ background: on ? '#fff' : STATUS_DOT[key] }}
                  />
                ) : null}
                {label}
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${on ? 'bg-white/20' : 'bg-ink-800 text-slate-400'}`}
                >
                  {data.tabs[key] ?? 0}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1">
            <AdminIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
            />
            <input
              className="admin-input pr-8 pl-9"
              placeholder="Search by name, phone, order ID, CN or product"
              aria-label="Search orders"
              value={q}
              onChange={(e) => {
                typed.current = true;
                setQ(e.target.value);
              }}
            />
            {q ? (
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-500 hover:text-fg"
                aria-label="Clear search"
                onClick={() => {
                  typed.current = true;
                  setQ('');
                }}
              >
                <AdminIcon name="x" className="size-4" />
              </button>
            ) : null}
          </div>
          <select
            className="admin-input w-auto"
            aria-label="Date"
            value={filters.date ?? 'all'}
            onChange={(e) =>
              go({ date: e.target.value as PanelFilters['date'], from: undefined, to: undefined })
            }
          >
            {Object.entries(PANEL_DATE_RANGES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {filters.date === 'custom' ? (
            <span className="flex items-center gap-1.5">
              <input
                type="date"
                className="admin-input w-auto"
                aria-label="From date"
                defaultValue={filters.from}
                onChange={(e) => go({ from: e.target.value || undefined })}
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="date"
                className="admin-input w-auto"
                aria-label="To date"
                defaultValue={filters.to}
                onChange={(e) => go({ to: e.target.value || undefined })}
              />
            </span>
          ) : null}
          <select
            className="admin-input w-auto"
            aria-label="Team"
            value={filters.assignee ?? ''}
            onChange={(e) => go({ assignee: e.target.value || undefined })}
          >
            <option value="">All teams</option>
            <option value="none">Unassigned</option>
            {data.staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="admin-input w-auto"
            aria-label="Courier"
            value={filters.courier ?? ''}
            onChange={(e) => go({ courier: e.target.value || undefined })}
          >
            <option value="">All couriers</option>
            <option value="none">Not assigned</option>
            {data.couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="admin-input w-auto"
            aria-label="Source"
            value={filters.source ?? ''}
            onChange={(e) => go({ source: e.target.value || undefined })}
          >
            <option value="">All sources</option>
            <option value="manual">Manual orders</option>
            <option value="recovered">Recovered orders</option>
            {ORDER_SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span>
            <b className="text-fg tabular-nums">{data.summary.count}</b>{' '}
            {data.summary.count === 1 ? 'order' : 'orders'}
          </span>
          <span className="size-1 rounded-full bg-slate-500" />
          <span>
            Value <b className="text-fg tabular-nums">{tk(data.summary.value)}</b>
          </span>
          <span className="size-1 rounded-full bg-slate-500" />
          <span>
            {PANEL_DATE_RANGES[filters.date ?? 'all']}
            {filters.source === 'manual'
              ? ' · manual orders'
              : filters.source === 'recovered'
                ? ' · recovered orders'
                : ''}
          </span>
        </div>

        {manage && selected.size ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2 text-sm ring-1 ring-blue-500/30">
            <b className="text-fg">{selected.size} selected</b>
            <span className="flex-1" />
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3 text-xs"
              onClick={() => void bulk('status', { status: 'confirmed' })}
            >
              <AdminIcon name="check" className="size-3.5" /> Confirm
            </button>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3 text-xs"
              onClick={() => void fraudQuick(selectedRows.map((o) => o.number))}
            >
              <AdminIcon name="shield" className="size-3.5" /> Check courier
            </button>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3 text-xs"
              onClick={() => setModal({ kind: 'courier', orders: selectedRows })}
            >
              <AdminIcon name="truck" className="size-3.5" /> Send to courier
            </button>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3 text-xs"
              onClick={(e) =>
                setMenu({
                  anchor: e.currentTarget,
                  items: [
                    {
                      label: 'Unassigned',
                      icon: 'users',
                      onSelect: () => void bulk('assign', { staffId: null }),
                    },
                    ...data.staff.map((s) => ({
                      label: s.name,
                      icon: 'users',
                      onSelect: () => void bulk('assign', { staffId: s.id }),
                    })),
                  ],
                })
              }
            >
              <AdminIcon name="users" className="size-3.5" /> Assign team
            </button>
            <a
              className="admin-btn-secondary h-8 px-3 text-xs"
              href={`/admin/print?type=invoice&numbers=${[...selected].join(',')}`}
              target="_blank"
              rel="noopener"
            >
              <AdminIcon name="printer" className="size-3.5" /> Invoices
            </a>
            <a
              className="admin-btn-secondary h-8 px-3 text-xs"
              href={`/admin/print?type=slip&numbers=${[...selected].join(',')}`}
              target="_blank"
              rel="noopener"
            >
              <AdminIcon name="tag" className="size-3.5" /> Slips
            </a>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3 text-xs text-rose-500"
              onClick={() => setModal({ kind: 'delete', order: selectedRows[0]! })}
            >
              <AdminIcon name="trash" className="size-3.5" /> Delete
            </button>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <AdminIcon name="x" className="size-3.5" /> Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1180px]">
            <thead>
              <tr>
                {manage ? (
                  <th className="w-9">
                    <input
                      type="checkbox"
                      className="size-4 accent-blue-600"
                      aria-label="Select all"
                      checked={allChecked}
                      onChange={() =>
                        setSelected(allChecked ? new Set() : new Set(rows.map((o) => o.number)))
                      }
                    />
                  </th>
                ) : null}
                <th>Order</th>
                <th>Customer</th>
                <th>Products · amount</th>
                <th>Status · handled by</th>
                <th>Courier · fraud check</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((o) => (
                  <Row
                    key={o.id}
                    o={o}
                    manage={manage}
                    selected={selected.has(o.number)}
                    onSelect={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (n.has(o.number)) n.delete(o.number);
                        else n.add(o.number);
                        return n;
                      })
                    }
                    check={checks[o.phone] ?? null}
                    checking={checking.has(o.number)}
                    fraudEnabled={data.fraudEnabled}
                    onEdit={() => void openEdit(o)}
                    onMore={(el) => moreMenu(o, el)}
                    onStatusMenu={(el) => statusMenu(o, el)}
                    onStatus={(s) => void status(o, s)}
                    onCourier={() => setModal({ kind: 'courier', orders: [o] })}
                    onSync={async () => {
                      const r = await syncCourier(o.number);
                      toast(r.ok ? `Courier status: ${r.data.courierStatus}` : r.error);
                      if (r.ok) refresh();
                    }}
                    onFraud={() => setModal({ kind: 'fraud', order: o })}
                    onFraudQuick={() => void fraudQuick([o.number])}
                    onNote={() => setModal({ kind: 'notes', order: o })}
                    onDups={() => setModal({ kind: 'dups', order: o })}
                    copy={copy}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    No orders match these filters.{' '}
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => router.push('/admin/orders')}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-600 px-4 py-3 text-sm text-slate-400">
          <span>
            Showing {rows.length} of {data.total} orders · {data.allOrders} in total
          </span>
          <div className="flex items-center gap-2">
            <select
              className="admin-input h-8 w-auto py-0"
              aria-label="Per page"
              value={perPage}
              onChange={(e) => go({ perPage: Number(e.target.value) })}
            >
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3"
              disabled={data.page <= 1}
              onClick={() => go({ page: data.page - 1 })}
            >
              Prev
            </button>
            <span className="tabular-nums">
              {data.page} / {data.totalPages}
            </span>
            <button
              type="button"
              className="admin-btn-secondary h-8 px-3"
              disabled={data.page >= data.totalPages}
              onClick={() => go({ page: data.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {menu ? (
        <PopMenu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />
      ) : null}
      {modal?.kind === 'edit' ? (
        <OrderFormModal
          number={modal.number}
          seed={modal.seed}
          detail={modal.detail}
          staff={data.staff}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      ) : null}
      {modal?.kind === 'notes' ? (
        <NotesModal order={modal.order} onClose={() => setModal(null)} onSaved={refresh} />
      ) : null}
      {modal?.kind === 'dups' ? (
        <DuplicatesModal
          order={modal.order}
          rows={rows}
          onClose={() => setModal(null)}
          onChanged={refresh}
          onShowAll={(phone) => {
            setModal(null);
            setQ(phone);
            go({ q: phone, tab: 'all' });
          }}
        />
      ) : null}
      {modal?.kind === 'fraud' ? (
        <FraudModal
          order={modal.order}
          check={checks[modal.order.phone] ?? null}
          enabled={data.fraudEnabled}
          onClose={() => setModal(null)}
          onChecked={(c) => setChecks((s) => ({ ...s, [modal.order.phone]: c }))}
        />
      ) : null}
      {modal?.kind === 'block' ? (
        <BlockModal order={modal.order} onClose={() => setModal(null)} onDone={refresh} />
      ) : null}
      {modal?.kind === 'courier' ? (
        <CourierModal
          orders={modal.orders}
          couriers={data.couriers}
          onClose={() => setModal(null)}
          onDone={refresh}
        />
      ) : null}
      {modal?.kind === 'delete' ? (
        <ConfirmModal
          title={
            selected.size > 1
              ? `Delete ${selected.size} orders?`
              : `Delete order #${modal.order.number}?`
          }
          text="This removes the order permanently. Open orders put their products back in stock first. This can't be undone."
          confirm="Delete"
          danger
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const numbers = selected.size > 1 ? [...selected] : [modal.order.number];
            const r = await panelBulk('delete', numbers);
            if (!r.ok) return toast(r.error);
            toast(
              numbers.length > 1
                ? `${r.data.updated} orders deleted`
                : `Order #${modal.order.number} deleted`,
            );
            setSelected(new Set());
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

function Row({
  o,
  manage,
  selected,
  onSelect,
  check,
  checking,
  fraudEnabled,
  onEdit,
  onMore,
  onStatusMenu,
  onStatus,
  onCourier,
  onSync,
  onFraud,
  onFraudQuick,
  onNote,
  onDups,
  copy,
}: {
  o: PanelOrderRow;
  manage: boolean;
  selected: boolean;
  onSelect: () => void;
  check: FraudCheckDto | null;
  checking: boolean;
  fraudEnabled: boolean;
  onEdit: () => void;
  onMore: (el: HTMLElement) => void;
  onStatusMenu: (el: HTMLElement) => void;
  onStatus: (s: OrderStatusName) => void;
  onCourier: () => void;
  onSync: () => void;
  onFraud: () => void;
  onFraudQuick: () => void;
  onNote: () => void;
  onDups: () => void;
  copy: (t: string, done?: string) => void;
}) {
  const wa = encodeURIComponent(
    `আসসালামু আলাইকুম ${o.customerName}, Ehans Mart থেকে বলছি। আপনার অর্ডার #${o.number} (${tk(o.total)}) কনফার্ম করতে চাচ্ছি।`,
  );
  const ibtn = 'grid size-7 place-items-center rounded-lg ring-1 ring-ink-600 hover:bg-ink-800';
  const level = check ? fraudRisk(check) : null;
  const LV = {
    safe: ['Safe', '#22865A'],
    watch: ['Check first', '#A8690F'],
    risky: ['Risky', '#C2414B'],
    new: ['New', '#2F6DB0'],
  } as const;

  return (
    <tr
      className={`align-top ${selected ? 'bg-blue-500/5' : ''} ${o.blocked ? 'bg-rose-500/[0.04]' : o.duplicates.length ? 'bg-amber-500/[0.04]' : ''}`}
    >
      {manage ? (
        <td className="pt-4">
          <input
            type="checkbox"
            className="size-4 accent-blue-600"
            aria-label={`Select ${o.number}`}
            checked={selected}
            onChange={onSelect}
          />
        </td>
      ) : null}

      <td className="min-w-40 py-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="font-mono text-sm font-bold text-fg hover:text-blue-500"
            title="Open and edit order"
            onClick={onEdit}
          >
            #{o.number}
          </button>
          <button
            type="button"
            className={`${ibtn} text-slate-400`}
            title="More actions"
            aria-label="More actions"
            onClick={(e) => onMore(e.currentTarget)}
          >
            <AdminIcon name="more" className="size-4" />
          </button>
        </div>
        <div className="text-xs text-slate-500" title={clock(o.createdAt)}>
          {ago(o.createdAt)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {o.manual ? (
            <span
              className="rounded-md bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500"
              title={`Manual order via ${o.source}`}
            >
              Manual · {SHORT[o.source] ?? o.source}
            </span>
          ) : (
            <span
              className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
              style={{
                color: SRC_COLOR[o.source] ?? '#5E6470',
                background: `color-mix(in srgb, ${SRC_COLOR[o.source] ?? '#5E6470'} 12%, transparent)`,
              }}
            >
              {o.source}
            </span>
          )}
          {o.recovered ? (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600"
              title="Recovered from an incomplete checkout"
            >
              <AdminIcon name="refresh" className="size-3" /> Recovered
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <AdminIcon name={o.manual ? 'users' : 'globe'} className="size-3" />
          {o.manual ? `by ${o.createdBy ?? 'Admin'}` : (o.ipAddress ?? '—')}
        </div>
      </td>

      <td className="min-w-60 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="text-left font-bold text-fg hover:text-blue-500"
            onClick={onEdit}
          >
            {o.customerName}
          </button>
          {o.blocked ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600">
              <AdminIcon name="ban" className="size-3" /> Blocked
            </span>
          ) : null}
          {o.duplicates.length ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600"
              title={`Duplicate: ${o.duplicates.map((n) => `#${n}`).join(', ')}. Click to see them.`}
              onClick={onDups}
            >
              <AdminIcon name="dup" className="size-3" />×{o.duplicates.length + 1}
            </button>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="font-medium tabular-nums text-slate-200">{fmtPhone(o.phone)}</span>
          <a
            className={`${ibtn} text-sky-500`}
            href={`tel:+88${o.phone}`}
            title={`Call ${fmtPhone(o.phone)}`}
            aria-label="Call"
          >
            <AdminIcon name="phone" className="size-3.5" />
          </a>
          <a
            className={`${ibtn} text-green-600`}
            href={`https://wa.me/88${o.phone}?text=${wa}`}
            target="_blank"
            rel="noopener"
            title="WhatsApp"
            aria-label="WhatsApp"
          >
            <AdminIcon name="wa" className="size-3.5" />
          </a>
          <button
            type="button"
            className={`${ibtn} text-slate-400`}
            title="Copy number"
            aria-label="Copy number"
            onClick={() => copy(o.phone)}
          >
            <AdminIcon name="copy" className="size-3.5" />
          </button>
        </div>
        <div className="mt-1 flex items-start gap-1 text-xs text-slate-400">
          <AdminIcon name="pin" className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">
            {o.address}, {o.district}
          </span>
        </div>
      </td>

      <td className="min-w-64 py-3">
        <div className="space-y-1.5">
          {o.items.map((i, n) => (
            <div key={n} className="flex items-center gap-2">
              {i.image ? (
                <img
                  src={i.image}
                  alt=""
                  className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-ink-600"
                />
              ) : (
                <span className="size-9 shrink-0 rounded-lg bg-ink-800" />
              )}
              <div className="min-w-0 text-xs">
                <div className="line-clamp-1 font-medium text-slate-200">
                  {i.name}
                  {i.variantTitle ? (
                    <span className="text-slate-500"> ({i.variantTitle})</span>
                  ) : null}
                </div>
                <div className="text-slate-500 tabular-nums">
                  {i.quantity} × {tk(i.unitPrice)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-lg bg-ink-800/60 px-2.5 py-1.5">
          <div className="text-base font-extrabold text-fg tabular-nums">{tk(o.total)}</div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {o.insideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'} {tk(o.delivery)}
            {o.discount ? ` · Discount −${tk(o.discount)}` : ''}
          </div>
          {o.advance ? (
            <div className="text-[11px] font-semibold text-emerald-600 tabular-nums">
              Advance {tk(o.advance)} · collect {tk(o.due)}
            </div>
          ) : null}
        </div>
      </td>

      <td className="min-w-48 py-3">
        {manage ? (
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[o.status]}`}
            onClick={(e) => onStatusMenu(e.currentTarget)}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {ORDER_STATUS_LABELS[o.status]} ▾
          </button>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[o.status]}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {ORDER_STATUS_LABELS[o.status]}
          </span>
        )}
        {manage && TO_CONFIRM_STATUSES.includes(o.status) ? (
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/30 hover:bg-emerald-600 hover:text-white disabled:opacity-50 dark:text-emerald-400"
              disabled={o.blocked}
              onClick={() => onStatus('confirmed')}
            >
              <AdminIcon name="check" className="size-3.5" /> Confirm
            </button>
            {o.status !== 'no_answer' ? (
              <button
                type="button"
                className={`${ibtn} text-slate-400`}
                title="Call not received"
                onClick={() => onStatus('no_answer')}
              >
                <AdminIcon name="phone" className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              className={`${ibtn} text-slate-400`}
              title="Follow up later"
              onClick={() => onStatus('follow_up')}
            >
              <AdminIcon name="clock" className="size-3.5" />
            </button>
          </div>
        ) : manage && o.status === 'confirmed' ? (
          <button
            type="button"
            className="admin-btn-secondary mt-2 h-7 px-2.5 text-xs"
            onClick={() => onStatus('ready')}
          >
            <AdminIcon name="box" className="size-3.5" /> Ready for delivery
          </button>
        ) : null}
        <div className="mt-2 flex items-center gap-2 text-xs">
          {o.handledBy ? (
            <>
              <Avatar name={o.handledBy.name} />
              <span title={`${o.handledBy.text} · ${clock(o.handledBy.at)}`}>
                <b className="text-slate-200">{o.handledBy.name}</b>
                <br />
                <span className="text-slate-500">{ago(o.handledBy.at)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="grid size-[22px] place-items-center rounded-full border border-dashed border-slate-500 text-[10px] text-slate-500">
                ?
              </span>
              <span className="text-slate-500">Not handled yet</span>
            </>
          )}
        </div>
        {o.assignedTo ? (
          <div className="mt-1 text-[11px] text-slate-500">Team: {o.assignedTo.name}</div>
        ) : null}
      </td>

      <td className="min-w-48 py-3">
        {o.courier ? (
          <div className="space-y-0.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
              <i
                className="size-2 rounded-full"
                style={{
                  background:
                    o.courier.service === 'steadfast'
                      ? '#0E9F6E'
                      : o.courier.service === 'pathao'
                        ? '#E5322D'
                        : '#5E6470',
                }}
              />
              {o.courier.name}
            </span>
            {o.courier.consignmentId ? (
              <div className="flex items-center gap-1 tabular-nums text-slate-300">
                CN {o.courier.consignmentId}
                <button
                  type="button"
                  className="text-slate-500 hover:text-fg"
                  aria-label="Copy CN"
                  onClick={() => copy(o.courier!.consignmentId!)}
                >
                  <AdminIcon name="copy" className="size-3" />
                </button>
              </div>
            ) : null}
            {o.courier.trackingCode ? (
              <div className="text-slate-500 tabular-nums">Track: {o.courier.trackingCode}</div>
            ) : null}
            {o.courier.status ? (
              <button
                type="button"
                className="text-[11px] text-violet-500 hover:underline"
                title="Check the courier status now"
                onClick={onSync}
              >
                {o.courier.status.replace(/_/g, ' ')} · refresh
              </button>
            ) : null}
          </div>
        ) : !OPEN.includes(o.status) ? (
          <span className="text-xs text-slate-500">Not sent</span>
        ) : manage ? (
          <button
            type="button"
            className="admin-btn-secondary h-7 px-2.5 text-xs"
            disabled={o.blocked}
            title={o.blocked ? 'Customer is blocked' : undefined}
            onClick={onCourier}
          >
            <AdminIcon name="truck" className="size-3.5" /> Assign courier
          </button>
        ) : null}
        <div className="my-2 h-px bg-ink-700" />
        {checking ? (
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className="size-3.5 animate-spin rounded-full border-2 border-ink-600 border-t-blue-500" />{' '}
            Checking 4 couriers…
          </span>
        ) : !check ? (
          fraudEnabled ? (
            <button
              type="button"
              className="admin-btn-secondary h-7 px-2.5 text-xs"
              onClick={onFraudQuick}
            >
              <AdminIcon name="shield" className="size-3.5" /> Check courier
            </button>
          ) : (
            <span className="text-xs text-slate-500">Fraud check not set up</span>
          )
        ) : (
          <button
            type="button"
            className="w-full text-left"
            title={`${check.successParcels} delivered · ${check.cancelledParcels} returned · click for full report`}
            onClick={onFraud}
          >
            <span className="flex items-center gap-1.5 text-xs">
              <b className="tabular-nums" style={{ color: LV[level!][1] }}>
                {level === 'new' ? 'New' : `${check.successRatio}%`}
              </b>
              <span
                className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{
                  color: LV[level!][1],
                  background: `color-mix(in srgb, ${LV[level!][1]} 12%, transparent)`,
                }}
              >
                {level === 'new' ? 'No history' : LV[level!][0]}
              </span>
              {level !== 'new' ? (
                <span className="text-slate-500 tabular-nums">
                  {check.successParcels}/{check.totalParcels}
                </span>
              ) : null}
            </span>
            {level !== 'new' ? (
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-ink-700">
                <i
                  className="block h-full"
                  style={{ width: `${check.successRatio ?? 0}%`, background: LV[level!][1] }}
                />
              </span>
            ) : null}
          </button>
        )}
      </td>

      <td className="min-w-52 py-3">
        <button
          type="button"
          className={`w-full rounded-lg px-2 py-1.5 text-left text-xs ring-1 transition hover:bg-ink-800 ${o.notes.last ? 'ring-ink-600' : 'ring-dashed ring-ink-600 text-slate-500'}`}
          onClick={onNote}
        >
          {o.notes.last ? (
            <>
              <span className="line-clamp-2 text-slate-200">{o.notes.last.body}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="flex -space-x-1.5">
                  {o.notes.authors.slice(0, 4).map((a) => (
                    <Avatar key={a} name={a} size={18} />
                  ))}
                </span>
                {o.notes.authors.join(', ')}
                {o.notes.count > 1 ? ` · ${o.notes.count} notes` : ''}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <AdminIcon name="note" className="size-3.5" /> Add note
            </span>
          )}
        </button>
        {o.customerNote ? (
          <p
            className="mt-1.5 flex items-start gap-1 text-[11px] text-amber-600"
            title="Customer's note"
          >
            <AdminIcon name="message" className="mt-0.5 size-3 shrink-0" /> {o.customerNote}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
