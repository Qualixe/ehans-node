import {
  type AdminCategoryTree,
  type AdminProductDetail,
  type AdminProductSuggestions,
  canManage,
} from '@ehans/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReadOnlyNotice } from '@/components/admin/feedback';
import { ProductForm } from '@/components/admin/product-form';
import { ApiError } from '@/lib/api-client';
import { adminApi, getCurrentAdmin } from '@/lib/admin/session';
import { deleteProduct } from '../../actions';
import { findCrossSellProducts, saveProduct } from '../../form-actions';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]/edit'>) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [user, tree, suggestions, product] = await Promise.all([
    getCurrentAdmin(),
    adminApi<AdminCategoryTree>('/categories'),
    adminApi<AdminProductSuggestions>('/products/suggestions'),
    adminApi<AdminProductDetail>(`/products/${id}`).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
  ]);
  if (!product) notFound();
  const readOnly = !canManage(user, 'products');
  return (
    <>
      {readOnly ? <ReadOnlyNotice /> : null}
      <ProductForm
        key={product.id}
        product={product}
        categories={tree.flatMap((r) => [
          { id: r.id, name: r.name, depth: 0 },
          ...r.children.map((c) => ({ id: c.id, name: c.name, depth: 1 })),
        ])}
        suggestions={suggestions}
        action={saveProduct.bind(null, product.id)}
        deleteAction={deleteProduct.bind(null, product.id, '/admin/products')}
        searchProducts={findCrossSellProducts}
        readOnly={readOnly}
      />
    </>
  );
}
