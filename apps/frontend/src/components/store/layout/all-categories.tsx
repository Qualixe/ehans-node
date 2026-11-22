'use client';

import type { CategoryNode } from '@ehans/shared';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { collectionUrl } from '@/lib/format';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';

/** "All Categories" button + panel (template all-categories megamenu). */
export function AllCategories({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(categories[0]?.slug ?? '');
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
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`all-categories-tab${active === c.slug ? ' active' : ''}`}
                data-all-cat={c.slug}
                onMouseEnter={() => setActive(c.slug)}
                onClick={() => setActive(c.slug)}
              >
                <span>{c.name}</span> <ChevronRightIcon />
              </button>
            </li>
          ))}
        </ul>
        <div className="all-categories-panels">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`all-categories-panel${active === c.slug ? ' active' : ''}`}
              data-all-cat={c.slug}
            >
              <div className="all-categories-content">
                <div className="all-categories-head">
                  <p className="all-categories-title">{c.name}</p>
                  <Link href={collectionUrl(c.slug)} className="all-categories-view">
                    view all <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <ul className="all-categories-links">
                  {c.children.map((child) => (
                    <li key={child.id}>
                      <Link href={collectionUrl(child.slug)}>{child.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={collectionUrl(c.slug)} className="all-categories-promo">
                {c.image ? <img src={c.image} alt={c.name} loading="lazy" /> : null}{' '}
                <span className="all-categories-promo-content">
                  <span className="all-categories-promo-label">explore</span>{' '}
                  <span className="all-categories-promo-title">{c.name}</span>{' '}
                  {c.description ? (
                    <span className="all-categories-promo-text">{c.description}</span>
                  ) : null}{' '}
                  <span className="all-categories-promo-btn">
                    shop now <span aria-hidden="true">→</span>
                  </span>{' '}
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
                    </span>{' '}
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
          ))}
        </div>
      </div>
    </li>
  );
}
