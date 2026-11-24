'use client';

import {
  type CustomerHint,
  DISTRICTS,
  ORDER_PAYMENTS,
  ORDER_SOURCES,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatusName,
  type PanelOrderDetail,
  type PanelStaff,
  type PosCatalog,
  SHIPPING_ZONES,
  districtByKey,
} from '@ehans/shared';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  customerHint,
  panelProducts,
  savePanelOrder,
} from '@/app/admin/(panel)/orders/panel-actions';
import { AdminIcon } from '../icon';
import { clock, Modal, tk, useToast } from './panel-ui';

export interface FormLine {
  productId: string;
  variantId: string | null;
  name: string;
  variantTitle: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stock?: number;
}

export interface FormSeed {
  customerName: string;
  phone: string;
  altPhone: string;
  address: string;
  district: string;
  status: OrderStatusName;
  assignedToId: string;
  source: string;
  payment: string;
  items: FormLine[];
  delivery: number;
  discount: number;
  advance: number;
  recoveredFromId?: string | null;
}

const SORTED = [...DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
const FEE = { inside: SHIPPING_ZONES.inside_dhaka.fee, outside: SHIPPING_ZONES.outside_dhaka.fee };
export const feeFor = (district: string) =>
  districtByKey(district)?.zone === 'inside_dhaka' ? FEE.inside : FEE.outside;

export function seedFromOrder(o: PanelOrderDetail): FormSeed {
  return {
    customerName: o.customerName,
    phone: o.phone,
    altPhone: o.altPhone ?? '',
    address: o.address,
    district: o.districtKey ?? 'dhaka',
    status: o.status,
    assignedToId: o.assignedTo?.id ?? '',
    source: o.source,
    payment: o.payment === 'cod' ? 'Cash on delivery' : o.payment,
    items: o.items
      .filter((i) => i.productId)
      .map((i) => ({
        productId: i.productId!,
        variantId: i.variantId,
        name: i.name,
        variantTitle: i.variantTitle,
        image: i.image,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    delivery: o.delivery,
    discount: o.discount,
    advance: o.advance,
  };
}

export const emptySeed = (over: Partial<FormSeed> = {}): FormSeed => ({
  customerName: '',
  phone: '',
  altPhone: '',
  address: '',
  district: 'dhaka',
  status: 'confirmed',
  assignedToId: '',
  source: 'Phone call',
  payment: 'Cash on delivery',
  items: [],
  delivery: FEE.inside,
  discount: 0,
  advance: 0,
  ...over,
});

/** The demo's "Edit order" / "New order" popup. */
export function OrderFormModal({
  number,
  seed,
  detail,
  staff,
  onClose,
  onSaved,
}: {
  /** null = new order */
  number: string | null;
  seed: FormSeed;
  detail?: PanelOrderDetail | null;
  staff: PanelStaff[];
  onClose: () => void;
  onSaved: (number: string) => void;
}) {
  const toast = useToast();
  const [f, setF] = useState<FormSeed>(seed);
  const [note, setNote] = useState('');
  const [catalog, setCatalog] = useState<PosCatalog | null>(null);
  const [adding, setAdding] = useState('');
  const [hint, setHint] = useState<CustomerHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    void panelProducts().then((r) => r.ok && setCatalog(r.data));
  }, []);

  // under the phone: blocked / returning / new (demo custHint)
  const phoneOk = /^01\d{9}$/.test(f.phone);
  useEffect(() => {
    if (!phoneOk) return;
    const t = window.setTimeout(() => {
      void customerHint(f.phone, number ?? undefined).then((r) => setHint(r.ok ? r.data : null));
    }, 300);
    return () => window.clearTimeout(t);
  }, [f.phone, phoneOk, number]);

  const set = <K extends keyof FormSeed>(k: K, v: FormSeed[K]) => setF((s) => ({ ...s, [k]: v }));
  const sub = f.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, sub + f.delivery - f.discount);
  const due = Math.max(0, total - f.advance);
  const qty = f.items.reduce((n, i) => n + i.quantity, 0);

  const options = useMemo(
    () =>
      (catalog?.products ?? []).flatMap((p): { key: string; label: string; line: FormLine }[] =>
        p.variants.length
          ? p.variants.map((v) => ({
              key: `${p.id}:${v.id}`,
              label: `${p.name} (${v.title}) · ${tk(v.price)}${v.stock <= 0 ? ' (out of stock)' : ''}`,
              line: {
                productId: p.id,
                variantId: v.id,
                name: p.name,
                variantTitle: v.title,
                image: p.image,
                unitPrice: v.price,
                quantity: 1,
                stock: v.stock,
              },
            }))
          : [
              {
                key: `${p.id}:`,
                label: `${p.name} · ${tk(p.price)}${p.stock <= 0 ? ' (out of stock)' : ''}`,
                line: {
                  productId: p.id,
                  variantId: null,
                  name: p.name,
                  variantTitle: null,
                  image: p.image,
                  unitPrice: p.price,
                  quantity: 1,
                  stock: p.stock,
                },
              },
            ],
      ),
    [catalog],
  );
  const stockOf = (l: FormLine) => {
    const p = catalog?.products.find((x) => x.id === l.productId);
    return l.variantId ? p?.variants.find((v) => v.id === l.variantId)?.stock : p?.stock;
  };

  const addLine = () => {
    const opt = options.find((o) => o.key === adding);
    if (!opt) return;
    setF((s) => {
      const ex = s.items.find(
        (i) => i.productId === opt.line.productId && i.variantId === opt.line.variantId,
      );
      return {
        ...s,
        items: ex
          ? s.items.map((i) => (i === ex ? { ...i, quantity: i.quantity + 1 } : i))
          : [...s.items, opt.line],
      };
    });
    setAdding('');
  };

  const save = () => {
    if (!f.customerName.trim() || !phoneOk || !f.address.trim()) {
      toast('Name, a valid 11-digit mobile number and address are required');
      return;
    }
    if (!f.items.length) {
      toast('Add at least one product');
      return;
    }
    setError(null);
    start(async () => {
      const r = await savePanelOrder(number, {
        customerName: f.customerName,
        phone: f.phone,
        altPhone: f.altPhone || null,
        address: f.address,
        district: f.district,
        status: f.status,
        assignedToId: f.assignedToId || null,
        source: f.source,
        payment: f.payment,
        items: f.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        delivery: f.delivery,
        discount: f.discount,
        advance: f.advance,
        note: note || null,
        recoveredFromId: f.recoveredFromId ?? null,
      });
      if (!r.ok) return setError(r.error);
      toast(number ? `Order #${number} saved` : `Order #${r.data.number} created`);
      onSaved(r.data.number);
    });
  };

  const input = 'admin-input';
  const lbl = 'flex flex-col gap-1.5 text-xs font-semibold text-slate-400';
  const panel = 'flex flex-col gap-3 rounded-xl p-4 ring-1 ring-ink-600';
  const h4 = 'flex items-center gap-2 text-sm font-bold text-fg';
  const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/\D/g, '')) || 0));

  return (
    <Modal
      size="wide"
      title={
        number
          ? `Edit order #${number}`
          : seed.recoveredFromId
            ? 'Recover incomplete checkout'
            : 'New order'
      }
      subtitle={
        detail
          ? `Placed ${clock(detail.createdAt)} · ${detail.source}`
          : 'Fill the customer details and products'
      }
      onClose={onClose}
      footer={
        <>
          {number ? (
            <a
              href={`/admin/invoice/${number}`}
              target="_blank"
              rel="noopener"
              className="admin-btn-secondary"
            >
              <AdminIcon name="printer" className="size-4" /> Invoice
            </a>
          ) : null}
          <span className="flex-1"></span>
          {error ? <span className="max-w-md text-sm text-rose-500">{error}</span> : null}
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="admin-btn-primary" disabled={pending} onClick={save}>
            <AdminIcon name="check" className="size-4" />{' '}
            {pending ? 'Saving…' : number ? 'Save changes' : 'Create order'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <section className={panel}>
            <h4 className={h4}>
              <AdminIcon name="users" className="size-4" /> Customer
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <label className={lbl}>
                Full name
                <input
                  className={input}
                  value={f.customerName}
                  maxLength={100}
                  onChange={(e) => set('customerName', e.target.value)}
                />
              </label>
              <label className={lbl}>
                Mobile number
                <input
                  className={input}
                  value={f.phone}
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <label className={lbl}>
                Alternative number
                <input
                  className={input}
                  value={f.altPhone}
                  inputMode="numeric"
                  maxLength={11}
                  onChange={(e) => set('altPhone', e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <label className={lbl}>
                District
                <select
                  className={input}
                  value={f.district}
                  onChange={(e) =>
                    setF((s) => ({
                      ...s,
                      district: e.target.value,
                      delivery: feeFor(e.target.value),
                    }))
                  }
                >
                  {SORTED.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={lbl}>
              Full address
              <textarea
                className={input}
                rows={2}
                maxLength={500}
                value={f.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </label>
            <CustomerHintLine phone={f.phone} hint={phoneOk ? hint : null} />
          </section>

          <section className={panel}>
            <h4 className={h4}>
              <AdminIcon name="bag" className="size-4" /> Order details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <label className={lbl}>
                Status
                <select
                  className={input}
                  value={f.status}
                  onChange={(e) => set('status', e.target.value as OrderStatusName)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={lbl}>
                Team
                <select
                  className={input}
                  value={f.assignedToId}
                  onChange={(e) => set('assignedToId', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={lbl}>
                Order source
                <select
                  className={input}
                  value={f.source}
                  onChange={(e) => set('source', e.target.value)}
                >
                  {ORDER_SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className={lbl}>
                Payment
                <select
                  className={input}
                  value={f.payment}
                  onChange={(e) => set('payment', e.target.value)}
                >
                  {[...new Set([f.payment, ...ORDER_PAYMENTS])].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className={lbl}>
              Add a note for the team
              <textarea
                className={input}
                rows={2}
                maxLength={2000}
                placeholder="Visible in the Note column"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className={panel}>
            <h4 className={h4}>
              <AdminIcon name="box" className="size-4" /> Products
            </h4>
            <table className="w-full text-sm">
              <tbody>
                {f.items.length ? (
                  f.items.map((it, k) => (
                    <tr
                      key={`${it.productId}:${it.variantId ?? ''}`}
                      className="border-b border-ink-700 last:border-0"
                    >
                      <td className="w-11 py-2">
                        {it.image ? (
                          <img src={it.image} alt="" className="size-9 rounded-lg object-cover" />
                        ) : (
                          <span className="block size-9 rounded-lg bg-ink-800" />
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <div className="text-[13px] font-semibold text-fg">
                          {it.name}
                          {it.variantTitle ? (
                            <span className="font-normal text-slate-400"> ({it.variantTitle})</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500">Stock {stockOf(it) ?? '…'}</div>
                      </td>
                      <td className="py-2">
                        <input
                          className="admin-input w-20 px-2 py-1 text-right tabular-nums"
                          inputMode="numeric"
                          aria-label="Unit price"
                          value={it.unitPrice}
                          onChange={(e) =>
                            set(
                              'items',
                              f.items.map((x, i) =>
                                i === k ? { ...x, unitPrice: num(e.target.value) } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="inline-flex items-center rounded-lg ring-1 ring-ink-600">
                          <button
                            type="button"
                            className="px-2 py-1 text-slate-400 hover:text-fg"
                            aria-label="Less"
                            onClick={() =>
                              set(
                                'items',
                                f.items.map((x, i) =>
                                  i === k ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x,
                                ),
                              )
                            }
                          >
                            −
                          </button>
                          <span className="w-7 text-center tabular-nums">{it.quantity}</span>
                          <button
                            type="button"
                            className="px-2 py-1 text-slate-400 hover:text-fg"
                            aria-label="More"
                            onClick={() =>
                              set(
                                'items',
                                f.items.map((x, i) =>
                                  i === k ? { ...x, quantity: Math.min(100, x.quantity + 1) } : x,
                                ),
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 text-right font-bold tabular-nums text-fg">
                        {tk(it.unitPrice * it.quantity)}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-lg text-rose-500 ring-1 ring-ink-600 hover:bg-rose-500/10"
                          aria-label="Remove"
                          onClick={() =>
                            set(
                              'items',
                              f.items.filter((_, i) => i !== k),
                            )
                          }
                        >
                          <AdminIcon name="x" className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 text-sm text-slate-500">No products yet. Add one below.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex gap-2">
              <select
                className="admin-input"
                aria-label="Add a product"
                value={adding}
                onChange={(e) => setAdding(e.target.value)}
              >
                <option value="">{catalog ? 'Add a product…' : 'Loading products…'}</option>
                {options.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={!adding}
                onClick={addLine}
              >
                <AdminIcon name="plus" className="size-4" /> Add
              </button>
            </div>
          </section>

          <section className={panel}>
            <h4 className={h4}>
              <AdminIcon name="cash" className="size-4" /> Payment summary
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Subtotal ({qty} items)</dt>
                <dd className="font-semibold tabular-nums text-fg">{tk(sub)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-slate-400">
                  Delivery
                  <span className="inline-flex rounded-lg bg-ink-800 p-0.5 text-xs">
                    {(['inside', 'outside'] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        className={`rounded-md px-2 py-0.5 font-semibold ${f.delivery === FEE[z] ? 'bg-white text-fg shadow dark:bg-ink-600' : 'text-slate-400'}`}
                        onClick={() => set('delivery', FEE[z])}
                      >
                        {z === 'inside' ? 'Inside Dhaka' : 'Outside'}
                      </button>
                    ))}
                  </span>
                </dt>
                <dd>
                  <input
                    className="admin-input w-24 py-1 text-right tabular-nums"
                    inputMode="numeric"
                    aria-label="Delivery charge"
                    value={f.delivery}
                    onChange={(e) => set('delivery', num(e.target.value))}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Discount</dt>
                <dd>
                  <input
                    className="admin-input w-24 py-1 text-right tabular-nums"
                    inputMode="numeric"
                    aria-label="Discount"
                    value={f.discount}
                    onChange={(e) => set('discount', num(e.target.value))}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Advance paid</dt>
                <dd>
                  <input
                    className="admin-input w-24 py-1 text-right tabular-nums"
                    inputMode="numeric"
                    aria-label="Advance"
                    value={f.advance}
                    onChange={(e) => set('advance', num(e.target.value))}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-ink-600 pt-2 text-base font-extrabold text-fg">
                <dt>Total</dt>
                <dd className="tabular-nums">{tk(total)}</dd>
              </div>
              <div className="flex items-center justify-between font-bold text-blue-600">
                <dt>Cash to collect (COD)</dt>
                <dd className="tabular-nums">{tk(due)}</dd>
              </div>
            </dl>
          </section>

          {detail?.events.length ? (
            <section className={panel}>
              <h4 className={h4}>
                <AdminIcon name="clock" className="size-4" /> Activity
              </h4>
              <ol className="space-y-2.5 border-l border-ink-600 pl-4 text-sm">
                {detail.events.map((e, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-blue-600" />
                    <span className="text-slate-200">{e.text}</span>
                    <span className="block text-xs text-slate-500">{clock(e.at)}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

/** Demo custHint: blocked / returning customer (open orders) / new customer. */
export function CustomerHintLine({ phone, hint }: { phone: string; hint: CustomerHint | null }) {
  const box = 'flex items-start gap-2 rounded-lg px-3 py-2 text-xs';
  if (phone && !/^01\d{9}$/.test(phone)) {
    return (
      <p className={`${box} bg-amber-500/10 text-amber-700 dark:text-amber-400`}>
        <AdminIcon name="alert" className="size-4 shrink-0" /> Mobile number should be 11 digits and
        start with 01.
      </p>
    );
  }
  if (!hint) return null;
  if (hint.blocked) {
    return (
      <p className={`${box} bg-rose-500/10 text-rose-600 dark:text-rose-400`}>
        <AdminIcon name="ban" className="size-4 shrink-0" />
        <span>
          <b>This number is blocked.</b> {hint.blocked.reason}
        </span>
      </p>
    );
  }
  if (hint.previous) {
    return (
      <p className={`${box} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`}>
        <AdminIcon name="clock" className="size-4 shrink-0" />
        <span>
          <b>Returning customer · {hint.previous} previous orders.</b>
          {hint.openOrders.length ? (
            <span className="block text-amber-600">
              {hint.openOrders.length} still open: {hint.openOrders.map((n) => `#${n}`).join(', ')}.
              Check for duplicate.
            </span>
          ) : null}
        </span>
      </p>
    );
  }
  return (
    <p className={`${box} bg-sky-500/10 text-sky-700 dark:text-sky-400`}>
      <AdminIcon name="users" className="size-4 shrink-0" /> New customer. No earlier orders with
      this number.
    </p>
  );
}
