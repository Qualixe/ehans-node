import { type AdminCategoryTree, type AdminProductSuggestions, canManage } from '@ehans/shared';
import type { Metadata } from 'next';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { ProductForm } from '@/components/admin/product-form';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { findCrossSellProducts, saveProduct } from '../form-actions';

export const metadata: Metadata = { title: 'Add product' };

export default async function CreateProductPage() {
  const [user, tree, suggestions] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminCategoryTree>('/categories'),
    adminApi<AdminProductSuggestions>('/products/suggestions'),
  ]);
  const readOnly = !canManage(user, 'products');
  return (
    <>
      {readOnly ? <ReadOnlyNotice /> : null}
      <ProductForm
        product={null}
        categories={tree.flatMap((r) => [
          { id: r.id, name: r.name, depth: 0 },
          ...r.children.map((c) => ({ id: c.id, name: c.name, depth: 1 })),
        ])}
        suggestions={suggestions}
        action={saveProduct.bind(null, null)}
        searchProducts={findCrossSellProducts}
        readOnly={readOnly}
      />
    </>
  );
}
