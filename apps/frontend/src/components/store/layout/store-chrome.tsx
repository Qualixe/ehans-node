import { Suspense } from 'react';
import { CartDrawer } from './cart-drawer';
import { Footer } from './footer';
import { Header, HeaderForRoute } from './header';
import { HeaderMenus } from './header-menus';
import { MobileMenu } from './mobile-menu';
import { SearchBar } from './search-bar';
import { QuickView } from '../quick-view';

/** Same measurement the template's sticky-header script does, run inline while the HTML parses. */
const RESERVE_HEADER_SPACE = `(function(){var h=document.querySelector('.header');if(!h)return;var a=document.querySelector('.announcebar-section'),r=document.documentElement,b=document.body,ah=a?a.offsetHeight:0,hh=h.offsetHeight;r.style.setProperty('--announce-h',ah+'px');r.style.setProperty('--header-h',hh+'px');b.style.transition='all ease 2s, padding-top 0s';b.style.paddingTop=(ah+hh)+'px';})();`;

/** Header + page + cart drawer + footer, as on the live ehansmart.com theme (no announce bar or app menu). */
export function StoreChrome({ children }: { children: React.ReactNode }) {
  const headerMenus = <HeaderMenus />;
  const headerPopups = (
    <>
      <SearchBar />
      <MobileMenu />
    </>
  );
  return (
    <>
      {/* the header variant depends on the URL; the static shell renders the default one */}
      <Suspense fallback={<Header variant="default" menus={headerMenus} popups={headerPopups} />}>
        <HeaderForRoute menus={headerMenus} popups={headerPopups} />
      </Suspense>
      {/* Reserve space for the fixed header before first paint (no layout jump).
          The Header effect keeps it in sync afterwards (resize, variant changes). */}
      <script dangerouslySetInnerHTML={{ __html: RESERVE_HEADER_SPACE }} />
      <main>
        {children}
        <QuickView />
        <CartDrawer />
      </main>
      <Footer />
    </>
  );
}
