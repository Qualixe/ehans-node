import type { HomeCatalog } from '@ehans/shared';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { CategoryRowSkeleton, TrendingGridSkeleton } from '@/components/store/loading/skeletons';
import { CategorySlider } from '@/components/store/category-slider';
import { GridBannerSection } from '@/components/store/home/grid-banner-section';
import { HeroSection } from '@/components/store/home/hero-section';
import { TrendingGrid } from '@/components/store/home/trending-grid';
import { getHomeCatalog } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Home' };

async function loadHome(): Promise<HomeCatalog | null> {
  await connection();
  try {
    return await getHomeCatalog();
  } catch {
    return null;
  }
}

async function HomeCategories() {
  const home = await loadHome();
  return home ? <CategorySlider categories={home.categories} /> : null;
}

async function HomeBanners() {
  const home = await loadHome();
  return <GridBannerSection categorySlugs={home?.categories.map((c) => c.slug) ?? []} />;
}

async function HomeTrending() {
  const home = await loadHome();
  return home?.trending ? <TrendingGrid grid={home.trending} /> : null;
}

/** Same sections, in the same order, as the live ehansmart.com home page. */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<CategoryRowSkeleton />}>
        <HomeCategories />
      </Suspense>
      <Suspense fallback={<GridBannerSection />}>
        <HomeBanners />
      </Suspense>
      <Suspense fallback={<TrendingGridSkeleton />}>
        <HomeTrending />
      </Suspense>
    </>
  );
}
