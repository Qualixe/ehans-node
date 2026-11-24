import type { OrderConfirmation } from '@ehans/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { OrderSummary } from '@/components/store/checkout/order-summary';

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

        <OrderSummary order={order} />
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
