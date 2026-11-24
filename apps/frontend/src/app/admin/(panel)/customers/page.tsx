import type { AdminCustomerRow, AdminPage, CustomerSort } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmitSelect } from '@/components/admin/auto-submit-select';
import { Pagination } from '@/components/admin/pagination';
import { PageHeader } from '@/components/admin/ui';
import { money, number, timeAgo } from '@/lib/admin/format';
import { adminApi } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Customers' };

/** "Nov 23, 2026" (glowy 'M j, Y') */
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/** glowy admin/customers/index: everyone who ordered, grouped by mobile number. */
export default async function CustomersPage({ searchParams }: PageProps<'/admin/customers'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const sort: CustomerSort = sp.sort === 'spent' ? 'spent' : 'recent';
  const page = Math.max(1, Number(sp.page) || 1);
  const params = new URLSearchParams({
    sort,
    ...(q ? { q } : {}),
    ...(page > 1 ? { page: String(page) } : {}),
  });
  const customers = await adminApi<AdminPage<AdminCustomerRow>>(`/customers?${params.toString()}`);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${number(customers.total)} customers identified by mobile number`}
      />

      <div className="admin-card overflow-hidden">
        <form method="get" className="flex flex-wrap gap-3 border-b border-ink-600 p-4">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone or email"
            aria-label="Search customers"
            className="admin-input max-w-sm"
          />
          <AutoSubmitSelect
            name="sort"
            defaultValue={sort}
            aria-label="Sort"
            className="admin-input w-48"
          >
            <option value="recent">Most recent order</option>
            <option value="spent">Top spenders</option>
          </AutoSubmitSelect>
          <button type="submit" className="admin-btn-secondary">
            Filter
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>City</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>First order</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.items.length ? (
                customers.items.map((c) => (
                  <tr key={c.phone}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-700 text-sm font-bold text-slate-200">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/customers/${encodeURIComponent(c.phone)}`}
                            className="font-medium text-slate-100 hover:text-blue-300"
                          >
                            {c.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {c.phone}
                            {c.email ? ` · ${c.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-400">{c.city}</td>
                    <td className="text-slate-300">{c.ordersCount}</td>
                    <td className="font-semibold text-fg">{money(c.spent)}</td>
                    <td className="text-slate-400">{day(c.firstOrderAt)}</td>
                    <td className="text-slate-400">{timeAgo(c.lastOrderAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {q ? 'No customers match your search.' : 'No customers yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          {...customers}
          basePath="/admin/customers"
          query={{ q: q || undefined, sort: sort === 'spent' ? sort : undefined }}
        />
      </div>
    </>
  );
}
