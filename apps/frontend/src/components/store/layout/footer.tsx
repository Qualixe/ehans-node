'use client';

import Link from 'next/link';
import { STORE_LOGO } from '@/lib/home-media';
import { type ReactNode, useRef, useState } from 'react';
import { useCurrentYear, useMediaQuery } from '../hooks';

const BREAKPOINT = '(max-width: 992px)';

function FooterItem({
  title,
  index,
  openIndex,
  setOpen,
  mobile,
  children,
}: {
  title: string;
  index: number;
  openIndex: number | null;
  setOpen: (i: number | null) => void;
  mobile: boolean;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const active = mobile && openIndex === index;
  // desktop: no inline max-height; mobile: 0 when closed, content height when open
  const maxHeight = !mobile ? undefined : active ? `${height}px` : '0px';

  return (
    <div className={`footer-item${active ? ' active' : ''}`}>
      <h2
        className="footer-item-title"
        onClick={
          mobile
            ? () => {
                setHeight(contentRef.current?.scrollHeight ?? 0);
                setOpen(active ? null : index);
              }
            : undefined
        }
      >
        <span>{title}</span>{' '}
        <span className="icon">
          <span className="plus">+</span> <span className="minus">-</span>
        </span>
      </h2>
      <div className="footer-content" ref={contentRef} style={{ maxHeight }}>
        {children}
      </div>
    </div>
  );
}

/** Live ehansmart.com footer with the template's mobile accordion (≤ 992px, one section open at a time). */
export function Footer() {
  const mobile = useMediaQuery(BREAKPOINT);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [lastMobile, setLastMobile] = useState(mobile);
  // the template ships "2026" in the HTML and updates it in the browser
  const year = useCurrentYear(2026);

  // crossing the breakpoint closes every section (template behaviour)
  if (mobile !== lastMobile) {
    setLastMobile(mobile);
    setOpenIndex(null);
  }

  const item = { openIndex, setOpen: setOpenIndex, mobile };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-items">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <img src={STORE_LOGO} alt="Ehans Mart" width={300} height={71} loading="lazy" />
            </Link>
            <p className="footer-brand-text">
              ইহান্স মার্ট - আপনার স্মার্ট অনলাইন শপিং পার্টনার। Quality products, honest prices and cash
              on delivery — anywhere in Bangladesh.
            </p>
          </div>
          <FooterItem title="Shop" index={0} {...item}>
            <ul className="footer-list">
              <li>
                <Link href="/collections/baby-care">Baby Care</Link>
              </li>
              <li>
                <Link href="/collections/women-s-essentials">Women’s Essentials</Link>
              </li>
              <li>
                <Link href="/collections/man-s-essentials">Man’s Essentials</Link>
              </li>
              <li>
                <Link href="/collections/lifestyle">Lifestyle</Link>
              </li>
            </ul>
          </FooterItem>
          <FooterItem title="Quick Links" index={1} {...item}>
            <ul className="footer-list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/collections">All products</Link>
              </li>
              <li>
                <Link href="/about">About us</Link>
              </li>
              <li>
                <Link href="/blog">Blogs</Link>
              </li>
              <li>
                <Link href="/contact">Contact us</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/cart">My cart</Link>
              </li>
            </ul>
          </FooterItem>
          <FooterItem title="Customer Care" index={2} {...item}>
            <ul className="footer-list">
              <li>
                <Link href="/policies/privacy-policy#shipping">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#refund">Return Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#exchange">Exchange Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#terms">Terms Of Service</Link>
              </li>
            </ul>
          </FooterItem>
          <FooterItem title="Get In Touch" index={3} {...item}>
            <ul className="footer-contact">
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z"></path>
                  <circle cx="12" cy="9.5" r="2.5"></circle>
                </svg>{' '}
                <span>Kaunia, Rangpur 5400, Bangladesh</span>
              </li>
              <li>
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
                </svg>{' '}
                <a href="tel:+8801841650668">+8801841650668</a>
              </li>
              <li>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 7 9 6 9-6"></path>
                </svg>{' '}
                <a href="mailto:info@ehansmart.com">info@ehansmart.com</a>
              </li>
              <li>
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
                  <path d="M12 7v5l3 2"></path>
                </svg>{' '}
                <span>Open 24 hours, 7 days a week</span>
              </li>
            </ul>
          </FooterItem>
        </div>
      </div>
      <div className="copyright-area">
        <div className="container">
          <div className="copyright-content">
            <p className="copyright-text">
              © <span className="copyright-year">{year}</span>{' '}
              <Link href="/">
                <strong>Ehans Mart</strong>
              </Link>
              . All rights reserved. Made By{' '}
              <a href="https://qualixe.com/" target="_blank" rel="noopener">
                qualixe
              </a>
            </p>
            <div className="copyright-payments">
              <span className="copyright-payments-label">We accept</span>{' '}
              <span className="copyright-payment">Cash On Delivery</span>{' '}
              <span className="copyright-payment">
                <img
                  src="/assets/images/payment-bkash.png"
                  alt="bKash"
                  height={30}
                  loading="lazy"
                />
              </span>{' '}
              <span className="copyright-payment">
                <img
                  src="/assets/images/payment-nagad.png"
                  alt="Nagad"
                  height={30}
                  loading="lazy"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
