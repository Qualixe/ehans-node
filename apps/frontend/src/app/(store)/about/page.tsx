import type { Metadata } from 'next';
import { AboutContent } from '@/components/store/pages/about-content';
import { PageEnhancer } from '@/components/store/pages/page-enhancer';

export const metadata: Metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <>
      <AboutContent />
      <PageEnhancer kind="about" />
    </>
  );
}
