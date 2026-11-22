import { connection } from 'next/server';
import { Suspense } from 'react';
import { getHomeCatalog } from '@/lib/catalog';
import { ProductCard } from '../product-card';
import { NotFoundContent } from './404-content';
import { PageEnhancer } from './page-enhancer';

async function PopularProducts() {
  await connection();
  const home = await getHomeCatalog().catch(() => null);
  return (
    <>
      {(home?.popular ?? []).slice(0, 4).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </>
  );
}

/** Template 404 page body with real best-sellers in "Popular Right Now". */
export function NotFoundPage() {
  return (
    <>
      <NotFoundContent
        products={
          <Suspense fallback={null}>
            <PopularProducts />
          </Suspense>
        }
      />
      <PageEnhancer kind="not-found" />
    </>
  );
}
