import type { HomeCatalog } from '@ehans/shared';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { CategoryRowSkeleton, HomeSlidersSkeleton } from '@/components/store/loading/skeletons';
import { CardSliderSection } from '@/components/store/card-slider-section';
import { CategorySlider } from '@/components/store/category-slider';
import { CommunityReviews } from '@/components/store/home/community-reviews';
import { GridBannerSection } from '@/components/store/home/grid-banner-section';
import { HeroSection } from '@/components/store/home/hero-section';
import { getHomeCatalog } from '@/lib/catalog';
import { collectionUrl } from '@/lib/format';

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

async function HomeSliders() {
  const home = await loadHome();
  if (!home) return null;
  return (
    <>
      {home.sliders.map((s) => (
        <CardSliderSection
          key={s.category.id}
          title={s.title}
          href={collectionUrl(s.category.slug)}
          products={s.products}
        />
      ))}
    </>
  );
}

async function HomeBanners() {
  const home = await loadHome();
  return <GridBannerSection categorySlugs={home?.categories.map((c) => c.slug) ?? []} />;
}

async function HomeReviews() {
  const home = await loadHome();
  return <CommunityReviews products={home?.popular.slice(0, 4) ?? []} />;
}

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
      <Suspense fallback={<HomeSlidersSkeleton />}>
        <HomeSliders />
      </Suspense>
      <Suspense fallback={<CommunityReviews products={[]} />}>
        <HomeReviews />
      </Suspense>
    </>
  );
}
