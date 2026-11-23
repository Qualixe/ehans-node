import {
  type AdminCategoryTree,
  type AdminPage,
  type AdminProductRow,
  LOW_STOCK_THRESHOLD,
  type ProductStatusFilter,
  canManage,
} from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoSubmitSelect } from '@/components/admin/auto-submit-select';
import { DeleteButton, ReadOnlyNotice } from '@/components/admin/feedback';
import { AdminIcon } from '@/components/admin/icon';
import { Pagination } from '@/components/admin/pagination';
import { PageHeader } from '@/components/admin/ui';
import { money } from '@/lib/admin/format';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { deleteProduct } from './actions';

export const metadata: Metadata = { title: 'Products' };

/** glowy admin/products/index. */
export default async function ProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const category =
    typeof sp.category === 'string' && /^[0-9a-f-]{36}$/i.test(sp.category) ? sp.category : '';
  const status: ProductStatusFilter | '' =
    sp.status === 'active' || sp.status === 'draft' ? sp.status : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const query = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
    page: String(page),
  });
  const [user, products, tree] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminPage<AdminProductRow>>(`/products?${query.toString()}`),
    adminApi<AdminCategoryTree>('/categories'),
  ]);
  const manage = canManage(user, 'products');
  const returnTo = `/admin/products?${query.toString()}`;
  const options = tree.flatMap((root) => [
    { id: root.id, name: root.name },
    ...root.children.map((c) => ({ id: c.id, name: `— ${c.name}` })),
  ]);

  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <PageHeader title="Products" description={`${products.total} products in your catalog`}>
        <Link href="/admin/categories" className="admin-btn-secondary">
          Categories
        </Link>
        {manage ? (
          <Link href="/admin/products/create" className="admin-btn-primary">
            <AdminIcon name="plus" className="size-4" /> Add product
          </Link>
        ) : null}
      </PageHeader>

      <div className="admin-card overflow-hidden">
        <form
          method="get"
          action="/admin/products"
          className="grid gap-3 border-b border-ink-600 p-4 md:grid-cols-[1fr_220px_160px_auto]"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, SKU or brand"
            className="admin-input"
          />
          <AutoSubmitSelect name="category" defaultValue={category} className="admin-input">
            <option value="">All categories</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect name="status" defaultValue={status} className="admin-input">
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="draft">Hidden</option>
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
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sold</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.items.length ? (
                products.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            className="size-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-ink-800 text-slate-500">
                            <AdminIcon name="image" className="size-5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="block max-w-xs truncate font-medium text-slate-100 hover:text-blue-300"
                          >
                            {p.name}
                          </Link>
                          <p className="font-mono text-xs text-slate-500">
                            {p.sku}
                            {p.brand ? ` · ${p.brand}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-400">{p.categoryName}</td>
                    <td className="whitespace-nowrap">
                      <span className="font-semibold text-fg">{money(p.price)}</span>
                      {p.compareAtPrice && p.compareAtPrice > p.price ? (
                        <span className="ml-1 text-xs text-slate-500 line-through">
                          {money(p.compareAtPrice)}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={`font-semibold ${p.stock === 0 ? 'text-rose-400' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        {p.stock} in stock
                      </span>
                      {p.variantCount > 1 ? (
                        <span className="block text-xs text-slate-500">
                          for {p.variantCount} variants
                        </span>
                      ) : null}
                    </td>
                    <td className="text-slate-400">{p.soldCount}</td>
                    <td>
                      {p.isActive ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/30">
                          Hidden
                        </span>
                      )}
                      {p.isFeatured ? (
                        <span className="ml-1 text-amber-400" title="Featured">
                          ★
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/products/${p.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg"
                          title="View in store"
                        >
                          <AdminIcon name="eye" className="size-4" />
                        </a>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg"
                          title="Edit"
                        >
                          <AdminIcon name="edit" className="size-4" />
                        </Link>
                        {manage ? (
                          <DeleteButton
                            action={deleteProduct.bind(null, p.id, returnTo)}
                            iconOnly
                            confirm={`Delete “${p.name}”? This cannot be undone.`}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No products found.{' '}
                    {manage ? (
                      <Link href="/admin/products/create" className="admin-link">
                        Add your first product
                      </Link>
                    ) : null}
                    {manage ? '.' : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          {...products}
          basePath="/admin/products"
          query={{
            q: q || undefined,
            category: category || undefined,
            status: status || undefined,
          }}
        />
      </div>
    </>
  );
}
