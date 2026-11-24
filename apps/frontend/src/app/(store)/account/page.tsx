import type { AdminPage, CustomerOrderRow } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AccountNav } from '@/components/store/account/account-nav';
import { accountApi, getCustomer } from '@/lib/account/session';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'My account', robots: { index: false } };

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

async function Content({ searchParams }: Pick<PageProps<'/account'>, 'searchParams'>) {
  const customer = await getCustomer();
  if (!customer) redirect('/account/login');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const orders = await accountApi<AdminPage<CustomerOrderRow>>(`/orders?page=${page}`);
  const first = customer.name.split(' ')[0];

  return (
    <div className="account-layout">
      <AccountNav customer={customer} current="orders" />
      <div>
        <h1 className="account-title">Hi {first}, here are your orders</h1>
        <p className="account-sub">Orders you place while signed in appear here.</p>
        <div className="account-orders">
          {orders.items.length ? (
            orders.items.map((o) => (
              <Link key={o.number} href={`/account/orders/${o.number}`} className="account-order">
                <span className="account-order-imgs" aria-hidden="true">
                  {o.images.map((src, i) => (
                    <img key={i} src={src} alt="" />
                  ))}
                </span>
                <span>
                  <span className="account-order-number">#{o.number}</span>
                  <span className="account-order-meta" style={{ display: 'block' }}>
                    {day(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <span className={`account-status ${o.status}`}>{o.status}</span>
                <strong>{formatPrice(o.total)}</strong>
              </Link>
            ))
          ) : (
            <div className="account-empty">
              <p>No orders yet</p>
              <p className="account-sub">When you order while signed in, it will show up here.</p>
              <Link href="/collections" className="btn primary-btn">
                start shopping
              </Link>
            </div>
          )}
        </div>
        {orders.totalPages > 1 ? (
          <nav className="account-pages" aria-label="Pages">
            {Array.from({ length: orders.totalPages }, (_, i) => i + 1).map((p) =>
              p === orders.page ? (
                <span key={p} aria-current="page">
                  {p}
                </span>
              ) : (
                <Link key={p} href={p === 1 ? '/account' : `/account?page=${p}`}>
                  {p}
                </Link>
              ),
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

/** glowy account/index: the customer's orders */
export default function AccountPage({ searchParams }: PageProps<'/account'>) {
  return (
    <section className="account-section">
      <div className="container">
        <Suspense fallback={null}>
          <Content searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}
