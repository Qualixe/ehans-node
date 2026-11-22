import '@/styles/store/index.css';
import '@/styles/store-loading.css';
import type { Metadata } from 'next';
import { StoreChrome } from '@/components/store/layout/store-chrome';
import { NotFoundPage } from '@/components/store/pages/not-found-page';
import { StoreUiProvider } from '@/components/store/providers/store-ui';

export const metadata: Metadata = { title: 'Page not found' };

/** Unmatched URLs: rendered by the root layout only, so it brings the store styles + chrome itself. */
export default function NotFound() {
  return (
    <StoreUiProvider>
      <StoreChrome>
        <NotFoundPage />
      </StoreChrome>
    </StoreUiProvider>
  );
}
