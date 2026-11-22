import type { Metadata } from 'next';
import { BlogContent } from '@/components/store/pages/blog-content';
import { PageEnhancer } from '@/components/store/pages/page-enhancer';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  return (
    <>
      <BlogContent />
      <PageEnhancer kind="blog" />
    </>
  );
}
