import type { Metadata } from 'next';
import { FaqContent } from '@/components/store/pages/faq-content';
import { PageEnhancer } from '@/components/store/pages/page-enhancer';

export const metadata: Metadata = { title: 'FAQ' };

export default function FaqPage() {
  return (
    <>
      <FaqContent />
      <PageEnhancer kind="faq" />
    </>
  );
}
