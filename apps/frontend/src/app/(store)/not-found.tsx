import type { Metadata } from 'next';
import { NotFoundPage } from '@/components/store/pages/not-found-page';

export const metadata: Metadata = { title: 'Page not found' };

/** notFound() inside store routes (unknown product/category/post): rendered within the store layout. */
export default function StoreNotFound() {
  return <NotFoundPage />;
}
