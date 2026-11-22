import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BlogDetailsContent } from '@/components/store/pages/blog-details-content';
import { PageEnhancer } from '@/components/store/pages/page-enhancer';

// The template ships one article; the blog/posts module (glowy "Posts") replaces this.
const POSTS = ['sample-post'];

export const metadata: Metadata = { title: 'Blog' };

export function generateStaticParams() {
  return POSTS.map((slug) => ({ slug }));
}

async function Content({ params }: { params: PageProps<'/blog/[slug]'>['params'] }) {
  const { slug } = await params;
  if (!POSTS.includes(slug)) notFound();
  return (
    <>
      <BlogDetailsContent />
      <PageEnhancer kind="blog-details" />
    </>
  );
}

export default function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}
