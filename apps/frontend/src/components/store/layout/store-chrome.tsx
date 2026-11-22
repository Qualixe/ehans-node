import type { CategoryNode } from '@ehans/shared';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getCategories } from '@/lib/catalog';
import { collectionUrl } from '@/lib/format';
import { AnnounceBar } from './announce-bar';
import { AppMenu, AppMenuForRoute } from './app-menu';
import { CartDrawer } from './cart-drawer';
import { Footer } from './footer';
import { Header, HeaderForRoute } from './header';
import { HeaderMenus, HeaderMenusFallback } from './header-menus';
import { MobileMenu } from './mobile-menu';
import { SearchBar } from './search-bar';
import { QuickView } from '../quick-view';

/** Categories for menus; an unreachable API degrades to empty menus instead of an error page. */
async function loadCategories(): Promise<CategoryNode[]> {
  await connection();
  try {
    return await getCategories();
  } catch {
    return [];
  }
}

async function Menus() {
  const categories = await loadCategories();
  return categories.length ? <HeaderMenus categories={categories} /> : <HeaderMenusFallback />;
}

async function Popups() {
  const categories = await loadCategories();
  return (
    <>
      <SearchBar categories={categories} />
      <MobileMenu categories={categories} />
    </>
  );
}

async function ShopLinks() {
  const categories = await loadCategories();
  return (
    <>
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={collectionUrl(c.slug)}>{c.name}</Link>
        </li>
      ))}
    </>
  );
}

/** Same measurement the template's sticky-header script does, run inline while the HTML parses. */
const RESERVE_HEADER_SPACE = `(function(){var h=document.querySelector('.header');if(!h)return;var a=document.querySelector('.announcebar-section'),r=document.documentElement,b=document.body,ah=a?a.offsetHeight:0,hh=h.offsetHeight;r.style.setProperty('--announce-h',ah+'px');r.style.setProperty('--header-h',hh+'px');b.style.transition='all ease 2s, padding-top 0s';b.style.paddingTop=(ah+hh)+'px';})();`;

/** Announce bar + header + page + cart drawer + app menu + footer, as in every template page. */
export function StoreChrome({ children }: { children: React.ReactNode }) {
  const headerMenus = (
    <Suspense fallback={<HeaderMenusFallback />}>
      <Menus />
    </Suspense>
  );
  const headerPopups = (
    <Suspense fallback={null}>
      <Popups />
    </Suspense>
  );
  return (
    <>
      <AnnounceBar />
      {/* the header variant depends on the URL; the static shell renders the default one */}
      <Suspense fallback={<Header variant="default" menus={headerMenus} popups={headerPopups} />}>
        <HeaderForRoute menus={headerMenus} popups={headerPopups} />
      </Suspense>
      {/* Reserve space for the fixed announce bar + header before first paint (no layout jump).
          The Header effect keeps it in sync afterwards (resize, variant changes). */}
      <script dangerouslySetInnerHTML={{ __html: RESERVE_HEADER_SPACE }} />
      <main>
        {children}
        <QuickView />
        <CartDrawer />
        <Suspense fallback={<AppMenu />}>
          <AppMenuForRoute />
        </Suspense>
      </main>
      <Footer
        shopLinks={
          <Suspense fallback={null}>
            <ShopLinks />
          </Suspense>
        }
      />
    </>
  );
}
