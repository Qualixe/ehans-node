import {
  type AdminOrderDetail,
  canManage,
  ORDER_CHANNEL_INFO,
  ORDER_COURIERS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  SHIPPING_ZONES,
  type ShippingZone,
  POS_PAYMENT_METHODS,
} from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { FraudCheck } from '@/components/admin/fraud-check';
import { AdminIcon } from '@/components/admin/icon';
import { PageHeader, StatusBadge } from '@/components/admin/ui';
import { ApiError } from '@/lib/api-client';
import { money } from '@/lib/admin/format';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { updateOrder } from '../actions';

export async function generateMetadata({
  params,
}: PageProps<'/admin/orders/[number]'>): Promise<Metadata> {
  return { title: `Order ${(await params).number}` };
}

const PAYMENT: Record<string, string> = POS_PAYMENT_METHODS;
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "November 23, 2026 at 6:42 pm" in Dhaka (glowy 'F j, Y \a\t g:i a') */
const placed = (iso: string) =>
  new Date(iso)
    .toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(', ', ' ')
    .replace(/, (\d)/, ' at $1')
    .replace(/ (AM|PM)$/, (m) => m.toLowerCase());

/** glowy admin/orders/show */
export default async function OrderPage({
  params,
  searchParams,
}: PageProps<'/admin/orders/[number]'>) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const offerReceipt = sp.receipt === '1';
  if (!/^[A-Z]{2}\d{6}[A-Z0-9]{5}$/.test(number)) notFound();
  let order: AdminOrderDetail;
  const user = await getCurrentAdmin();
  try {
    order = await adminApi<AdminOrderDetail>(`/orders/${number}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const manage = canManage(user, 'orders');
  const phone = order.phone.replace(/\D/g, '').replace(/^88(?=01)/, '');
  const zone =
    SHIPPING_ZONES[order.shippingZone as ShippingZone]?.label ??
    label(order.shippingZone.replace(/_/g, ' '));

  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <PageHeader
        title={`Order ${order.number}`}
        description={`Placed ${placed(order.createdAt)} · ${ORDER_CHANNEL_INFO[order.channel].label}`}
      >
        <StatusBadge status={order.status} />
        <a
          href={`/admin/invoice/${order.number}`}
          target="_blank"
          rel="noopener"
          className="admin-btn-secondary"
        >
          <AdminIcon name="printer" className="size-4" /> Invoice
        </a>
      </PageHeader>

      {offerReceipt ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          <span>In-store sale completed. Print a receipt for the customer?</span>
          <a
            href={`/admin/invoice/${order.number}`}
            target="_blank"
            rel="noopener"
            className="admin-btn-primary"
          >
            <AdminIcon name="printer" className="size-4" /> Print receipt
          </a>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <section className="admin-card overflow-hidden">
            <h2 className="border-b border-ink-600 px-6 py-4 font-bold text-fg">Items</h2>
            <ul className="divide-y divide-ink-700">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-ink-800 text-slate-500">
                      <AdminIcon name="image" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}/edit`} className="admin-link">
                        {item.name}
                      </Link>
                    ) : (
                      <p className="font-medium text-slate-200">
                        {item.name} <span className="text-xs text-slate-500">(deleted)</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {item.variantTitle ? `${item.variantTitle} · ` : ''}
                      {money(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-fg">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-ink-600 px-6 py-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-slate-400">
                  <dt>
                    Discount
                    {order.couponCode ? (
                      <span className="ml-1 rounded bg-ink-700 px-1.5 py-0.5 font-mono text-xs">
                        {order.couponCode}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="text-emerald-400">−{money(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-400">
                <dt>Shipping</dt>
                <dd>{order.shippingFee > 0 ? money(order.shippingFee) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-700 pt-2 text-base font-bold text-fg">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </section>

          {order.note ? (
            <section className="admin-card p-6">
              <h2 className="font-bold text-fg">Customer note</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-slate-300">{order.note}</p>
            </section>
          ) : null}
        </div>

        <div className="space-y-6 xl:col-span-4">
          <form action={updateOrder.bind(null, order.number)} className="admin-card space-y-4 p-6">
            <h2 className="font-bold text-fg">Fulfilment</h2>
            <fieldset disabled={!manage} className="space-y-4">
              <div>
                <label htmlFor="status" className="admin-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="admin-input"
                  defaultValue={order.status}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Cancelling or returning puts the items back in stock.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="courier" className="admin-label">
                    Courier
                  </label>
                  <input
                    id="courier"
                    name="courier"
                    list="couriers"
                    maxLength={100}
                    defaultValue={order.courier ?? ''}
                    className="admin-input"
                  />
                  <datalist id="couriers">
                    {ORDER_COURIERS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="trackingNumber" className="admin-label">
                    Tracking #
                  </label>
                  <input
                    id="trackingNumber"
                    name="trackingNumber"
                    maxLength={100}
                    defaultValue={order.trackingNumber ?? ''}
                    className="admin-input"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="adminNote" className="admin-label">
                  Internal note
                </label>
                <textarea
                  id="adminNote"
                  name="adminNote"
                  rows={3}
                  maxLength={2000}
                  className="admin-input"
                  placeholder="Only visible to staff"
                  defaultValue={order.adminNote ?? ''}
                />
              </div>
              {manage ? (
                <button type="submit" className="admin-btn-primary w-full">
                  Save changes
                </button>
              ) : null}
            </fieldset>
          </form>

          <section className="admin-card p-6">
            <h2 className="mb-3 font-bold text-fg">Fraud check</h2>
            <FraudCheck
              number={order.number}
              check={order.fraudCheck}
              enabled={order.fraudEnabled}
              manage={manage}
              open
            />
          </section>

          <section className="admin-card p-6">
            <h2 className="font-bold text-fg">Customer</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Name</dt>
                <dd className="text-slate-200">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="flex items-center gap-2 text-slate-200">
                  {order.phone}
                  <a href={`tel:${phone}`} className="admin-link text-xs">
                    Call
                  </a>
                  <a
                    href={`https://wa.me/88${phone}`}
                    target="_blank"
                    rel="noopener"
                    className="admin-link text-xs"
                  >
                    WhatsApp
                  </a>
                </dd>
              </div>
              {order.email ? (
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd>
                    <a href={`mailto:${order.email}`} className="admin-link">
                      {order.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-slate-500">Delivery address</dt>
                <dd className="text-slate-200">
                  {order.address}, {order.city}
                </dd>
              </div>
              {order.ipAddress ? (
                <div>
                  <dt className="text-xs text-slate-500">IP address</dt>
                  <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-200">
                    <span className="font-mono text-sm">{order.ipAddress}</span>
                    {order.sameIpOrderCount > 1 ? (
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(order.ipAddress)}`}
                        className="admin-link text-xs"
                      >
                        {order.sameIpOrderCount} orders from this IP
                      </Link>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-slate-500">Zone · Payment</dt>
                <dd className="text-slate-200">
                  {zone} · {PAYMENT[order.paymentMethod] ?? order.paymentMethod}
                </dd>
              </div>
            </dl>
            <Link
              href={`/admin/customers/${encodeURIComponent(order.phone)}`}
              className="admin-btn-secondary mt-4 w-full"
            >
              View customer ({order.customerOrderCount})
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
