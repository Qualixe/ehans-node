import { type AdminCategory, type AdminCategoryTree, canManage } from '@ehans/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryForm } from '@/components/admin/category-form';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { PageHeader } from '@/components/admin/ui';
import { ApiError } from '@/lib/api-client';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { saveCategory } from '../../actions';

export const metadata: Metadata = { title: 'Edit category' };

export default async function EditCategoryPage({
  params,
}: PageProps<'/admin/categories/[id]/edit'>) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [user, tree, category] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminCategoryTree>('/categories'),
    adminApi<AdminCategory>(`/categories/${id}`).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
  ]);
  if (!category) notFound();
  const readOnly = !canManage(user, 'products');
  return (
    <>
      {readOnly ? <ReadOnlyNotice /> : null}
      <PageHeader title={category.name} />
      <CategoryForm
        category={category}
        parents={tree
          .filter((c) => c.id !== category.id)
          .map(({ id: value, name }) => ({ id: value, name }))}
        action={saveCategory.bind(null, category.id)}
        readOnly={readOnly}
      />
    </>
  );
}
