'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

const PAGES: NavItem[] = [
  { label: 'About Us', href: '/about' },
  {
    label: 'Blog',
    href: '/blog',
    children: [
      { label: 'Blog Page', href: '/blog' },
      { label: 'Blog Details', href: '/blog/sample-post' },
    ],
  },
  {
    label: 'Help Center',
    href: '/faq',
    children: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact Us', href: '/contact' },
      {
        label: 'Policies',
        href: '/policies/privacy-policy',
        children: [
          { label: 'Shipping Policy', href: '/policies/privacy-policy#shipping' },
          { label: 'Refund Policy', href: '/policies/privacy-policy#refund' },
          { label: 'Exchange Policy', href: '/policies/privacy-policy#exchange' },
          { label: 'Privacy Policy', href: '/policies/privacy-policy#privacy' },
          { label: 'Terms of Service', href: '/policies/privacy-policy#terms' },
        ],
      },
    ],
  },
  { label: 'Cart', href: '/cart' },
  { label: '404 Page', href: '/404' },
];

function Items({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((item) => (
        <li key={item.label} className={`nav-dropdown-item${item.children ? ' has-sub' : ''}`}>
          <Link href={item.href}>
            {item.label}
            {item.children ? (
              <>
                {' '}
                <ChevronRightIcon className="nav-dropdown-sub-arrow" />
              </>
            ) : null}
          </Link>
          {item.children ? (
            <ul className="nav-dropdown-menu nav-dropdown-sub">
              <Items items={item.children} />
            </ul>
          ) : null}
        </li>
      ))}
    </>
  );
}

/** "pages" dropdown with viewport-aware placement (template nav-dropdown). */
export function NavDropdown() {
  const ref = useRef<HTMLLIElement>(null);
  const [expanded, setExpanded] = useState(false);

  const place = () => {
    const dropdown = ref.current;
    const menu = dropdown?.querySelector<HTMLElement>(':scope > .nav-dropdown-menu');
    if (!dropdown || !menu) return;
    const viewW = document.documentElement.clientWidth - 12;
    const gap = 15;
    dropdown.classList.remove('align-right', 'subs-left');
    const rect = dropdown.getBoundingClientRect();
    const menuW = menu.offsetWidth;
    const subW = Math.max(
      ...[...dropdown.querySelectorAll<HTMLElement>('.nav-dropdown-sub')].map((s) => s.offsetWidth),
      menuW,
    );
    const depth = (m: Element): number =>
      1 +
      Math.max(0, ...[...m.querySelectorAll(':scope > .has-sub > .nav-dropdown-sub')].map(depth));
    const levels = depth(menu) - 1;
    const alignRight = rect.left + menuW > viewW;
    dropdown.classList.toggle('align-right', alignRight);
    const menuLeft = alignRight ? rect.right - menuW : rect.left;
    dropdown.classList.toggle('subs-left', menuLeft + menuW + levels * (subW + gap) > viewW);
  };

  useEffect(() => {
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  return (
    <li
      ref={ref}
      className="navbar-link nav-dropdown"
      onMouseEnter={() => {
        place();
        setExpanded(true);
      }}
      onMouseLeave={() => setExpanded(Boolean(ref.current?.contains(document.activeElement)))}
      onFocus={place}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setExpanded(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement | null)?.blur();
          setExpanded(false);
        }
      }}
    >
      <button
        type="button"
        className="navbar-link-btn nav-dropdown-btn"
        aria-haspopup="true"
        aria-expanded={expanded}
        onFocus={() => setExpanded(true)}
      >
        pages <ChevronDownIcon className="nav-dropdown-arrow" />
      </button>
      <ul className="nav-dropdown-menu">
        <Items items={PAGES} />
      </ul>
    </li>
  );
}
