'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CategoryGroup } from '@/lib/store-nav';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';

/** "All Categories" button + menu (live theme markup: each panel sits in its tab's item). */
export function AllCategories({ groups }: { groups: CategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(groups[0]?.href ?? '');
  const wrapRef = useRef<HTMLLIElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen((was) => {
          if (was) btnRef.current?.focus();
          return false;
        });
      }
    };
    // header hides on scroll down → close the menu
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains('page-scroll-down')) setOpen(false);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <li className={`navbar-link all-categories${open ? ' active' : ''}`} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="all-categories-btn"
        aria-expanded={open}
        aria-controls="all-categories-menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16"></path>
        </svg>{' '}
        <span>All Categories</span> <ChevronDownIcon className="all-categories-btn-arrow" />
      </button>
      <div className="all-categories-menu" id="all-categories-menu">
        <ul className="all-categories-list">
          {groups.map((g) => (
            <li key={g.href} className="all-categories-item">
              <button
                type="button"
                className={`all-categories-tab${active === g.href ? ' active' : ''}`}
                data-all-cat={g.href}
                onMouseEnter={() => setActive(g.href)}
                onFocus={() => setActive(g.href)}
                onClick={() => setActive(g.href)}
              >
                <span>{g.title}</span> <ChevronRightIcon />
              </button>
              <div
                className={`all-categories-panel${active === g.href ? ' active' : ''}`}
                data-all-cat={g.href}
              >
                <div className="all-categories-content">
                  <div className="all-categories-head">
                    <p className="all-categories-title">{g.title}</p>
                    <Link href={g.href} className="all-categories-view">
                      View all <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                  {g.links.length ? (
                    <ul className="all-categories-links">
                      {g.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href}>{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <Link href={g.href} className="all-categories-promo">
                  {g.image ? (
                    <img src={g.image} alt={g.title} width={560} height={560} loading="lazy" />
                  ) : null}{' '}
                  <span className="all-categories-promo-content">
                    <span className="all-categories-promo-label">explore</span>{' '}
                    <span className="all-categories-promo-title">{g.title}</span>
                    <span className="all-categories-promo-btn">
                      shop now <span aria-hidden="true">→</span>
                    </span>
                    <span className="all-categories-promo-features">
                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="2.5" y="6" width="19" height="12" rx="2"></rect>
                          <circle cx="12" cy="12" r="2.5"></circle>
                        </svg>{' '}
                        100% Cash on Delivery
                      </span>
                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"></path>
                          <circle cx="7" cy="17.5" r="1.8"></circle>
                          <circle cx="17" cy="17.5" r="1.8"></circle>
                        </svg>{' '}
                        Fast home delivery
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
