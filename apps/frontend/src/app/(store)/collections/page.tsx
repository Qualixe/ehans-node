import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CollectionPageSkeleton } from '@/components/store/loading/skeletons';
import { CollectionPage } from '@/components/store/collection/collection-page';

export const metadata: Metadata = { title: 'Collections' };

async function Content({
  searchParams,
}: {
  searchParams: PageProps<'/collections'>['searchParams'];
}) {
  const { q } = await searchParams;
  return <CollectionPage q={typeof q === 'string' ? q : undefined} />;
}

export default function CollectionsPage({ searchParams }: PageProps<'/collections'>) {
  return (
    <Suspense fallback={<CollectionPageSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
