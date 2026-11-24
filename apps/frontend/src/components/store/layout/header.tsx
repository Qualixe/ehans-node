'use client';

import Link from 'next/link';
import { STORE_LOGO } from '@/lib/home-media';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef } from 'react';
import { useCart } from '../providers/cart-store';
import { useStoreUi } from '../providers/store-ui';
import { BackArrowIcon, HeaderCartIcon } from '../icons';
import { SearchRoller } from './search-roller';

const SHOW_AFTER_UP = 10; // px of upward scroll before the header shows again
const TOP_ZONE = 5; // px from the top that counts as "at top"

/**
 * Template header: smart sticky behaviour (hide on scroll down, show on scroll up),
 * per-page variants, and the search / menu / cart triggers.
 * Category menus, search popup and mobile menu are passed in as server-rendered slots.
 */
export type HeaderVariant = 'home' | 'product' | 'default';

export function headerVariant(pathname: string): HeaderVariant {
  if (pathname === '/') return 'home';
  return pathname.startsWith('/products/') ? 'product' : 'default';
}

/** Picks the template header variant from the URL (must render inside <Suspense>). */
export function HeaderForRoute(props: { menus: ReactNode; popups: ReactNode }) {
  return <Header {...props} variant={headerVariant(usePathname())} />;
}

export function Header({
  menus,
  popups,
  variant: kind,
}: {
  menus: ReactNode;
  popups: ReactNode;
  variant: HeaderVariant;
}) {
  const router = useRouter();
  const { panel, openSearch, openMobileMenu, openCart } = useStoreUi();
  const { count } = useCart();
  const headerRef = useRef<HTMLElement>(null);
  const isProduct = kind === 'product';
  const variant = kind === 'home' ? ' home-header' : isProduct ? ' product-page-header' : '';

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const announce = document.querySelector<HTMLElement>('.announcebar-section');
    // body has `transition: all 2s` in main.css; padding must apply instantly
    document.body.style.transition = 'all ease 2s, padding-top 0s';

    const setSizes = () => {
      const announceH = announce?.offsetHeight ?? 0;
      root.style.setProperty('--announce-h', `${announceH}px`);
      root.style.setProperty('--header-h', `${header.offsetHeight}px`);
      document.body.style.paddingTop = `${announceH + header.offsetHeight}px`;
    };
    setSizes();
    const resizeObserver = new ResizeObserver(setSizes);
    resizeObserver.observe(header);
    window.addEventListener('resize', setSizes, { passive: true });

    let lastY = window.scrollY;
    let upDistance = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const diff = y - lastY;
      lastY = y;
      if (document.body.classList.contains('active')) return; // popup open: keep bars as they are
      if (y <= TOP_ZONE) {
        root.classList.remove('page-scroll-down', 'page-scroll-up');
        upDistance = 0;
      } else if (diff > 0) {
        root.classList.add('page-scroll-down');
        root.classList.remove('page-scroll-up');
        upDistance = 0;
      } else if (diff < 0) {
        upDistance -= diff;
        if (upDistance >= SHOW_AFTER_UP) {
          root.classList.add('page-scroll-up');
          root.classList.remove('page-scroll-down');
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', setSizes);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const hamburgerClass = `hamburger app-menu-open${panel === 'mobile-menu' ? ' active' : ''}`;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <header ref={headerRef} className={`header home-nav-active${variant}`}>
      <div className="container">
        <nav className="navbar">
          <div className="navbar-left">
            <button
              className={hamburgerClass}
              type="button"
              aria-label="open menu"
              onClick={stop(openMobileMenu)}
            >
              <span className="hamburger-line"></span> <span className="hamburger-line"></span>{' '}
              <span className="hamburger-line"></span>
            </button>
            <div className="navbar-logo">
              <Link href="/">
                <img src={STORE_LOGO} alt="ehans-mart-logo" />
              </Link>
            </div>
          </div>
          <div className="navbar-search">
            {isProduct ? (
              <>
                <button
                  className="navbar-icon"
                  onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
                  aria-label="go back"
                >
                  <BackArrowIcon />
                </button>{' '}
              </>
            ) : null}
            <button className="search-open navbar-search-open-btn" onClick={() => openSearch()}>
              <span className="icon">
                <svg viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6"></circle>
                  <path
                    d="M13.5 13.5L17 17"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  ></path>
                </svg>
              </span>{' '}
              <span className="text p">
                search for <SearchRoller />
              </span>
            </button>
            {isProduct ? (
              <>
                {' '}
                <button
                  className="navbar-icon cart-drawer-open"
                  onClick={stop(openCart)}
                  aria-label="open cart"
                >
                  <span className="cart-count">{count}</span> <HeaderCartIcon />
                </button>
              </>
            ) : null}
          </div>
          <div className="navbar-icons">
            <button
              className="navbar-icon navbar-search-open-btn"
              onClick={() => openSearch()}
              aria-label="search"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M17.5 17.5L13.875 13.875"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>{' '}
            <Link href="/account" className="navbar-icon" aria-label="account">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 10.1A2.85 2.85 0 1 0 10 4.4a2.85 2.85 0 0 0 0 5.7Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                ></path>
                <path
                  d="M4.6 16c.45-2.25 2.48-3.7 5.4-3.7 2.92 0 4.95 1.45 5.4 3.7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                ></path>
              </svg>
            </Link>{' '}
            <button
              className="navbar-icon cart-drawer-open"
              onClick={stop(openCart)}
              aria-label="open cart"
            >
              <span className="cart-count">{count}</span> <HeaderCartIcon />
            </button>
          </div>
          <div className="navbar-link-area">{menus}</div>
        </nav>
      </div>
      {popups}
    </header>
  );
}
