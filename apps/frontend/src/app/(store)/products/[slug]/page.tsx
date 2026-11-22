import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ProductPageSkeleton } from '@/components/store/loading/skeletons';
import { CardSliderSection } from '@/components/store/card-slider-section';
import { CollectionCategorySection } from '@/components/store/collection-category-section';
import { BuyNowPopup } from '@/components/store/product/buy-now-popup';
import { ProductProvider } from '@/components/store/product/product-context';
import { ProductGallery } from '@/components/store/product/product-gallery';
import { ProductInfo } from '@/components/store/product/product-info';
import { RecentlyViewed } from '@/components/store/product/recently-viewed';
import { ReviewTabSection } from '@/components/store/product/review-tab-section';
import { StickyAddToCart } from '@/components/store/product/sticky-add-to-cart';
import { getCategories, getHomeCatalog, getProduct } from '@/lib/catalog';
import { collectionUrl } from '@/lib/format';

export async function generateMetadata({
  params,
}: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (!product) return { title: 'Product not found' };
    return {
      title: product.name,
      description: product.shortDescription ?? undefined,
      openGraph: { images: product.images[0] ? [product.images[0].url] : undefined },
    };
  } catch {
    return { title: 'Product' };
  }
}

async function ProductContent({ params }: { params: PageProps<'/products/[slug]'>['params'] }) {
  const { slug } = await params;
  await connection();
  const product = await getProduct(slug);
  if (!product) notFound();

  const [home, categories] = await Promise.all([
    getHomeCatalog().catch(() => null),
    getCategories().catch(() => []),
  ]);
  const popular = (home?.popular ?? []).filter((p) => p.id !== product.id);
  const topCategory = categories.find((c) => c.id === product.breadcrumbs[0]?.id);

  return (
    <ProductProvider product={product}>
      <section
        className="product-section"
        data-price={product.price}
        data-stock={product.stock}
        data-stock-max={Math.max(product.stock + product.soldCount, product.stock)}
      >
        <div className="container">
          <div className="product-page-content-wrap">
            <ProductGallery />
            <ProductInfo />
          </div>
        </div>
      </section>
      <BuyNowPopup />
      <ReviewTabSection
        product={{ score: product.ratingAverage ?? 0, count: product.ratingCount }}
        category={{ score: 0, count: 0 }}
      />
      <CardSliderSection
        title="Popular Right Now"
        href={collectionUrl()}
        products={popular.length ? popular : product.related}
      />
      <RecentlyViewed
        current={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          discountPercent: product.discountPercent,
          image: product.image,
          hoverImage: product.hoverImage,
          ratingAverage: product.ratingAverage,
          ratingCount: product.ratingCount,
          inStock: product.inStock,
          category: product.category,
          hasVariants: product.hasVariants,
        }}
      />
      <CollectionCategorySection
        className="category-section product-category collection-category"
        heading={<h2 className="title h5">Explore More in Categories</h2>}
        categories={topCategory?.children.length ? topCategory.children : categories}
      />
      <StickyAddToCart />
    </ProductProvider>
  );
}

export default function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}
