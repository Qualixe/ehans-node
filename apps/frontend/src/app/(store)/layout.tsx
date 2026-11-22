import '@/styles/store/index.css';
import '@/styles/store-loading.css';
import { Suspense } from 'react';
import { StoreChrome } from '@/components/store/layout/store-chrome';
import { RouteProgress } from '@/components/store/loading/route-progress';
import { StoreUiProvider } from '@/components/store/providers/store-ui';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreUiProvider>
      {/* reads the URL, so it sits in Suspense (Cache Components) */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <StoreChrome>{children}</StoreChrome>
    </StoreUiProvider>
  );
}
