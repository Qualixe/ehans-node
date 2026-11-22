import type { Metadata } from 'next';
import { ContactContent } from '@/components/store/pages/contact-content';
import { PageEnhancer } from '@/components/store/pages/page-enhancer';

export const metadata: Metadata = { title: 'Contact Us' };

export default function ContactPage() {
  return (
    <>
      <ContactContent />
      <PageEnhancer kind="contact" />
    </>
  );
}
