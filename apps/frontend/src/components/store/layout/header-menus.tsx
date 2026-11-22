import Link from 'next/link';
import { CATEGORY_GROUPS, HEADER_LINKS } from '@/lib/store-nav';
import { AllCategories } from './all-categories';

/** Desktop navigation row, as on the live theme: All Categories, then the menu links with megamenus. */
export function HeaderMenus() {
  return (
    <ul className="navbar-links">
      <AllCategories groups={CATEGORY_GROUPS} />
      {HEADER_LINKS.map((link) => (
        <li key={link.label} className="navbar-link">
          <Link href={link.href} className="navbar-link-btn">
            {link.label}
          </Link>
          {link.columns.length ? (
            <div className="megamenu">
              <div className="megamenu-items">
                {link.columns.map((col) => (
                  <div key={col.title} className="megamenu-item">
                    <h6 className="megamenu-item-title">
                      <Link href={col.href}>{col.title}</Link>
                    </h6>
                    {col.links.length ? (
                      <ul>
                        {col.links.map((l) => (
                          <li key={l.label}>
                            <Link href={l.href}>{l.label}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
