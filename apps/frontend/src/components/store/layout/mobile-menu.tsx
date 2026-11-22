'use client';

import type { CategoryNode } from '@ehans/shared';
import Link from 'next/link';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collectionUrl } from '@/lib/format';
import { useStoreUi } from '../providers/store-ui';
import { useIsClient } from '../hooks';
import { BackArrowIcon, SearchIcon } from '../icons';

const GRID_SIZE = 6;

/** Off-canvas category browser (template "mobile-menu"): tabs on the left, scroll-spy content. */
export function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const { panel, closePanel, openSearch } = useStoreUi();
  const open = panel === 'mobile-menu';
  const mounted = useIsClient();
  const [active, setActive] = useState(categories[0]?.slug ?? '');
  const containerRef = useRef<HTMLDivElement>(null);
  const clickScroll = useRef(false);
  const tabsRef = useRef<Record<string, HTMLAnchorElement | null>>({});

  // scroll-spy: highlight the tab whose content is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mounted) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScroll.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id.replace(/^mm-/, ''));
      },
      { root: container, rootMargin: '-10% 0px -55% 0px', threshold: [0.15, 0.3, 0.5, 0.75] },
    );
    container.querySelectorAll('.mobile-menu-tabs-content').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted, categories]);

  useEffect(() => {
    tabsRef.current[active]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active]);

  const onTab = (e: MouseEvent, slug: string) => {
    e.preventDefault();
    const container = containerRef.current;
    const target = document.getElementById(`mm-${slug}`);
    if (!container || !target) return;
    clickScroll.current = true;
    setActive(slug);
    container.scrollTo({ top: target.offsetTop - container.offsetTop - 12, behavior: 'smooth' });
    window.setTimeout(() => (clickScroll.current = false), 2000);
  };

  const chunks = (list: CategoryNode['children']) => {
    const out: CategoryNode['children'][] = [];
    for (let i = 0; i < list.length; i += GRID_SIZE - 1) out.push(list.slice(i, i + GRID_SIZE - 1));
    return out.length ? out : [[]];
  };

  const content = (
    <div className={`mobile-menu-wrap${open ? ' active' : ''}`}>
      <div className="mobile-menu-close-window-btn" onClick={closePanel}></div>
      <div className={`mobile-menu-container${open ? ' active' : ''}`}>
        <div className="mobile-menu-top">
          <button className="mobile-menu-close-btn" type="button" onClick={closePanel}>
            <BackArrowIcon />
          </button>
          <p className="mobile-menu-title">all categories</p>
          <button
            className="mobile-menu-search navbar-search-open-btn"
            onClick={() => openSearch()}
          >
            <SearchIcon />
          </button>
        </div>
        <div className="mobile-menu-inner">
          <div className="mobile-menu-tabs">
            {categories.map((c) => (
              <a
                key={c.id}
                ref={(el) => {
                  tabsRef.current[c.slug] = el;
                }}
                href={`#mm-${c.slug}`}
                className={`mobile-menu-tab${active === c.slug ? ' active' : ''}`}
                onClick={(e) => onTab(e, c.slug)}
              >
                <span className="mobile-menu-tab-img">
                  {c.image ? <img src={c.image} alt={c.name} /> : null}
                </span>{' '}
                <span className="mobile-menu-tab-title">{c.name}</span>
              </a>
            ))}
          </div>
          <div className="mobile-menu-tabs-contents" ref={containerRef}>
            {categories.map((c) => (
              <div key={c.id} className="mobile-menu-tabs-content" id={`mm-${c.slug}`}>
                <div className="mobile-menu-tabs-content-heading">
                  <p className="title">{c.name}</p>
                  <span className="line"></span>
                </div>
                <div className="mobile-menu-tabs-content-items">
                  {chunks(c.children).map((group, gi) => (
                    <div key={gi} className="mobile-menu-tabs-content-item">
                      <p className="mobile-menu-tabs-content-item-title">
                        {gi === 0 ? `Shop ${c.name}` : `More in ${c.name}`}
                      </p>
                      <div className="mobile-menu-tabs-content-item-grids">
                        {gi === 0 ? (
                          <Link
                            href={collectionUrl(c.slug)}
                            className="mobile-menu-tabs-content-item-grid"
                          >
                            <span className="mobile-menu-tabs-content-item-grid-img">
                              {c.image ? <img src={c.image} alt={c.name} /> : null}
                            </span>{' '}
                            <span className="mobile-menu-tabs-content-item-grid-title">
                              view all {c.name}
                            </span>
                          </Link>
                        ) : null}
                        {group.map((child) => (
                          <Link
                            key={child.id}
                            href={collectionUrl(child.slug)}
                            className="mobile-menu-tabs-content-item-grid"
                          >
                            <span className="mobile-menu-tabs-content-item-grid-img">
                              {child.image ? <img src={child.image} alt={child.name} /> : null}
                            </span>{' '}
                            <span className="mobile-menu-tabs-content-item-grid-title">
                              {child.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
