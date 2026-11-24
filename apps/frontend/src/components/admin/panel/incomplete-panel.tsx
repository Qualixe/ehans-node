'use client';

import {
  type IncompletePage,
  type IncompleteRow,
  type IncompleteState,
  PANEL_DATE_RANGES,
  type PanelDateRange,
  type PanelStaff,
} from '@ehans/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { incompleteCalled, incompleteDelete } from '@/app/admin/(panel)/orders/panel-actions';
import { AdminIcon } from '../icon';
import { emptySeed, feeFor, OrderFormModal } from './order-form-modal';
import { ConfirmModal } from './order-modals';
import { ago, Avatar, clock, fmtPhone, tk, ToastProvider, useCopy, useToast } from './panel-ui';

const STATE: Record<IncompleteState, [string, string]> = {
  new: ['Not contacted', 'bg-sky-500/10 text-sky-600 dark:text-sky-400'],
  called: ['Called', 'bg-amber-500/10 text-amber-700 dark:text-amber-400'],
  recovered: ['Recovered', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'],
};
const short = (id: string) => id.replace(/-/g, '').slice(-6).toUpperCase();

export function IncompletePanel(props: {
  data: IncompletePage;
  state: IncompleteState | 'all';
  date: PanelDateRange;
  from?: string;
  to?: string;
  staff: PanelStaff[];
  manage: boolean;
}) {
  return (
    <ToastProvider>
      <Panel {...props} />
    </ToastProvider>
  );
}

function Panel({
  data,
  state,
  date,
  from,
  to,
  staff,
  manage,
}: {
  data: IncompletePage;
  state: IncompleteState | 'all';
  date: PanelDateRange;
  from?: string;
  to?: string;
  staff: PanelStaff[];
  manage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const copy = useCopy();
  const [, start] = useTransition();
  const [making, setMaking] = useState<IncompleteRow | null>(null);
  const [deleting, setDeleting] = useState<IncompleteRow | null>(null);

  const go = (change: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { state, date, from, to, ...change };
    for (const [k, v] of Object.entries(next))
      if (v && !(k === 'state' && v === 'all') && !(k === 'date' && v === 'all')) p.set(k, v);
    start(() => router.push(`/admin/orders/incomplete${p.size ? `?${p}` : ''}`));
  };
  const refresh = () => start(() => router.refresh());
  const k = data.kpis;
  const kpis = [
    {
      l: 'Incomplete checkouts',
      v: String(k.total),
      h: `${PANEL_DATE_RANGES[date]} · ${tk(k.cartValue)} in carts`,
      c: '#E5484D',
      i: 'cartx',
    },
    {
      l: 'Not contacted',
      v: String(k.notContacted),
      h: 'Call these first',
      c: '#2F6DB0',
      i: 'phone',
    },
    {
      l: 'Recovered',
      v: String(k.recovered),
      h: `${k.total ? Math.round((k.recovered / k.total) * 100) : 0}% turned into orders · ${tk(k.recoveredValue)}`,
      c: '#22865A',
      i: 'check',
    },
    { l: 'Value at stake', v: tk(k.atStake), h: 'Products left in carts', c: '#A8690F', i: 'cash' },
  ];
  const ibtn = 'grid size-7 place-items-center rounded-lg ring-1 ring-ink-600 hover:bg-ink-800';

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[28px]">
          Incomplete orders
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Shoppers who typed their number in Buy now or checkout but didn&apos;t place the order.
          Call them and make the order.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((x) => (
          <div key={x.l} className="admin-card relative overflow-hidden p-4">
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <nav
          className="flex flex-1 gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-ink-600 dark:bg-ink-900"
          aria-label="State"
        >
          {(
            [
              ['all', 'All'],
              ['new', 'Not contacted'],
              ['called', 'Called'],
              ['recovered', 'Recovered'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => go({ state: key })}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${state === key ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-ink-800 hover:text-fg'}`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${state === key ? 'bg-white/20' : 'bg-ink-800 text-slate-400'}`}
              >
                {data.counts[key]}
              </span>
            </button>
          ))}
        </nav>
        <select
          className="admin-input w-auto"
          aria-label="Date"
          value={date}
          onChange={(e) => go({ date: e.target.value, from: undefined, to: undefined })}
        >
          {Object.entries(PANEL_DATE_RANGES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {date === 'custom' ? (
          <span className="flex items-center gap-1.5">
            <input
              type="date"
              className="admin-input w-auto"
              aria-label="From date"
              defaultValue={from}
              onChange={(e) => go({ from: e.target.value || undefined })}
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              className="admin-input w-auto"
              aria-label="To date"
              defaultValue={to}
              onChange={(e) => go({ to: e.target.value || undefined })}
            />
          </span>
        ) : null}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Checkout</th>
                <th>Customer</th>
                <th>Cart</th>
                <th>Value</th>
                <th>Stopped at</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length ? (
                data.items.map((i) => (
                  <tr key={i.id} className="align-top">
                    <td className="py-3">
                      <div className="font-mono font-bold text-fg">#{short(i.id)}</div>
                      <div className="text-xs text-slate-500" title={clock(i.createdAt)}>
                        {ago(i.createdAt)}
                      </div>
                    </td>
                    <td className="min-w-56 py-3">
                      <div className="flex flex-wrap items-center gap-1.5 font-bold text-fg">
                        {i.name ?? (
                          <span className="font-medium text-slate-500">
                            {i.pastName ? (
                              <>
                                {i.pastName} <span className="text-xs">(from past order)</span>
                              </>
                            ) : (
                              'Name not given'
                            )}
                          </span>
                        )}
                        {i.pastOrders ? (
                          <Link
                            href={`/admin/customers/${i.phone}`}
                            className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-sky-600"
                            title="Ordered before · see past orders"
                          >
                            <AdminIcon name="clock" className="size-3" />
                            {i.pastOrders}
                          </Link>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-medium tabular-nums text-slate-200">
                          {fmtPhone(i.phone)}
                        </span>
                        <a
                          className={`${ibtn} text-sky-500`}
                          href={`tel:+88${i.phone}`}
                          title="Call"
                          aria-label="Call"
                        >
                          <AdminIcon name="phone" className="size-3.5" />
                        </a>
                        <a
                          className={`${ibtn} text-green-600`}
                          href={`https://wa.me/88${i.phone}?text=${encodeURIComponent('আসসালামু আলাইকুম, Ehans Mart থেকে বলছি। আপনার অর্ডারটি সম্পূর্ণ হয়নি, আমরা কি সাহায্য করতে পারি?')}`}
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
                          title="Copy"
                          aria-label="Copy number"
                          onClick={() => copy(i.phone)}
                        >
                          <AdminIcon name="copy" className="size-3.5" />
                        </button>
                      </div>
                      <div className="mt-1 flex items-start gap-1 text-xs text-slate-400">
                        {i.address ? (
                          <>
                            <AdminIcon name="pin" className="mt-0.5 size-3 shrink-0" />
                            {i.address}
                          </>
                        ) : (
                          'Address not given'
                        )}
                      </div>
                    </td>
                    <td className="min-w-56 py-3">
                      <div className="space-y-1 text-xs">
                        {i.items.map((x, n) => (
                          <div key={n}>
                            <span className="font-medium text-slate-200">{x.name}</span>
                            {x.variantTitle ? (
                              <span className="text-slate-500"> ({x.variantTitle})</span>
                            ) : null}
                            <div className="text-slate-500 tabular-nums">
                              {x.quantity} × {tk(x.unitPrice)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-base font-extrabold text-fg tabular-nums">
                      {tk(i.value)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                        {i.step}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE[i.state][1]}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {STATE[i.state][0]}
                      </span>
                      {i.handledBy ? (
                        <div
                          className="mt-2 flex items-center gap-2 text-xs"
                          title={`${STATE[i.state][0]} by ${i.handledBy.name} · ${clock(i.handledBy.at)}`}
                        >
                          <Avatar name={i.handledBy.name} />
                          <span>
                            by <b className="text-slate-200">{i.handledBy.name}</b>
                            <br />
                            <span className="text-slate-500">{ago(i.handledBy.at)}</span>
                          </span>
                        </div>
                      ) : null}
                      {i.orderNumber ? (
                        <div className="mt-1 font-mono text-[11px] text-blue-500">
                          #{i.orderNumber}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3">
                      {manage ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {i.state !== 'recovered' ? (
                            <>
                              <button
                                type="button"
                                className="admin-btn-primary h-8 px-3 text-xs"
                                onClick={() => setMaking(i)}
                              >
                                <AdminIcon name="plus" className="size-3.5" /> Make order
                              </button>
                              {i.state === 'new' ? (
                                <button
                                  type="button"
                                  className="admin-btn-secondary h-8 px-3 text-xs"
                                  onClick={async () => {
                                    const r = await incompleteCalled(i.id);
                                    toast(r.ok ? 'Marked as called' : r.error);
                                    if (r.ok) refresh();
                                  }}
                                >
                                  <AdminIcon name="phone" className="size-3.5" /> Mark called
                                </button>
                              ) : null}
                            </>
                          ) : null}
                          <button
                            type="button"
                            className={`${ibtn} text-rose-500`}
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => setDeleting(i)}
                          >
                            <AdminIcon name="trash" className="size-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    Nothing here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {making ? (
        <OrderFormModal
          number={null}
          staff={staff}
          seed={emptySeed({
            customerName: making.name ?? making.pastName ?? '',
            phone: making.phone,
            address: making.address ?? '',
            district: making.district ?? 'dhaka',
            delivery: feeFor(making.district ?? 'dhaka'),
            source: 'Phone call',
            status: 'confirmed',
            recoveredFromId: making.id,
            items: making.items.map((x) => ({
              productId: x.productId,
              variantId: x.variantId,
              name: x.name,
              variantTitle: x.variantTitle,
              image: x.image ?? null,
              unitPrice: x.unitPrice,
              quantity: x.quantity,
            })),
          })}
          onClose={() => setMaking(null)}
          onSaved={(number) => {
            setMaking(null);
            toast(`Order #${number} created from the incomplete checkout`);
            refresh();
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmModal
          title="Delete this incomplete checkout?"
          text={`${deleting.name ?? fmtPhone(deleting.phone)} · ${tk(deleting.value)}. This removes the saved details for good.`}
          confirm="Delete"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            const r = await incompleteDelete(deleting.id);
            toast(r.ok ? 'Deleted' : r.error);
            setDeleting(null);
            if (r.ok) refresh();
          }}
        />
      ) : null}
    </>
  );
}
