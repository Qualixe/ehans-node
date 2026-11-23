import '@/styles/store/index.css';
import '@/styles/store-loading.css';
import { StoreChrome } from '@/components/store/layout/store-chrome';
import { StoreUiProvider } from '@/components/store/providers/store-ui';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreUiProvider>
      <StoreChrome>{children}</StoreChrome>
    </StoreUiProvider>
  );
}
