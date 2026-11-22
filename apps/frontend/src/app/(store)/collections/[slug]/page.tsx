import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CollectionPageSkeleton } from '@/components/store/loading/skeletons';
import { CollectionPage, resolveCategory } from '@/components/store/collection/collection-page';
import { getCategories } from '@/lib/catalog';

export async function generateMetadata({
  params,
}: PageProps<'/collections/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  try {
    const resolved = resolveCategory(await getCategories(), slug);
    return { title: resolved?.title ?? 'Collections' };
  } catch {
    return { title: 'Collections' };
  }
}

async function Content({ params, searchParams }: PageProps<'/collections/[slug]'>) {
  const [{ slug }, { q }] = await Promise.all([params, searchParams]);
  return <CollectionPage slug={slug} q={typeof q === 'string' ? q : undefined} />;
}

export default function CategoryCollectionPage(props: PageProps<'/collections/[slug]'>) {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}
