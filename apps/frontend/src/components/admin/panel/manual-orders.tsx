'use client';

import {
  type CustomerHint,
  DISTRICTS,
  ORDER_SOURCES,
  type PanelStaff,
  type PosCatalog,
  type PosProduct,
} from '@ehans/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { customerHint, savePanelOrder } from '@/app/admin/(panel)/orders/panel-actions';
import { AdminIcon } from '../icon';
import { CustomerHintLine, feeFor } from './order-form-modal';
import { tk, ToastProvider, useToast } from './panel-ui';

interface Line {
  productId: string;
  variantId: string | null;
  quantity: number;
}
const RANGES: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '15d': 'Last 15 days',
  '30d': 'Last 30 days',
};
const SORTED = [...DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
const unitOf = (p: PosProduct, variantId: string | null) => {
  const v = variantId ? p.variants.find((x) => x.id === variantId) : undefined;
  return { price: v?.price ?? p.price, stock: Math.min(v?.stock ?? p.stock, 100) };
};

export function ManualOrders(props: {
  catalog: PosCatalog;
  summary: { range: string; orders: number; value: number }[];
  staff: PanelStaff[];
  me: string;
  manage: boolean;
}) {
  return (
    <ToastProvider>
      <Screen {...props} />
    </ToastProvider>
  );
}

/** The demo's POS · Manual order page. */
function Screen({
  catalog,
  summary,
  staff,
  me,
  manage,
}: {
  catalog: PosCatalog;
  summary: { range: string; orders: number; value: number }[];
  staff: PanelStaff[];
  me: string;
  manage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const [cart, setCart] = useState<Line[]>([]);
  const [f, setF] = useState({
    phone: '',
    name: '',
    address: '',
    district: 'dhaka',
    source: 'Phone call',
    discount: 0,
    advance: 0,
    team: me,
    note: '',
  });
  const [hint, setHint] = useState<CustomerHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const byId = useMemo(() => new Map(catalog.products.map((p) => [p.id, p])), [catalog]);

  const phoneOk = /^01\d{9}$/.test(f.phone);
  useEffect(() => {
    if (!phoneOk) return;
    const t = window.setTimeout(
      () => void customerHint(f.phone).then((r) => setHint(r.ok ? r.data : null)),
      300,
    );
    return () => window.clearTimeout(t);
  }, [f.phone, phoneOk]);

  const visible = catalog.products.filter(
    (p) =>
      (!dept || p.department === dept) &&
      (!q.trim() || `${p.name} ${p.sku}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const sub = cart.reduce((n, l) => {
    const p = byId.get(l.productId);
    return p ? n + unitOf(p, l.variantId).price * l.quantity : n;
  }, 0);
  const delivery = feeFor(f.district);
  const total = Math.max(0, sub + delivery - f.discount);
  const due = Math.max(0, total - f.advance);
  const count = cart.reduce((n, l) => n + l.quantity, 0);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/\D/g, '')) || 0));

  const add = (p: PosProduct) => {
    const variant = p.variants.find((v) => v.stock > 0) ?? null;
    if (p.variants.length && !variant) return;
    const variantId = variant?.id ?? null;
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id && l.variantId === variantId);
      if (!ex) return [...c, { productId: p.id, variantId, quantity: 1 }];
      return c.map((l) =>
        l === ex ? { ...l, quantity: Math.min(l.quantity + 1, unitOf(p, variantId).stock) } : l,
      );
    });
  };
  const update = (k: number, change: Partial<Line>) =>
    setCart((c) =>
      c.flatMap((l, i) => {
        if (i !== k) return [l];
        const next = { ...l, ...change };
        if (next.quantity < 1) return [];
        const p = byId.get(next.productId);
        return [
          {
            ...next,
            quantity: p ? Math.min(next.quantity, unitOf(p, next.variantId).stock) : next.quantity,
          },
        ];
      }),
    );

  const place = () => {
    if (!f.name.trim() || !phoneOk || !f.address.trim())
      return toast("Add the customer's name, an 11-digit mobile number and address");
    if (hint?.blocked) return toast('This number is on the block list. Unblock it first.');
    setError(null);
    start(async () => {
      const r = await savePanelOrder(null, {
        customerName: f.name,
        phone: f.phone,
        address: f.address,
        district: f.district,
        status: 'confirmed',
        assignedToId: f.team || null,
        source: f.source,
        payment: f.advance ? 'bKash advance + COD' : 'Cash on delivery',
        items: cart.map((l) => ({
          ...l,
          unitPrice: unitOf(byId.get(l.productId)!, l.variantId).price,
        })),
        delivery,
        discount: f.discount,
        advance: f.advance,
        note: f.note || null,
      });
      if (!r.ok) return setError(r.error);
      toast(`Order #${r.data.number} placed and confirmed`);
      setCart([]);
      setF((s) => ({ ...s, phone: '', name: '', address: '', discount: 0, advance: 0, note: '' }));
      router.push('/admin/orders?source=manual');
    });
  };

  const lbl = 'flex flex-col gap-1.5 text-xs font-semibold text-slate-400';
  const chip = (on: boolean) =>
    `h-8 shrink-0 rounded-full px-3.5 text-sm font-medium whitespace-nowrap ring-1 transition ${on ? 'bg-blue-600 text-white ring-blue-600' : 'text-slate-300 ring-ink-600 hover:text-fg'}`;

  return (
    <>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[28px]">
          Manual orders
        </h1>
        <span className="text-sm text-slate-400">
          Orders added by the team from calls, Facebook, WhatsApp and POS
        </span>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {summary.map((s) => (
          <Link
            key={s.range}
            href={`/admin/orders?source=manual&date=${s.range}`}
            className="admin-card flex flex-col gap-0.5 p-4 transition hover:ring-blue-500/50"
            title="See these manual orders"
          >
            <span className="text-xs text-slate-500">{RANGES[s.range]}</span>
            <b className="text-xl text-fg tabular-nums">
              {s.orders}{' '}
              <span className="text-sm font-medium text-slate-400">
                {s.orders === 1 ? 'order' : 'orders'}
              </span>
            </b>
            <span className="text-sm text-slate-400 tabular-nums">{tk(s.value)}</span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <section className="xl:col-span-7 2xl:col-span-8">
          <div className="relative mb-3">
            <AdminIcon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
            />
            <input
              className="admin-input pr-8 pl-9"
              placeholder="Search products"
              aria-label="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q ? (
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-500 hover:text-fg"
                aria-label="Clear search"
                onClick={() => setQ('')}
              >
                <AdminIcon name="x" className="size-4" />
              </button>
            ) : null}
          </div>
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 py-1">
            <button type="button" className={chip(!dept)} onClick={() => setDept('')}>
              All
            </button>
            {catalog.departments.map((d) => (
              <button
                key={d.id}
                type="button"
                className={chip(dept === d.id)}
                onClick={() => setDept(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {visible.length ? (
              visible.map((p) => {
                const stock = p.variants.length
                  ? p.variants.reduce((n, v) => n + Math.max(0, v.stock), 0)
                  : p.stock;
                const inCart = cart
                  .filter((l) => l.productId === p.id)
                  .reduce((n, l) => n + l.quantity, 0);
                const off = p.compareAtPrice
                  ? Math.round((1 - p.price / p.compareAtPrice) * 100)
                  : 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={stock <= 0 || !manage}
                    onClick={() => add(p)}
                    className="admin-card relative flex flex-col overflow-hidden text-left transition hover:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {off ? (
                      <span className="absolute top-2 left-2 z-10 rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        −{off}%
                      </span>
                    ) : null}
                    {inCart ? (
                      <span className="absolute top-2 right-2 z-10 rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {inCart} in cart
                      </span>
                    ) : null}
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <span className="grid aspect-square w-full place-items-center bg-ink-800 text-slate-500">
                        <AdminIcon name="image" />
                      </span>
                    )}
                    <span className="flex flex-1 flex-col gap-1 p-2.5">
                      <span className="line-clamp-2 text-xs font-medium text-slate-200">
                        {p.name}
                      </span>
                      <span className="flex items-baseline gap-1.5">
                        <b className="text-sm text-fg tabular-nums">{tk(p.price)}</b>
                        {p.compareAtPrice ? (
                          <s className="text-xs text-slate-500 tabular-nums">
                            {tk(p.compareAtPrice)}
                          </s>
                        ) : null}
                      </span>
                      <span
                        className={`text-xs ${stock <= 5 ? 'font-semibold text-rose-500' : 'text-slate-500'}`}
                      >
                        {stock <= 0 ? 'Out of stock' : `${stock} in stock`}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="col-span-full py-10 text-center text-sm text-slate-500">
                No product found.
              </p>
            )}
          </div>
        </section>

        <aside className="admin-card flex flex-col overflow-hidden xl:sticky xl:top-[88px] xl:col-span-5 xl:max-h-[calc(100dvh-112px)] 2xl:col-span-4">
          <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
            <div>
              <h2 className="font-bold text-fg">New manual order</h2>
              <p className="text-xs text-slate-500">{count} items</p>
            </div>
            {cart.length ? (
              <button
                type="button"
                className="text-sm text-slate-400 hover:text-rose-500"
                onClick={() => setCart([])}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {cart.length ? (
              <ul className="divide-y divide-ink-700">
                {cart.map((l, k) => {
                  const p = byId.get(l.productId);
                  if (!p) return null;
                  const u = unitOf(p, l.variantId);
                  return (
                    <li key={`${l.productId}:${l.variantId ?? ''}`} className="flex gap-3 py-2.5">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt=""
                          className="size-11 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="size-11 shrink-0 rounded-lg bg-ink-800" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-tight font-semibold text-slate-200">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">{tk(u.price)} each</p>
                        {p.variants.length ? (
                          <select
                            className="admin-input mt-1 py-1 text-xs"
                            aria-label={`Variant of ${p.name}`}
                            value={l.variantId ?? ''}
                            onChange={(e) => update(k, { variantId: e.target.value })}
                          >
                            {p.variants.map((v) => (
                              <option key={v.id} value={v.id} disabled={v.stock < 1}>
                                {v.stock < 1 ? `${v.title} (sold out)` : v.title}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="inline-flex items-center rounded-lg ring-1 ring-ink-600">
                          <button
                            type="button"
                            className="px-2 py-0.5 text-slate-400 hover:text-fg"
                            aria-label="Less"
                            onClick={() => update(k, { quantity: l.quantity - 1 })}
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm tabular-nums">{l.quantity}</span>
                          <button
                            type="button"
                            className="px-2 py-0.5 text-slate-400 hover:text-fg"
                            aria-label="More"
                            onClick={() => update(k, { quantity: l.quantity + 1 })}
                          >
                            +
                          </button>
                        </div>
                        <b className="text-xs tabular-nums">{tk(u.price * l.quantity)}</b>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                <AdminIcon name="bag" className="mx-auto mb-1 size-6" />
                Tap a product to add it
              </div>
            )}
            <fieldset disabled={!manage} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className={lbl}>
                  Mobile number
                  <input
                    className="admin-input"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="01XXXXXXXXX"
                    value={f.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                  />
                </label>
                <label className={lbl}>
                  Customer name
                  <input
                    className="admin-input"
                    maxLength={100}
                    value={f.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </label>
              </div>
              <CustomerHintLine phone={f.phone} hint={phoneOk ? hint : null} />
              <label className={lbl}>
                Address
                <input
                  className="admin-input"
                  maxLength={500}
                  placeholder="House, road, area"
                  value={f.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={lbl}>
                  District
                  <select
                    className="admin-input"
                    value={f.district}
                    onChange={(e) => set('district', e.target.value)}
                  >
                    {SORTED.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={lbl}>
                  Order came from
                  <select
                    className="admin-input"
                    value={f.source}
                    onChange={(e) => set('source', e.target.value)}
                  >
                    {ORDER_SOURCES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className={lbl}>
                  Discount
                  <input
                    className="admin-input tabular-nums"
                    inputMode="numeric"
                    value={f.discount}
                    onChange={(e) => set('discount', num(e.target.value))}
                  />
                </label>
                <label className={lbl}>
                  Advance paid
                  <input
                    className="admin-input tabular-nums"
                    inputMode="numeric"
                    value={f.advance}
                    onChange={(e) => set('advance', num(e.target.value))}
                  />
                </label>
              </div>
              <label className={lbl}>
                Team
                <select
                  className="admin-input"
                  value={f.team}
                  onChange={(e) => set('team', e.target.value)}
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
                Note
                <input
                  className="admin-input"
                  maxLength={2000}
                  placeholder="Optional"
                  value={f.note}
                  onChange={(e) => set('note', e.target.value)}
                />
              </label>
            </fieldset>
            <dl className="space-y-1.5 rounded-xl bg-ink-800/60 p-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{tk(sub)}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Delivery ({delivery === 80 ? 'inside Dhaka' : 'outside Dhaka'})</dt>
                <dd className="tabular-nums">{tk(delivery)}</dd>
              </div>
              {f.discount ? (
                <div className="flex justify-between text-slate-400">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{tk(f.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-ink-600 pt-1.5 text-base font-extrabold text-fg">
                <dt>Total</dt>
                <dd className="tabular-nums">{tk(total)}</dd>
              </div>
              <div className="flex justify-between font-bold text-blue-600">
                <dt>Cash to collect</dt>
                <dd className="tabular-nums">{tk(due)}</dd>
              </div>
            </dl>
            {error ? (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <div className="border-t border-ink-600 p-4">
            {manage ? (
              <button
                type="button"
                className="admin-btn-primary w-full justify-center py-3 text-base"
                disabled={!cart.length || pending}
                onClick={place}
              >
                <AdminIcon name="check" className="size-4" />{' '}
                {pending ? 'Placing…' : `Place order · ${tk(total)}`}
              </button>
            ) : (
              <p className="text-center text-xs text-slate-500">
                You can view manual orders but not place them.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
