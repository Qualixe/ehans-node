import { type AdminCategoryTree, canManage } from '@ehans/shared';
import type { Metadata } from 'next';
import { CategoryForm } from '@/components/admin/category-form';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { PageHeader } from '@/components/admin/ui';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { saveCategory } from '../actions';

export const metadata: Metadata = { title: 'Add category' };

export default async function CreateCategoryPage() {
  const [user, tree] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminCategoryTree>('/categories'),
  ]);
  const readOnly = !canManage(user, 'products');
  return (
    <>
      {readOnly ? <ReadOnlyNotice /> : null}
      <PageHeader title="Add category" />
      <CategoryForm
        category={null}
        parents={tree.map(({ id, name }) => ({ id, name }))}
        action={saveCategory.bind(null, null)}
        readOnly={readOnly}
      />
    </>
  );
}
