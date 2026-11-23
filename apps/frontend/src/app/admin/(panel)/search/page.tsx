import type { AdminSearchResults } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminIcon } from '@/components/admin/icon';
import { PageHeader, StatusBadge } from '@/components/admin/ui';
import { money } from '@/lib/admin/format';
import { adminApi } from '@/lib/admin/session';

export const metadata: Metadata = { title: 'Search' };

const date = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  });

/** glowy admin/search: products and orders matching the topbar search. */
export default async function SearchPage({ searchParams }: PageProps<'/admin/search'>) {
  const raw = (await searchParams).q;
  const q = typeof raw === 'string' ? raw.trim().slice(0, 100) : '';
  const results = await adminApi<AdminSearchResults>(`/search?q=${encodeURIComponent(q)}`);
  const { term, products, orders } = results;

  return (
    <>
      <PageHeader
        title={term ? `Results for “${term}”` : 'Search'}
        description="Products and orders matching your query."
      />

      <form action="/admin/search" method="get" className="mb-6 sm:hidden">
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Search catalog, orders..."
          className="admin-input"
        />
      </form>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="admin-card overflow-hidden">
          <h2 className="border-b border-ink-600 px-5 py-3 font-bold text-fg">
            Products ({products.length})
          </h2>
          <ul className="divide-y divide-ink-700">
            {products.length ? (
              products.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  {p.image ? (
                    <img src={p.image} alt="" className="size-10 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-lg bg-ink-800 text-slate-500">
                      <AdminIcon name="image" className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="admin-link block truncate"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.sku} · {p.categoryName}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-fg">{money(p.price)}</span>
                </li>
              ))
            ) : (
              <li className="px-5 py-8 text-center text-sm text-slate-500">No products found.</li>
            )}
          </ul>
        </section>
        <section className="admin-card overflow-hidden">
          <h2 className="border-b border-ink-600 px-5 py-3 font-bold text-fg">
            Orders ({orders.length})
          </h2>
          <ul className="divide-y divide-ink-700">
            {orders.length ? (
              orders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/orders/${o.number}`}
                      className="admin-link font-mono text-sm"
                    >
                      {o.number}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {o.customerName} · {o.phone} · {date(o.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold text-fg">{money(o.total)}</span>
                </li>
              ))
            ) : (
              <li className="px-5 py-8 text-center text-sm text-slate-500">No orders found.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
