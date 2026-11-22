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

/** Template footer with the mobile accordion (≤ 992px, one section open at a time). */
export function Footer({ shopLinks }: { shopLinks: ReactNode }) {
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
              <img src={STORE_LOGO} alt="Ehans Mart" loading="lazy" />
            </Link>
            <p className="footer-brand-text">
              ইহান্স মার্ট - আপনার স্মার্ট অনলাইন শপিং পার্টনার। Quality products, honest prices and cash
              on delivery — anywhere in Bangladesh.
            </p>
            <ul className="footer-icons">
              <li>
                <a href="#" aria-label="facebook">
                  <svg viewBox="0 0 320 512" aria-hidden="true">
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a href="#" aria-label="instagram">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                    <circle cx="12" cy="12" r="4"></circle>
                    <circle cx="17.5" cy="6.5" r=".6" fill="currentColor"></circle>
                  </svg>
                </a>
              </li>
              <li>
                <a href="#" aria-label="tiktok">
                  <svg viewBox="0 0 14 16" aria-hidden="true">
                    <path d="M11.0578 2.50667C10.4503 1.81291 10.1155 0.922133 10.1156 0H7.36889V11.0222C7.34814 11.6188 7.09646 12.1841 6.66694 12.5987C6.23742 13.0133 5.66364 13.2448 5.06667 13.2444C3.80444 13.2444 2.75556 12.2133 2.75556 10.9333C2.75556 9.40444 4.23111 8.25778 5.75111 8.72889V5.92C2.68444 5.51111 0 7.89333 0 10.9333C0 13.8933 2.45333 16 5.05778 16C7.84889 16 10.1156 13.7333 10.1156 10.9333V5.34222C11.2293 6.14209 12.5665 6.57124 13.9378 6.56889V3.82222C13.9378 3.82222 12.2667 3.90222 11.0578 2.50667Z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a href="#" aria-label="youtube">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-4.8.5-4.8s0-3.2-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z"></path>
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/8801841650668"
                  target="_blank"
                  rel="noopener"
                  aria-label="whatsapp"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.2l-.9 1.1c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.7-.4ZM12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z"></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <FooterItem title="Shop" index={0} {...item}>
            <ul className="footer-list">{shopLinks}</ul>
          </FooterItem>
          <FooterItem title="Quick Links" index={1} {...item}>
            <ul className="footer-list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/collections">All Products</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/cart">My Cart</Link>
              </li>
            </ul>
          </FooterItem>
          <FooterItem title="Customer Care" index={2} {...item}>
            <ul className="footer-list">
              <li>
                <Link href="/policies/privacy-policy#shipping">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#refund">Refund Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#exchange">Exchange Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy#terms">Terms of Service</Link>
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
              . All rights reserved. Made by{' '}
              <a href="https://qualixe.com/" target="_blank" rel="noopener">
                <strong>Qualixe</strong>
              </a>
              .
            </p>
            <div className="copyright-payments">
              <span className="copyright-payments-label">We accept</span>{' '}
              <span className="copyright-payment">Cash On Delivery</span>{' '}
              <span className="copyright-payment">
                <img src="/assets/images/payment-bkash.png" alt="bKash" loading="lazy" />
              </span>{' '}
              <span className="copyright-payment">
                <img src="/assets/images/payment-nagad.png" alt="Nagad" loading="lazy" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
