'use client';

import Link from 'next/link';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_GROUPS } from '@/lib/store-nav';
import { useStoreUi } from '../providers/store-ui';
import { useIsClient } from '../hooks';
import { BackArrowIcon, SearchIcon } from '../icons';

const groups = CATEGORY_GROUPS.map((g) => ({ ...g, id: g.href.split('/').pop() ?? g.title }));

/** Off-canvas category browser (live "mobile-menu"): group tabs on the left, scroll-spy tiles. */
export function MobileMenu() {
  const { panel, closePanel, openSearch } = useStoreUi();
  const open = panel === 'mobile-menu';
  const mounted = useIsClient();
  const [active, setActive] = useState(groups[0]?.id ?? '');
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
  }, [mounted]);

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

  const content = (
    <div className={`mobile-menu-wrap${open ? ' active' : ''}`}>
      <div className="mobile-menu-close-window-btn" onClick={closePanel}></div>
      <div className={`mobile-menu-container${open ? ' active' : ''}`}>
        <div className="mobile-menu-top">
          <button
            className="mobile-menu-close-btn"
            type="button"
            aria-label="Close"
            onClick={closePanel}
          >
            <BackArrowIcon />
          </button>
          <p className="mobile-menu-title">all categories</p>
          <button
            className="mobile-menu-search navbar-search-open-btn"
            type="button"
            aria-label="Search"
            onClick={() => openSearch()}
          >
            <SearchIcon />
          </button>
        </div>
        <div className="mobile-menu-inner">
          <div className="mobile-menu-tabs">
            {groups.map((g) => (
              <a
                key={g.id}
                ref={(el) => {
                  tabsRef.current[g.id] = el;
                }}
                href={`#mm-${g.id}`}
                className={`mobile-menu-tab${active === g.id ? ' active' : ''}`}
                onClick={(e) => onTab(e, g.id)}
              >
                <span className="mobile-menu-tab-img">
                  {g.image ? <img src={g.image} alt="" width={60} height={60} /> : null}
                </span>{' '}
                <span className="mobile-menu-tab-title">{g.title}</span>
              </a>
            ))}
          </div>
          <div className="mobile-menu-tabs-contents" ref={containerRef}>
            {groups.map((g) => (
              <div key={g.id} className="mobile-menu-tabs-content" id={`mm-${g.id}`}>
                <div className="mobile-menu-tabs-content-heading">
                  <p className="title">{g.title}</p>
                  <span className="line"></span>
                </div>
                <div className="mobile-menu-tabs-content-items">
                  {g.links.length ? (
                    <div className="mobile-menu-tabs-content-item">
                      <div className="mobile-menu-tabs-content-item-grids">
                        {g.links.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="mobile-menu-tabs-content-item-grid"
                          >
                            <span className="mobile-menu-tabs-content-item-grid-img">
                              {l.image ? (
                                <img src={l.image} alt="" width={240} height={240} loading="lazy" />
                              ) : null}
                            </span>{' '}
                            <span className="mobile-menu-tabs-content-item-grid-title">
                              {l.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
