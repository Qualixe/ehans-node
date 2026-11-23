import { type InventoryPage, type StockFilter, canManage } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmitSelect } from '@/components/admin/auto-submit-select';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { AdminIcon } from '@/components/admin/icon';
import { Pagination } from '@/components/admin/pagination';
import { PageHeader } from '@/components/admin/ui';
import { money, number } from '@/lib/admin/format';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { adjustStock } from './actions';

export const metadata: Metadata = { title: 'Inventory' };

/** glowy admin/inventory/index: stock per variant, adjusted inline. */
export default async function InventoryPage({ searchParams }: PageProps<'/admin/inventory'>) {
  const sp = await searchParams;
  const stock: StockFilter | undefined =
    sp.stock === 'low' || sp.stock === 'out' ? sp.stock : undefined;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const query = new URLSearchParams({
    ...(stock ? { stock } : {}),
    ...(q ? { q } : {}),
    page: String(page),
  });
  const [user, inv] = await Promise.all([
    getCurrentAdmin(),
    adminApi<InventoryPage>(`/inventory?${query.toString()}`),
  ]);
  const manage = canManage(user, 'inventory');
  const returnTo = `/admin/inventory?${query.toString()}`;
  const t = inv.threshold;

  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <PageHeader
        title="Inventory"
        description="Stock for every variant (size, colour…). Adjust inline after a delivery or stock count."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card p-5">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Units in stock
          </p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{number(inv.summary.units)}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Stock value (retail)
          </p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{money(inv.summary.value)}</p>
        </div>
        <Link
          href="/admin/inventory?stock=low"
          className="admin-card p-5 transition hover:border-amber-500/40"
        >
          <p className="text-xs font-bold tracking-wider text-amber-400 uppercase">
            Low stock (≤ {t})
          </p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{inv.summary.low}</p>
        </Link>
        <Link
          href="/admin/inventory?stock=out"
          className="admin-card p-5 transition hover:border-rose-500/40"
        >
          <p className="text-xs font-bold tracking-wider text-rose-400 uppercase">Out of stock</p>
          <p className="mt-2 text-2xl font-extrabold text-fg">{inv.summary.out}</p>
        </Link>
      </section>

      <div className="admin-card overflow-hidden">
        <form
          method="get"
          action="/admin/inventory"
          className="flex flex-wrap gap-3 border-b border-ink-600 p-4"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search product, variant or SKU"
            className="admin-input max-w-sm"
          />
          <AutoSubmitSelect name="stock" defaultValue={stock ?? ''} className="admin-input w-44">
            <option value="">All stock levels</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </AutoSubmitSelect>
          <button type="submit" className="admin-btn-secondary">
            Filter
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available</th>
                <th>Value</th>
                <th>Adjust stock</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.length ? (
                inv.items.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        {row.image ? (
                          <img src={row.image} alt="" className="size-10 rounded-lg object-cover" />
                        ) : (
                          <span className="grid size-10 place-items-center rounded-lg bg-ink-800 text-slate-500">
                            <AdminIcon name="image" className="size-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${row.productId}/edit`}
                            className="block max-w-xs truncate text-slate-100 hover:text-blue-300"
                          >
                            {row.productName}
                          </Link>
                          {row.variantTitle && row.variantTitle !== 'Default Title' ? (
                            <span className="mt-0.5 inline-block rounded-md bg-ink-700 px-1.5 py-0.5 text-xs text-slate-300">
                              {row.variantTitle}
                            </span>
                          ) : (
                            <p className="text-xs text-slate-500">{row.categoryName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{row.sku || '—'}</td>
                    <td>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${row.stock === 0 ? 'bg-rose-500/15 text-rose-300' : row.stock <= t ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}
                      >
                        {row.stock}
                      </span>
                    </td>
                    <td className="text-slate-400">{money(row.stock * row.price)}</td>
                    <td>
                      <form
                        action={adjustStock.bind(null, row.kind, row.id, returnTo)}
                        className="flex items-center gap-2"
                      >
                        <fieldset disabled={!manage} className="contents">
                          <select
                            name="mode"
                            className="admin-input w-28 py-1.5"
                            aria-label="Adjustment type"
                          >
                            <option value="add">Add</option>
                            <option value="set">Set to</option>
                          </select>
                          <input
                            type="number"
                            name="quantity"
                            min={0}
                            max={1000000}
                            defaultValue={0}
                            className="admin-input w-20 py-1.5"
                            aria-label="Quantity"
                          />
                          <button type="submit" className="admin-btn-secondary py-1.5">
                            Update
                          </button>
                        </fieldset>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nothing to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination {...inv} basePath="/admin/inventory" query={{ stock, q: q || undefined }} />
      </div>
    </>
  );
}
