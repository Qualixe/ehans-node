import type { CategoryNode } from '@ehans/shared';
import Link from 'next/link';
import { collectionUrl } from '@/lib/format';
import { AllCategories } from './all-categories';
import { NavDropdown } from './nav-dropdown';

// the nav row must fit the header width (the template grid widens the logo/icon columns otherwise)
const NAV_CATEGORIES = 5;
const COLUMN_SIZE = 6;

/** Desktop navigation row: All Categories, top categories with megamenus, pages dropdown. */
export function HeaderMenus({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="navbar-links">
      <AllCategories categories={categories} />
      {categories.slice(0, NAV_CATEGORIES).map((c) => {
        const columns: CategoryNode['children'][] = [];
        for (let i = 0; i < c.children.length; i += COLUMN_SIZE)
          columns.push(c.children.slice(i, i + COLUMN_SIZE));
        return (
          <li key={c.id} className="navbar-link">
            <p className="navbar-link-btn">{c.name}</p>
            <div className="megamenu">
              <div className="megamenu-items">
                {columns.map((col, i) => (
                  <div key={i} className="megamenu-item">
                    {/* plain text like the template (a link here would switch to the link font) */}
                    <h6 className="megamenu-item-title">{i === 0 ? c.name : `More ${c.name}`}</h6>
                    <ul>
                      {col.map((child) => (
                        <li key={child.id}>
                          <Link href={collectionUrl(child.slug)}>{child.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </li>
        );
      })}
      <NavDropdown />
    </ul>
  );
}

/** Same row without data (static shell while categories stream in); same height as the real row. */
export function HeaderMenusFallback() {
  return (
    <ul className="navbar-links">
      <AllCategories categories={[]} />
      <NavDropdown />
    </ul>
  );
}
