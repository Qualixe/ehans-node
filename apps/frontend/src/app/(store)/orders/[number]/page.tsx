import type { OrderConfirmation } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { STORE } from '@/lib/store-config';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } };

async function Confirmation({
  params,
  searchParams,
}: Pick<PageProps<'/orders/[number]'>, 'params' | 'searchParams'>) {
  const [{ number }, query] = await Promise.all([params, searchParams]);
  await connection();
  const token = typeof query.t === 'string' ? query.t : '';
  if (!/^EH\d{6}[A-Z0-9]{5}$/.test(number) || !token) notFound();

  let order: OrderConfirmation;
  try {
    order = await apiFetch<OrderConfirmation>(`/orders/${number}?t=${encodeURIComponent(token)}`, {
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }

  return (
    <section className="cart-section order-confirmation">
      <div className="container">
        <div className="order-confirmation-head">
          <span className="buy-now-popup-success-icon" aria-hidden="true">
            ✓
          </span>
          <p className="buy-now-popup-success-subtitle">Order confirmed</p>
          <h1 className="buy-now-popup-success-title">Thank you for your order!</h1>
          <p className="buy-now-popup-success-text">
            We&apos;ve received your order and will call you at <strong>{order.phone}</strong> to
            confirm it shortly.
          </p>
          <p className="buy-now-popup-order-id">
            Order number: <strong>{order.number}</strong>
          </p>
        </div>

        <div className="cart-wrapper">
          <div className="cart-content-wrap">
            <div className="buy-now-popup-card checkout-card">
              <p className="cart-summary-title">Delivery details</p>
              <div className="cart-summary-items">
                <div className="cart-summary-item">
                  <p className="title">Name:</p>
                  <p className="price">{order.customerName}</p>
                </div>
                <div className="cart-summary-item">
                  <p className="title">Phone:</p>
                  <p className="price">{order.phone}</p>
                </div>
                <div className="cart-summary-item">
                  <p className="title">Address:</p>
                  <p className="price">
                    {order.address}
                    {order.city ? `, ${order.city}` : ''}
                  </p>
                </div>
                <div className="cart-summary-item">
                  <p className="title">Payment:</p>
                  <p className="price">
                    {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}
                  </p>
                </div>
                {order.note ? (
                  <div className="cart-summary-item">
                    <p className="title">Note:</p>
                    <p className="price">{order.note}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <aside className="cart-summary" aria-label="Order summary">
            <p className="cart-summary-title">Your order</p>
            <div className="checkout-items">
              {order.items.map((item, i) => (
                <div key={i} className="buy-now-popup-product">
                  <div className="buy-now-popup-product-img">
                    {item.image ? <img src={item.image} alt={item.name} /> : null}
                    <span className="buy-now-popup-qty-badge">{item.quantity}</span>
                  </div>
                  <div className="buy-now-popup-product-info">
                    <p className="buy-now-popup-product-title">
                      {item.name}
                      {item.variantTitle ? ` (${item.variantTitle})` : ''}
                    </p>
                  </div>
                  <p className="buy-now-popup-product-price">{formatPrice(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="cart-summary-items">
              <div className="cart-summary-item">
                <p className="title">Subtotal:</p>
                <p className="price">{formatPrice(order.subtotal)}</p>
              </div>
              {order.discount ? (
                <div className="cart-summary-item">
                  <p className="title">Discount:</p>
                  <p className="price">- {formatPrice(order.discount)}</p>
                </div>
              ) : null}
              <div className="cart-summary-item">
                <p className="title">Shipping:</p>
                <p className="price">
                  {order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}
                </p>
              </div>
              <div className="cart-summary-item summary-total">
                <p className="title">Total:</p>
                <p className="price">{formatPrice(order.total)}</p>
              </div>
            </div>
            <div className="cart-summary-btn">
              <Link href="/collections" className="btn primary-btn">
                continue shopping
              </Link>
            </div>
            <p className="checkout-terms">
              Questions? Call <a href={`tel:${STORE.phone}`}>{STORE.phone}</a>.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function OrderPage({ params, searchParams }: PageProps<'/orders/[number]'>) {
  return (
    <Suspense fallback={null}>
      <Confirmation params={params} searchParams={searchParams} />
    </Suspense>
  );
}
