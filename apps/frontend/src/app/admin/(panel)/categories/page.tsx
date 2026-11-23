import { type AdminCategoryTree, canManage } from '@ehans/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DeleteButton, ReadOnlyNotice } from '@/components/admin/feedback';
import { AdminIcon } from '@/components/admin/icon';
import { PageHeader } from '@/components/admin/ui';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { deleteCategory } from './actions';

export const metadata: Metadata = { title: 'Categories' };

/** glowy admin/categories/index: departments with their sub-categories. */
export default async function CategoriesPage() {
  const [user, tree] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminCategoryTree>('/categories'),
  ]);
  const manage = canManage(user, 'products');
  const rows = tree.flatMap((root) => [root, ...root.children]);

  return (
    <>
      {manage ? null : <ReadOnlyNotice />}
      <PageHeader
        title="Categories"
        description="Departments and sub-categories shown in the store menu."
      >
        {manage ? (
          <Link href="/admin/categories/create" className="admin-btn-primary">
            <AdminIcon name="plus" className="size-4" /> Add category
          </Link>
        ) : null}
      </PageHeader>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Menu</th>
                <th>Home tile</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={`flex items-center gap-3 ${c.parentId ? 'pl-8' : ''}`}>
                        {c.image ? (
                          <img src={c.image} alt="" className="size-9 rounded-lg object-cover" />
                        ) : (
                          <span className="grid size-9 place-items-center rounded-lg bg-ink-800 text-slate-500">
                            <AdminIcon name="tag" className="size-4" />
                          </span>
                        )}
                        <Link
                          href={`/admin/categories/${c.id}/edit`}
                          className={`${c.parentId ? 'text-slate-300' : 'font-semibold text-fg'} hover:text-blue-300`}
                        >
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{c.slug}</td>
                    <td className="text-slate-300">{c.productCount}</td>
                    <td>
                      {c.showInMenu ? (
                        <span className="text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="text-slate-400">
                      {c.homePosition ? `#${c.homePosition}` : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/collections/${c.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg"
                          title="View"
                        >
                          <AdminIcon name="eye" className="size-4" />
                        </a>
                        <Link
                          href={`/admin/categories/${c.id}/edit`}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-ink-700 hover:text-fg"
                          title="Edit"
                        >
                          <AdminIcon name="edit" className="size-4" />
                        </Link>
                        {manage ? (
                          <DeleteButton
                            action={deleteCategory.bind(null, c.id)}
                            iconOnly
                            confirm={`Delete category “${c.name}”?`}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
