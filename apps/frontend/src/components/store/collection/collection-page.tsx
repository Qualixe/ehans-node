import type { CategoryNode, CategorySummary } from '@ehans/shared';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getCategories, getProducts } from '@/lib/catalog';
import { CollectionCategorySection } from '../collection-category-section';
import { CollectionView } from './collection-view';

const MAX_PRODUCTS = 100;

interface Resolved {
  title: string;
  category: CategorySummary | null;
  parent: CategoryNode | null;
  sliderCategories: CategorySummary[];
}

/** Finds the category (top-level or sub-category) for a slug. */
export function resolveCategory(tree: CategoryNode[], slug?: string): Resolved | null {
  if (!slug) return { title: 'All Products', category: null, parent: null, sliderCategories: tree };
  for (const top of tree) {
    if (top.slug === slug)
      return { title: top.name, category: top, parent: top, sliderCategories: top.children };
    const child = top.children.find((c) => c.slug === slug);
    if (child)
      return { title: child.name, category: child, parent: top, sliderCategories: top.children };
  }
  return null;
}

export async function CollectionPage({ slug, q }: { slug?: string; q?: string }) {
  await connection();
  const tree = await getCategories();
  const resolved = resolveCategory(tree, slug);
  if (!resolved) notFound();

  const search = q?.trim() || undefined;
  const list = await getProducts({ category: slug, q: search, pageSize: MAX_PRODUCTS });
  const title = search ? `Search: “${search}”` : resolved.title;

  // Category filter: top categories on "all", sub-categories inside a category (only those with products).
  const groups = slug
    ? (resolved.parent?.children ?? []).map((c) => ({ ...c, memberIds: [c.id] }))
    : tree.map((c) => ({ ...c, memberIds: [c.id, ...c.children.map((ch) => ch.id)] }));
  const categoryOptions = groups.filter((g) =>
    list.items.some((p) => g.memberIds.includes(p.category.id)),
  );

  return (
    <>
      <CollectionCategorySection
        heading={
          <>
            <h1 className="title h5">{title}</h1>
            <span className="category-heading-separator"></span>
            <span className="collection-count">
              {list.total} Product{list.total === 1 ? '' : 's'}
            </span>
          </>
        }
        categories={resolved.sliderCategories}
      />
      <CollectionView
        products={list.items}
        categoryOptions={categoryOptions}
        promo={resolved.parent ?? tree[0] ?? null}
      />
    </>
  );
}
