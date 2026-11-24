import type { OrderConfirmation } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AccountNav } from '@/components/store/account/account-nav';
import { OrderSummary } from '@/components/store/checkout/order-summary';
import { accountApi, getCustomer } from '@/lib/account/session';
import { ApiError } from '@/lib/api-client';

export const metadata: Metadata = { title: 'Order', robots: { index: false } };

const placed = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

async function Content({ params }: Pick<PageProps<'/account/orders/[number]'>, 'params'>) {
  const { number } = await params;
  const customer = await getCustomer();
  if (!customer) redirect(`/account/login?next=/account/orders/${encodeURIComponent(number)}`);
  if (!/^[A-Z]{2}\d{6}[A-Z0-9]{5}$/.test(number)) notFound();
  let order: OrderConfirmation;
  try {
    order = await accountApi<OrderConfirmation>(`/orders/${number}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="account-layout">
      <AccountNav customer={customer} current="orders" />
      <div className="order-confirmation">
        <p className="account-links" style={{ textAlign: 'left' }}>
          <Link href="/account">← All orders</Link>
        </p>
        <h1 className="account-title" style={{ marginTop: 12 }}>
          Order #{order.number}
        </h1>
        <p className="account-sub" style={{ marginBottom: 24 }}>
          Placed {placed(order.createdAt)} ·{' '}
          <span className={`account-status ${order.status}`}>{order.status}</span>
        </p>
        <OrderSummary order={order} />
      </div>
    </div>
  );
}

/** glowy account/order */
export default function AccountOrderPage({ params }: PageProps<'/account/orders/[number]'>) {
  return (
    <section className="account-section">
      <div className="container">
        <Suspense fallback={null}>
          <Content params={params} />
        </Suspense>
      </div>
    </section>
  );
}
