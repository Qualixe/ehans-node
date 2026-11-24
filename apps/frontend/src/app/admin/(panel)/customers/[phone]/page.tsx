import { type AdminCustomerDetail, canManage, CUSTOMER_PASSWORD_MIN } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminIcon } from '@/components/admin/icon';
import { PageHeader, StatusBadge } from '@/components/admin/ui';
import { ApiError } from '@/lib/api-client';
import { money } from '@/lib/admin/format';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { setCustomerPassword } from '../actions';

export const metadata: Metadata = { title: 'Customer' };

const date = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', ...opts });

/** glowy admin/customers/show: a customer's totals, latest address and order history. */
export default async function CustomerPage({ params }: PageProps<'/admin/customers/[phone]'>) {
  const phone = decodeURIComponent((await params).phone);
  if (!/^\+?\d{6,20}$/.test(phone)) notFound();
  let c: AdminCustomerDetail;
  const user = await getCurrentAdmin();
  try {
    c = await adminApi<AdminCustomerDetail>(`/customers/${encodeURIComponent(phone)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const digits = c.phone.replace(/\D/g, '').replace(/^88(?=01)/, '');
  const stat = 'text-xs font-bold tracking-wider text-slate-400 uppercase';
  const manage = canManage(user, 'customers');

  return (
    <>
      <PageHeader title={c.name} description={`${c.phone}${c.email ? ` · ${c.email}` : ''}`}>
        <a href={`tel:${digits}`} className="admin-btn-secondary">
          <AdminIcon name="phone" className="size-4" /> Call
        </a>
        <a
          href={`https://wa.me/88${digits}`}
          target="_blank"
          rel="noopener"
          className="admin-btn-secondary"
        >
          <AdminIcon name="message" className="size-4" /> WhatsApp
        </a>
        <Link
          href={`/admin/orders?q=${encodeURIComponent(c.phone)}`}
          className="admin-btn-secondary"
        >
          All orders
        </Link>
      </PageHeader>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card p-5">
          <p className={stat}>Orders</p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{c.stats.orders}</p>
        </div>
        <div className="admin-card p-5">
          <p className={stat}>Lifetime spend</p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{money(c.stats.spent)}</p>
        </div>
        <div className="admin-card p-5">
          <p className={stat}>Avg. order</p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{money(c.stats.aov)}</p>
        </div>
        <div className="admin-card p-5">
          <p className={stat}>Cancelled / returned</p>
          <p
            className={`mt-2 text-2xl font-extrabold ${c.stats.cancelled > 0 ? 'text-rose-400' : 'text-fg'}`}
          >
            {c.stats.cancelled}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="admin-card overflow-hidden xl:col-span-8">
          <h2 className="border-b border-ink-600 px-6 py-4 font-bold text-fg">Order history</h2>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {c.orders.map((o) => (
                  <tr key={o.number}>
                    <td>
                      <Link
                        href={`/admin/orders/${o.number}`}
                        className="admin-link font-mono text-xs"
                      >
                        {o.number}
                      </Link>
                    </td>
                    <td className="text-slate-400">
                      {date(o.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="text-slate-400">{o.itemCount}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="text-right font-semibold text-fg">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6 xl:col-span-4">
          <section className="admin-card h-fit p-6">
            <h2 className="font-bold text-fg">Latest delivery address</h2>
            <p className="mt-3 text-sm text-slate-300">
              {c.address}
              <br />
              {c.city}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Customer since {date(c.firstOrderAt, { month: 'long', year: 'numeric' })}
            </p>
          </section>

          <section className="admin-card h-fit p-6">
            <h2 className="font-bold text-fg">Customer account</h2>
            {c.account ? (
              <>
                <p className="mt-2 text-sm text-slate-300">
                  Signed up{' '}
                  {date(c.account.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                  as <strong className="text-fg">{c.account.name}</strong>
                  {c.account.email ? ` · ${c.account.email}` : ''}
                </p>
                {manage ? (
                  <form
                    action={setCustomerPassword.bind(null, c.account.id, c.phone)}
                    className="mt-4 space-y-3"
                  >
                    <p className="text-xs text-slate-500">
                      Forgot their password? Set a new one and tell them over the phone.
                    </p>
                    <div>
                      <label htmlFor="customer-password" className="admin-label">
                        New password
                      </label>
                      <input
                        id="customer-password"
                        type="text"
                        name="password"
                        minLength={CUSTOMER_PASSWORD_MIN}
                        required
                        autoComplete="off"
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="customer-password-confirmation" className="admin-label">
                        Confirm password
                      </label>
                      <input
                        id="customer-password-confirmation"
                        type="text"
                        name="password_confirmation"
                        minLength={CUSTOMER_PASSWORD_MIN}
                        required
                        autoComplete="off"
                        className="admin-input"
                      />
                    </div>
                    <button type="submit" className="admin-btn-secondary w-full">
                      Set new password
                    </button>
                  </form>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                This customer has not created an account yet. They can sign up on the store with{' '}
                {c.phone}.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
