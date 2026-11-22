'use client';

import type { ProductCard } from '@ehans/shared';
import { usePathname } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Panel = 'search' | 'mobile-menu' | 'cart' | null;

interface StoreUi {
  panel: Panel;
  searchQuery: string;
  quickView: ProductCard | null;
  /** Element that opened the quick view (card button): fly-to-cart source + focus return. */
  quickViewTrigger: HTMLElement | null;
  openSearch: (query?: string) => void;
  openMobileMenu: () => void;
  openCart: () => void;
  closePanel: () => void;
  openQuickView: (product: ProductCard, trigger?: HTMLElement | null) => void;
  closeQuickView: () => void;
}

const StoreUiContext = createContext<StoreUi | null>(null);

/** Open/closed state for the template's drawers and popups (search, menu, cart, quick view). */
export function StoreUiProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickView, setQuickView] = useState<ProductCard | null>(null);
  const [quickViewTrigger, setQuickViewTrigger] = useState<HTMLElement | null>(null);

  // the template marks <body class="active"> while search is open (freezes the sticky header)
  useEffect(() => {
    document.body.classList.toggle('active', panel === 'search');
  }, [panel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanel((p) => (p === 'search' ? null : p));
        setQuickView(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const closeAll = useCallback(() => {
    setPanel(null);
    setQuickView(null);
  }, []);

  const openSearch = useCallback((query = '') => {
    setSearchQuery(query);
    setPanel('search');
  }, []);

  const value = useMemo<StoreUi>(
    () => ({
      panel,
      searchQuery,
      quickView,
      quickViewTrigger,
      openSearch,
      openMobileMenu: () => setPanel('mobile-menu'),
      openCart: () => setPanel('cart'),
      closePanel: () => setPanel(null),
      openQuickView: (product, trigger = null) => {
        setQuickViewTrigger(trigger);
        setQuickView(product);
      },
      closeQuickView: () => setQuickView(null),
    }),
    [panel, searchQuery, quickView, quickViewTrigger, openSearch],
  );

  return (
    <StoreUiContext.Provider value={value}>
      {children}
      {/* reads the URL, so it must sit in Suspense (Cache Components prerendering) */}
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={closeAll} />
      </Suspense>
    </StoreUiContext.Provider>
  );
}

/** Closes drawers/popups on client-side navigation (the template reloads the page instead). */
function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onNavigate();
  }, [pathname, onNavigate]);
  return null;
}

export function useStoreUi(): StoreUi {
  const ctx = useContext(StoreUiContext);
  if (!ctx) throw new Error('useStoreUi must be used inside <StoreUiProvider>');
  return ctx;
}
