'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../providers/cart-store';
import { useStoreUi } from '../providers/store-ui';
import { SearchIcon } from '../icons';

/** Hides the bottom menu on product pages (they show the sticky add-to-cart bar). Needs <Suspense>. */
export function AppMenuForRoute() {
  return usePathname().startsWith('/products/') ? null : <AppMenu />;
}

/** Mobile bottom navigation. */
export function AppMenu() {
  const { openMobileMenu, openSearch, openCart } = useStoreUi();
  const { count } = useCart();
  return (
    <section className="app-menu-section">
      <div className="app-menu-items">
        <Link href="/" className="app-menu-item">
          <span className="icon">
            <svg
              className="app-menu-logo"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <rect width="64" height="64" rx="14" fill="#1d201e"></rect>
              <path d="M9 15h20v7.5H17v6.75h10v7.5H17v6.75h12V51H9z" fill="#ffffff"></path>
              <path
                d="M33 51V15h8.4l3.6 13.4L48.6 15H57v36h-7.2V31.2L46.6 43h-3.2l-3.2-11.8V51z"
                fill="#ed2024"
              ></path>
            </svg>
          </span>
          <p>home</p>
        </Link>{' '}
        <button
          className="app-menu-item app-menu-open"
          onClick={(e) => {
            e.stopPropagation();
            openMobileMenu();
          }}
        >
          <span className="icon">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M8.33333 2.5H2.5V10H8.33333V2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M17.5 2.5H11.6667V6.66667H17.5V2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M17.5 10H11.6667V17.5H17.5V10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M8.33333 13.3333H2.5V17.5H8.33333V13.3333Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </span>
          <p>category</p>
        </button>{' '}
        <button className="app-menu-item navbar-search-open-btn" onClick={() => openSearch()}>
          <span className="icon">
            <SearchIcon />
          </span>
          <p>search</p>
        </button>{' '}
        <button
          className="app-menu-item cart-drawer-open"
          onClick={(e) => {
            e.stopPropagation();
            openCart();
          }}
        >
          <span className="cart-count">{count}</span>{' '}
          <span className="icon">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M0.833333 0.833333H4.16667L6.4 11.9917C6.4762 12.3753 6.68492 12.72 6.98962 12.9652C7.29432 13.2105 7.67558 13.3408 8.06667 13.3333H16.1667C16.5578 13.3408 16.939 13.2105 17.2437 12.9652C17.5484 12.72 17.7571 12.3753 17.8333 11.9917L19.1667 5H5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <circle
                cx="7.49967"
                cy="17.5002"
                r="1.58333"
                stroke="currentColor"
                strokeWidth="1.5"
              ></circle>
              <circle
                cx="16.6663"
                cy="17.5002"
                r="1.58333"
                stroke="currentColor"
                strokeWidth="1.5"
              ></circle>
            </svg>
          </span>
          <p>cart</p>
        </button>{' '}
        <a className="app-menu-item" href="#">
          <span className="icon">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M16.6667 17.5V15.8333C16.6667 14.9493 16.3155 14.1014 15.6904 13.4763C15.0652 12.8512 14.2174 12.5 13.3333 12.5H6.66667C5.78261 12.5 4.93476 12.8512 4.30964 13.4763C3.68452 14.1014 3.33333 14.9493 3.33333 15.8333V17.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M10 9.16667C11.8409 9.16667 13.3333 7.67428 13.3333 5.83333C13.3333 3.99238 11.8409 2.5 10 2.5C8.15905 2.5 6.66667 3.99238 6.66667 5.83333C6.66667 7.67428 8.15905 9.16667 10 9.16667Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </span>
          <p>account</p>
        </a>
      </div>
    </section>
  );
}
