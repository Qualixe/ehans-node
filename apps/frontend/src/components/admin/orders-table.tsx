'use client';

import {
  type AdminOrderRow,
  ORDER_CHANNEL_INFO,
  ORDER_STATUSES,
  type OrderStatusName,
  STOCK_RELEASING_STATUSES,
} from '@ehans/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { bulkOrderStatus, saveOrderNote, setOrderStatus } from '@/app/admin/(panel)/orders/actions';
import { money, timeAgo } from '@/lib/admin/format';
import { AdminIcon } from './icon';
import { STATUS_BADGES } from './ui';

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const digits = (phone: string) => phone.replace(/\D/g, '').replace(/^88(?=01)/, '');
/** "2026-11-23 06:42 PM" in Dhaka, like glowy's created_at->format('Y-m-d h:i A') */
const stamp = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 6 * 3600_000);
  const h = d.getUTCHours();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(h % 12 || 12)}:${pad(d.getUTCMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
};
const PAYMENT: Record<string, string> = { cod: 'Cash on delivery', bkash: 'bKash' };

/** glowy admin/orders/index table: bulk status, status popup, inline notes. */
export function OrdersTable({ orders, manage }: { orders: AdminOrderRow[]; manage: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatusName | ''>('');
  const [editing, setEditing] = useState<AdminOrderRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const allChecked = orders.length > 0 && orders.every((o) => selected.has(o.number));

  const toggle = (number: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });

  const applyBulk = () => {
    if (!bulkStatus || !selected.size) return;
    setError(null);
    start(async () => {
      const result = await bulkOrderStatus([...selected], bulkStatus);
      if (!result.ok) return setError(result.error);
      setSelected(new Set());
      setBulkStatus('');
      router.refresh();
    });
  };

  return (
    <>
      {manage && selected.size ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-600 bg-blue-500/10 px-4 py-2.5 text-sm">
          <span className="font-semibold text-fg">{selected.size} selected</span>
          <select
            className="admin-input h-9 w-44 py-1"
            aria-label="Change status to"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatusName)}
          >
            <option value="">Change status to…</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn-primary h-9"
            disabled={!bulkStatus || pending}
            onClick={applyBulk}
          >
            {pending ? 'Applying…' : 'Apply'}
          </button>
          {error ? <span className="text-rose-400">{error}</span> : null}
          <button
            type="button"
            className="ml-auto text-slate-400 hover:text-fg"
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="admin-table orders-table">
          <thead>
            <tr>
              {manage ? (
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="size-4 accent-blue-600"
                    aria-label="Select all orders on this page"
                    checked={allChecked}
                    onChange={() =>
                      setSelected(allChecked ? new Set() : new Set(orders.map((o) => o.number)))
                    }
                  />
                </th>
              ) : null}
              <th>Customer info</th>
              <th>Product price &amp; name</th>
              <th>Status</th>
              <th>Order &amp; note</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map((o) => {
                const first = o.items[0];
                const phone = digits(o.phone);
                return (
                  <tr
                    key={o.id}
                    className={`align-top ${o.status === 'cancelled' ? 'bg-rose-500/[0.04]' : ''}`}
                  >
                    {manage ? (
                      <td className="pt-5">
                        <input
                          type="checkbox"
                          className="size-4 accent-blue-600"
                          aria-label={`Select order ${o.number}`}
                          checked={selected.has(o.number)}
                          onChange={() => toggle(o.number)}
                        />
                      </td>
                    ) : null}

                    <td className="min-w-60 py-4">
                      <Link
                        href={`/admin/orders/${o.number}`}
                        className="font-bold text-fg hover:text-blue-400"
                      >
                        {o.customerName}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-300">{o.phone}</p>
                      {o.email ? <p className="text-xs text-slate-400">{o.email}</p> : null}
                      <p className="text-xs text-slate-400">{o.city}</p>
                      {o.ipAddress ? (
                        <p className="text-xs text-slate-500">IP: {o.ipAddress}</p>
                      ) : null}
                      {o.trackingNumber ? (
                        <p className="text-xs text-slate-500">
                          CN: <span className="font-medium text-blue-400">{o.trackingNumber}</span>
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-1.5">
                        <Link
                          href={`/admin/orders/${o.number}`}
                          className="grid size-7 place-items-center rounded-md text-sky-400 ring-1 ring-ink-600 hover:bg-sky-500/10"
                          title="View order"
                        >
                          <AdminIcon name="eye" className="size-3.5" />
                        </Link>
                        <a
                          href={`/admin/invoice/${o.number}`}
                          target="_blank"
                          rel="noopener"
                          className="grid size-7 place-items-center rounded-md text-amber-400 ring-1 ring-ink-600 hover:bg-amber-500/10"
                          title="Print invoice"
                        >
                          <AdminIcon name="printer" className="size-3.5" />
                        </a>
                        <a
                          href={`tel:${phone}`}
                          className="grid size-7 place-items-center rounded-md text-emerald-400 ring-1 ring-ink-600 hover:bg-emerald-500/10"
                          title={`Call ${o.phone}`}
                        >
                          <AdminIcon name="phone" className="size-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/88${phone}`}
                          target="_blank"
                          rel="noopener"
                          className="grid size-7 place-items-center rounded-md text-green-400 ring-1 ring-ink-600 hover:bg-green-500/10"
                          title="WhatsApp"
                        >
                          <AdminIcon name="message" className="size-3.5" />
                        </a>
                      </div>
                    </td>

                    <td className="min-w-52 py-4">
                      <p className="text-base font-extrabold text-fg">{money(o.total)}</p>
                      {first ? (
                        <p className="mt-0.5 text-sm text-slate-300">
                          {first.name}
                          {first.variantTitle ? (
                            <span className="text-slate-500"> ({first.variantTitle})</span>
                          ) : null}
                        </p>
                      ) : null}
                      {o.items.length > 1 ? (
                        <p className="text-xs text-slate-500">
                          + {o.items.length - 1} more{' '}
                          {o.items.length - 1 === 1 ? 'product' : 'products'}
                        </p>
                      ) : null}
                      <span className="mt-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                        Quantity: {o.quantity}
                      </span>
                    </td>

                    <td className="min-w-52 py-4">
                      {manage ? (
                        <button
                          type="button"
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 pl-2.5 text-xs font-bold ring-1 transition hover:brightness-125 ${STATUS_BADGES[o.status]}`}
                          aria-haspopup="dialog"
                          aria-label={`Change status of order ${o.number} (now ${label(o.status)})`}
                          onClick={() => setEditing(o)}
                        >
                          {label(o.status)}
                          <svg
                            className="size-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                          </svg>
                        </button>
                      ) : (
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ring-1 ${STATUS_BADGES[o.status]}`}
                        >
                          {label(o.status)}
                        </span>
                      )}
                      <ul className="mt-2.5 space-y-1.5 text-xs text-slate-400">
                        <li className="flex items-center gap-1.5">
                          <AdminIcon name="clock" className="size-3.5 text-sky-400" /> Placed via{' '}
                          {ORDER_CHANNEL_INFO[o.channel].label}
                        </li>
                        <li className="pl-5 text-[11px] text-slate-500">
                          Updated {timeAgo(o.updatedAt)}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <AdminIcon name="wallet" className="size-3.5 text-slate-500" />{' '}
                          {PAYMENT[o.paymentMethod] ?? o.paymentMethod}
                          {o.paymentStatus === 'paid' ? (
                            <span className="text-emerald-400">· Paid</span>
                          ) : null}
                        </li>
                        {o.courier ? (
                          <li className="flex items-center gap-1.5">
                            <AdminIcon name="truck" className="size-3.5 text-slate-500" />{' '}
                            {o.courier}
                          </li>
                        ) : null}
                      </ul>
                    </td>

                    <td className="min-w-60 py-4">
                      <p className="font-mono text-xs text-slate-300">{stamp(o.createdAt)}</p>
                      <Link
                        href={`/admin/orders/${o.number}`}
                        className="font-mono text-[11px] text-blue-400 hover:underline"
                      >
                        #{o.number}
                      </Link>
                      <div className="mt-2">
                        <OrderNote order={o} manage={manage} />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={manage ? 5 : 4} className="py-14 text-center text-slate-500">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <StatusModal
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

/** glowy's status popup: pick a status; cancelling/returning restocks the items. */
function StatusModal({
  order,
  onClose,
  onSaved,
}: {
  order: AdminOrderRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<OrderStatusName>(order.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const save = () => {
    if (status === order.status) return onClose();
    setError(null);
    start(async () => {
      const result = await setOrderStatus(order.number, status);
      if (result.ok) onSaved();
      else setError(result.error);
    });
  };

  return (
    <dialog
      ref={ref}
      className="m-auto w-[min(480px,calc(100%-32px))] rounded-2xl bg-ink-900 p-0 text-slate-200 shadow-2xl ring-1 ring-ink-600 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-600 px-6 py-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Update order
          </p>
          <h2 className="font-mono text-lg font-bold text-fg">#{order.number}</h2>
        </div>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg"
          aria-label="Close"
          onClick={onClose}
        >
          <AdminIcon name="x" className="size-4" />
        </button>
      </header>
      <div className="space-y-3 px-6 py-5">
        <label htmlFor="modal-status" className="admin-label">
          Order status
        </label>
        <select
          id="modal-status"
          className="admin-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatusName)}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        {STOCK_RELEASING_STATUSES.includes(status) &&
        !STOCK_RELEASING_STATUSES.includes(order.status) ? (
          <p className="text-xs text-amber-400">
            Cancelling or returning puts the items back in stock.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <footer className="flex justify-end gap-2 border-t border-ink-600 px-6 py-4">
        <button type="button" className="admin-btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="admin-btn-primary" disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save status'}
        </button>
      </footer>
    </dialog>
  );
}

/** glowy components/admin/order-note: click to add/edit, Ctrl+Enter saves. */
function OrderNote({ order, manage }: { order: AdminOrderRow; manage: boolean }) {
  const [note, setNote] = useState(order.adminNote ?? '');
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    if (draft === null) return;
    setError(null);
    start(async () => {
      const result = await saveOrderNote(order.number, draft);
      if (!result.ok) return setError(result.error);
      setNote(draft.trim());
      setDraft(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    });
  };

  const customerNote = order.note ? (
    <span className="mt-0.5 shrink-0 text-amber-400" title={`Customer note: ${order.note}`}>
      <AdminIcon name="message" className="size-4" />
      <span className="sr-only">Customer note: {order.note}</span>
    </span>
  ) : null;

  if (draft !== null) {
    return (
      <div className="w-56 max-w-64 space-y-2">
        <label htmlFor={`note-${order.id}`} className="sr-only">
          Internal note for {order.number}
        </label>
        <textarea
          id={`note-${order.id}`}
          rows={3}
          maxLength={2000}
          autoFocus
          className="admin-input text-sm"
          placeholder="e.g. Called customer, deliver after 5pm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
            if (e.key === 'Escape') setDraft(null);
          }}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="admin-btn-primary px-3 py-1 text-xs"
            disabled={pending}
            onClick={save}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-btn-secondary px-3 py-1 text-xs"
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
          <span className="ml-auto hidden text-[11px] text-slate-500 lg:inline">Ctrl+Enter</span>
        </div>
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex w-56 max-w-64 items-start gap-1.5">
      {customerNote}
      {manage ? (
        <button
          type="button"
          className="group min-w-0 flex-1 rounded-lg px-2 py-1 text-left transition hover:bg-ink-800"
          title={note ? 'Edit note' : 'Add an internal note'}
          onClick={() => setDraft(note)}
        >
          {note ? (
            <span className="line-clamp-2 text-sm text-slate-300">{note}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 group-hover:text-blue-400">
              <AdminIcon name="plus" className="size-3.5" /> Add note
            </span>
          )}
        </button>
      ) : note ? (
        <span className="line-clamp-2 px-2 py-1 text-sm text-slate-300">{note}</span>
      ) : null}
      {saved ? (
        <span className="mt-1 shrink-0 text-xs font-medium text-emerald-400">Saved</span>
      ) : null}
    </div>
  );
}
