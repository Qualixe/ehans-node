import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PageEnhancer } from '@/components/store/pages/page-enhancer';
import { PolicyContent } from '@/components/store/pages/policy-content';

// One combined policies page (shipping, refund, exchange, privacy, terms) as in the template.
// Per-policy CMS pages arrive with the glowy "Pages" admin module.
const POLICIES = ['privacy-policy'];

export const metadata: Metadata = { title: 'Policies' };

export function generateStaticParams() {
  return POLICIES.map((slug) => ({ slug }));
}

async function Content({ params }: { params: PageProps<'/policies/[slug]'>['params'] }) {
  const { slug } = await params;
  if (!POLICIES.includes(slug)) notFound();
  return (
    <>
      <PolicyContent />
      <PageEnhancer kind="policy" />
    </>
  );
}

export default function PolicyPage({ params }: PageProps<'/policies/[slug]'>) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}
