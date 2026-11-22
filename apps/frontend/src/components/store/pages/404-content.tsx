// Generated from design/ehans-mart/404.html (markup kept verbatim). Edit freely.
import Link from 'next/link';
import type { ReactNode } from 'react';

export function NotFoundContent({ products }: { products: ReactNode }) {
  return (
    <>
      <section className="about-hero-section notfound-hero-section">
        <div className="container">
          <div className="about-hero-inner">
            <nav className="about-breadcrumb" aria-label="breadcrumb">
              <Link href="/">Home</Link> <span aria-hidden="true">/</span> <span>404</span>
            </nav>
            <div className="notfound-code" aria-hidden="true">
              <span>4</span>{' '}
              <span className="notfound-code-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"></path>
                  <path d="M9 8V6.5a3 3 0 0 1 6 0V8"></path>
                  <path d="M10 14.5c.5-.6 1.2-.9 2-.9s1.5.3 2 .9"></path>
                  <circle cx="10" cy="11.5" r=".6" fill="currentColor"></circle>
                  <circle cx="14" cy="11.5" r=".6" fill="currentColor"></circle>
                </svg>
              </span>{' '}
              <span>4</span>
            </div>
            <h1 className="about-hero-title">
              Oops! This Page Is <span>Out Of Stock</span>
            </h1>
            <p className="about-hero-text">
              দুঃখিত, আপনি যে পেজটি খুঁজছেন সেটি পাওয়া যায়নি। The link may be broken or the page has
              moved — but our best products are still right here.
            </p>
            <div className="about-hero-btns">
              <Link href="/" className="btn about-btn-primary">
                back to home
              </Link>{' '}
              <Link href="/collections" className="btn about-btn-outline">
                shop all products
              </Link>
            </div>
            <form className="notfound-search" role="search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-3.5-3.5"></path>
              </svg>{' '}
              <input
                type="search"
                name="q"
                className="notfound-search-input"
                placeholder="Search for products…"
                aria-label="Search products"
              />{' '}
              <button type="submit" className="btn notfound-search-btn">
                search
              </button>
            </form>
            <div className="notfound-tags">
              <span>Popular:</span>{' '}
              <button type="button" data-search-open="apron">
                Apron
              </button>{' '}
              <button type="button" data-search-open="baby safety">
                Baby Safety
              </button>{' '}
              <button type="button" data-search-open="hair clip">
                Hair Clip
              </button>{' '}
              <button type="button" data-search-open="kitchen">
                Kitchen
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="notfound-links-section">
        <div className="container">
          <div className="notfound-links-items">
            <Link href="/collections" className="notfound-links-item">
              <span className="notfound-links-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"></path>
                  <path d="M9 8V6.5a3 3 0 0 1 6 0V8"></path>
                </svg>
              </span>
              <p className="notfound-links-title">Shop Products</p>
              <p className="notfound-links-text">Browse all our useful everyday products.</p>
            </Link>{' '}
            <Link href="/faq" className="notfound-links-item">
              <span className="notfound-links-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"></path>
                  <circle cx="12" cy="17" r=".6" fill="currentColor"></circle>
                </svg>
              </span>
              <p className="notfound-links-title">Help Center</p>
              <p className="notfound-links-text">Quick answers about orders and delivery.</p>
            </Link>{' '}
            <Link href="/policies/privacy-policy#refund" className="notfound-links-item">
              <span className="notfound-links-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"></path>
                </svg>
              </span>
              <p className="notfound-links-title">Return & Refund</p>
              <p className="notfound-links-text">7 days easy return — no stress, no hassle.</p>
            </Link>{' '}
            <Link href="/contact" className="notfound-links-item">
              <span className="notfound-links-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6.6 3.5 9 3l2 4-2 1.5a13 13 0 0 0 6.5 6.5L17 13l4 2-.5 2.4a3 3 0 0 1-3.2 2.4C10.4 19 5 13.6 4.2 6.7A3 3 0 0 1 6.6 3.5Z"></path>
                </svg>
              </span>
              <p className="notfound-links-title">Contact Us</p>
              <p className="notfound-links-text">Call or WhatsApp us 24/7 for help.</p>
            </Link>
          </div>
        </div>
      </section>
      <section className="about-category-section notfound-category-section">
        <div className="container">
          <div className="about-heading about-heading-row">
            <div>
              <p className="about-subtitle">explore</p>
              <h2 className="about-title">Shop By Category</h2>
            </div>
            <Link href="/collections" className="btn about-view-all">
              view all
            </Link>
          </div>
          <div className="about-category-items">
            <Link href="/collections" className="about-category-item">
              <img src="/assets/images/category-baby-care.jpg" alt="Baby Care" loading="lazy" />{' '}
              <span className="about-category-name">Baby Care</span>
            </Link>{' '}
            <Link href="/collections" className="about-category-item">
              <img
                src="/assets/images/category-home-kitchen.jpg"
                alt="Home & Kitchen"
                loading="lazy"
              />{' '}
              <span className="about-category-name">Home & Kitchen</span>
            </Link>{' '}
            <Link href="/collections" className="about-category-item">
              <img
                src="/assets/images/category-womens-essentials.jpg"
                alt="Women’s Essentials"
                loading="lazy"
              />{' '}
              <span className="about-category-name">Women’s Essentials</span>
            </Link>{' '}
            <Link href="/collections" className="about-category-item">
              <img
                src="/assets/images/category-mens-essentials.jpg"
                alt="Man’s Essentials"
                loading="lazy"
              />{' '}
              <span className="about-category-name">Man’s Essentials</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="notfound-products-section">
        <div className="container">
          <div className="about-heading about-heading-row">
            <div>
              <p className="about-subtitle">customer favourites</p>
              <h2 className="about-title">Popular Right Now</h2>
            </div>
            <Link href="/collections" className="btn about-view-all">
              view all products
            </Link>
          </div>
          <div className="notfound-products-items">{products}</div>
        </div>
      </section>
    </>
  );
}
