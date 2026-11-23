'use client';

import type {
  AdminCrossSellItem,
  AdminProductDetail,
  AdminProductInput,
  AdminProductOption,
  AdminProductSuggestions,
  AdminVariantInput,
} from '@ehans/shared';
import Link from 'next/link';
import { startTransition, useActionState, useMemo, useState } from 'react';
import type { ProductFormState } from '@/app/admin/(panel)/products/form-actions';
import { money } from '@/lib/admin/format';
import { FormErrors } from './feedback';
import { AdminIcon } from './icon';
import { type MediaState, MediaGrid } from './media-grid';
import { RichTextEditor } from './rich-text-editor';
import { VariantsEditor } from './variants-editor';
import { CrossSellPicker } from './cross-sell-picker';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const EMPTY_VARIANT: AdminVariantInput = {
  id: null,
  options: [],
  price: 0,
  compareAtPrice: null,
  costPerItem: null,
  sku: null,
  barcode: null,
  stock: 0,
  weightGrams: null,
  imageId: null,
};

const intOrNull = (value: string): number | null =>
  value === '' ? null : Math.max(0, Math.round(Number(value)));

/** glowy admin/products/form (add + edit). */
export function ProductForm({
  product,
  categories,
  suggestions,
  action,
  deleteAction,
  searchProducts,
  readOnly,
}: {
  product: AdminProductDetail | null;
  categories: { id: string; name: string; depth: number }[];
  suggestions: AdminProductSuggestions;
  action: (prev: ProductFormState, form: FormData) => Promise<ProductFormState>;
  deleteAction?: () => Promise<void>;
  /** Catalog search for the cross-sell pickers. */
  searchProducts: (q: string) => Promise<AdminCrossSellItem[]>;
  readOnly: boolean;
}) {
  const editing = product !== null;
  const [state, formAction, pending] = useActionState(action, {});
  const [dirty, setDirty] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const [f, setF] = useState(() => ({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    slugTouched: editing,
    sku: product?.sku ?? suggestions.nextSku,
    categoryId: product?.categoryId ?? '',
    collectionIds: product?.collectionIds ?? [],
    brand: product?.brand ?? '',
    productType: product?.productType ?? '',
    tags: (product?.tags ?? []).join(', '),
    shortDescription: product?.shortDescription ?? '',
    description: product?.description ?? '',
    status: product ? (product.isActive ? 'active' : 'draft') : 'active',
    isFeatured: product?.isFeatured ?? false,
    metaTitle: product?.metaTitle ?? '',
    metaDescription: product?.metaDescription ?? '',
    buyWithTitle: product?.buyWithTitle ?? '',
    upsellTitle: product?.upsellTitle ?? '',
  }));
  const [options, setOptions] = useState<AdminProductOption[]>(product?.options ?? []);
  const [variants, setVariants] = useState<AdminVariantInput[]>(
    product?.variants.map((v) => ({ ...v, id: v.id || null })) ?? [EMPTY_VARIANT],
  );
  const [buyWith, setBuyWith] = useState<AdminCrossSellItem[]>(product?.buyWith ?? []);
  const [upsells, setUpsells] = useState<AdminCrossSellItem[]>(product?.upsells ?? []);
  const [media, setMedia] = useState<MediaState>({
    existing: (product?.images ?? []).map((i) => ({ ...i, remove: false })),
    added: [],
  });

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => {
    setDirty(true);
    setF((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !prev.slugTouched) next.slug = slugify(String(value));
      return next;
    });
  };
  const single = variants[0] ?? EMPTY_VARIANT;
  const setSingle = (patch: Partial<AdminVariantInput>) => {
    setDirty(true);
    setVariants([{ ...single, ...patch, options: [] }]);
  };
  const profit = single.costPerItem !== null ? single.price - single.costPerItem : null;
  const keptImages = useMemo(() => media.existing.filter((i) => !i.remove), [media.existing]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input: AdminProductInput = {
      name: f.name,
      slug: f.slug || null,
      sku: f.sku || null,
      categoryId: f.categoryId,
      collectionIds: f.collectionIds.filter((c) => c !== f.categoryId),
      brand: f.brand || null,
      productType: f.productType || null,
      tags: f.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      shortDescription: f.shortDescription || null,
      description: f.description || null,
      isActive: f.status === 'active',
      isFeatured: f.isFeatured,
      metaTitle: f.metaTitle || null,
      metaDescription: f.metaDescription || null,
      imageOrder: media.existing.map((i) => i.id),
      removeImages: media.existing.filter((i) => i.remove).map((i) => i.id),
      options,
      variants: options.length ? variants : [{ ...single, options: [] }],
      buyWithIds: buyWith.map((p) => p.id),
      upsellIds: upsells.map((p) => p.id),
      buyWithTitle: f.buyWithTitle || null,
      upsellTitle: f.upsellTitle || null,
    };
    const fd = new FormData();
    fd.set('data', JSON.stringify(input));
    for (const file of media.added) fd.append('images', file, file.name);
    startTransition(() => formAction(fd));
  };

  const label = 'mb-1.5 block text-sm text-slate-300';
  const disabled = readOnly || pending;

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl" noValidate>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/products"
          className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-ink-800 hover:text-fg"
          aria-label="Back to products"
        >
          <AdminIcon name="chevron-right" className="size-4 rotate-180" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold text-fg">
          {editing ? product.name : 'Add product'}
        </h1>
        {editing ? (
          <>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-ink-700 text-slate-300'}`}
            >
              {product.isActive ? 'Active' : 'Draft'}
            </span>
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener"
              className="admin-btn-secondary h-9"
            >
              <AdminIcon name="eye" className="size-4" /> Preview
            </a>
          </>
        ) : null}
      </div>

      <FormErrors errors={state.errors} />

      <fieldset disabled={disabled} className="contents">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <section className="admin-card space-y-4 p-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-200">
                  Title
                </label>
                <input
                  id="name"
                  value={f.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                  maxLength={200}
                  className="admin-input"
                  placeholder="Short sleeve t-shirt"
                />
              </div>
              <div>
                <label
                  id="description-label"
                  className="mb-1.5 block text-sm font-medium text-slate-200"
                >
                  Description
                </label>
                <RichTextEditor
                  value={f.description}
                  onChange={(html) => set('description', html)}
                  labelId="description-label"
                  disabled={disabled}
                />
              </div>
              <div>
                <label
                  htmlFor="shortDescription"
                  className="mb-1.5 block text-sm font-medium text-slate-200"
                >
                  Summary{' '}
                  <span className="font-normal text-slate-500">· shown next to the price</span>
                </label>
                <textarea
                  id="shortDescription"
                  rows={2}
                  maxLength={500}
                  className="admin-input"
                  value={f.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                />
              </div>
            </section>

            <section className="admin-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-fg">Media</h2>
              <MediaGrid
                value={media}
                onChange={(next) => {
                  setDirty(true);
                  setMedia(next);
                }}
                disabled={disabled}
              />
            </section>

            {options.length ? null : (
              <div className="space-y-5">
                <section className="admin-card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-fg">Pricing</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={label} htmlFor="dv-price">
                        Price
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">
                          ৳
                        </span>
                        <input
                          id="dv-price"
                          type="number"
                          min={0}
                          className="admin-input pl-7"
                          value={single.price}
                          onChange={(e) => setSingle({ price: intOrNull(e.target.value) ?? 0 })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={label} htmlFor="dv-compare">
                        Compare-at price
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">
                          ৳
                        </span>
                        <input
                          id="dv-compare"
                          type="number"
                          min={0}
                          className="admin-input pl-7"
                          value={single.compareAtPrice ?? ''}
                          onChange={(e) => setSingle({ compareAtPrice: intOrNull(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-ink-600 pt-4 sm:grid-cols-3">
                    <div>
                      <label className={label} htmlFor="dv-cost">
                        Cost per item
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-slate-500">
                          ৳
                        </span>
                        <input
                          id="dv-cost"
                          type="number"
                          min={0}
                          className="admin-input pl-7"
                          value={single.costPerItem ?? ''}
                          onChange={(e) => setSingle({ costPerItem: intOrNull(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm text-slate-300">Profit</p>
                      <p className="py-2 text-sm text-slate-400">
                        {profit === null ? '—' : money(profit)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm text-slate-300">Margin</p>
                      <p className="py-2 text-sm text-slate-400">
                        {profit === null || single.price <= 0
                          ? '—'
                          : `${((profit / single.price) * 100).toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Customers won&apos;t see the cost per item.
                  </p>
                </section>
                <section className="admin-card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-fg">Inventory</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={label} htmlFor="dv-stock">
                        Quantity
                      </label>
                      <input
                        id="dv-stock"
                        type="number"
                        min={0}
                        className="admin-input"
                        value={single.stock}
                        onChange={(e) => setSingle({ stock: intOrNull(e.target.value) ?? 0 })}
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="dv-sku">
                        SKU (Stock Keeping Unit)
                      </label>
                      <input
                        id="dv-sku"
                        className="admin-input font-mono text-xs"
                        maxLength={80}
                        value={single.sku ?? ''}
                        onChange={(e) => setSingle({ sku: e.target.value || null })}
                      />
                    </div>
                    <div>
                      <label className={label} htmlFor="dv-barcode">
                        Barcode (ISBN, UPC, GTIN…)
                      </label>
                      <input
                        id="dv-barcode"
                        className="admin-input font-mono text-xs"
                        maxLength={80}
                        value={single.barcode ?? ''}
                        onChange={(e) => setSingle({ barcode: e.target.value || null })}
                      />
                    </div>
                  </div>
                </section>
                <section className="admin-card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-fg">Shipping</h2>
                  <label className={label} htmlFor="dv-weight">
                    Weight
                  </label>
                  <div className="relative w-48">
                    <input
                      id="dv-weight"
                      type="number"
                      min={0}
                      className="admin-input pr-10"
                      placeholder="0"
                      value={single.weightGrams ?? ''}
                      onChange={(e) => setSingle({ weightGrams: intOrNull(e.target.value) })}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-500">
                      g
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Used by couriers to calculate delivery charges.
                  </p>
                </section>
              </div>
            )}

            <section className="admin-card overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5">
                <h2 className="text-sm font-semibold text-fg">Variants</h2>
              </div>
              <VariantsEditor
                options={options}
                variants={variants}
                images={keptImages}
                disabled={disabled}
                onChange={(nextOptions, nextVariants) => {
                  setDirty(true);
                  setOptions(nextOptions);
                  setVariants(nextVariants);
                }}
              />
            </section>

            <section className="admin-card space-y-5 p-5">
              <div>
                <h2 className="text-sm font-semibold text-fg">Product page: cross-sells</h2>
                <p className="text-xs text-slate-500">
                  The “Buy it with” checkboxes and the “Complete your …” list under the add-to-cart
                  buttons. Leave a heading empty to use the default.
                </p>
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="buyWithTitle" className={label}>
                      Heading
                    </label>
                    <input
                      id="buyWithTitle"
                      maxLength={120}
                      className="admin-input"
                      placeholder="Buy it with"
                      value={f.buyWithTitle}
                      onChange={(e) => set('buyWithTitle', e.target.value)}
                    />
                  </div>
                  <CrossSellPicker
                    label="Buy it with"
                    value={buyWith}
                    excludeId={product?.id}
                    search={searchProducts}
                    disabled={disabled}
                    onChange={(next) => {
                      setDirty(true);
                      setBuyWith(next);
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="upsellTitle" className={label}>
                      Heading
                    </label>
                    <input
                      id="upsellTitle"
                      maxLength={120}
                      className="admin-input"
                      placeholder={`Complete your ${(categories.find((c) => c.id === f.categoryId)?.name ?? 'category').toLowerCase()}`}
                      value={f.upsellTitle}
                      onChange={(e) => set('upsellTitle', e.target.value)}
                    />
                  </div>
                  <CrossSellPicker
                    label="Complete your …"
                    value={upsells}
                    excludeId={product?.id}
                    search={searchProducts}
                    disabled={disabled}
                    onChange={(next) => {
                      setDirty(true);
                      setUpsells(next);
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="admin-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-fg">Search engine listing</h2>
                <button
                  type="button"
                  className="admin-link text-sm"
                  onClick={() => setSeoOpen((o) => !o)}
                >
                  {seoOpen ? 'Done' : 'Edit'}
                </button>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-400">
                  Ehans Mart · /products/{f.slug || 'your-product'}
                </p>
                <p className="mt-0.5 truncate text-lg text-blue-400">
                  {f.metaTitle || f.name || 'Product title'}
                </p>
                <p className="line-clamp-2 text-sm text-slate-400">
                  {f.metaDescription ||
                    f.shortDescription ||
                    'Add a description to see how this product might appear in a search engine listing.'}
                </p>
              </div>
              <div className="mt-4 space-y-3 border-t border-ink-600 pt-4" hidden={!seoOpen}>
                <div>
                  <label htmlFor="metaTitle" className={label}>
                    Page title{' '}
                    <span className="text-xs text-slate-500">{f.metaTitle.length}/255</span>
                  </label>
                  <input
                    id="metaTitle"
                    maxLength={255}
                    className="admin-input"
                    value={f.metaTitle}
                    onChange={(e) => set('metaTitle', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="metaDescription" className={label}>
                    Meta description{' '}
                    <span className="text-xs text-slate-500">{f.metaDescription.length}/320</span>
                  </label>
                  <textarea
                    id="metaDescription"
                    rows={3}
                    maxLength={320}
                    className="admin-input"
                    value={f.metaDescription}
                    onChange={(e) => set('metaDescription', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="slug" className={label}>
                    URL handle
                  </label>
                  <div className="flex items-center overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
                    <span className="shrink-0 border-r border-ink-600 px-3 py-2 text-xs text-slate-500">
                      /products/
                    </span>
                    <input
                      id="slug"
                      maxLength={220}
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-xs text-slate-200 outline-none"
                      value={f.slug}
                      onChange={(e) => {
                        set('slug', e.target.value);
                        setF((prev) => ({ ...prev, slugTouched: e.target.value !== '' }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="admin-card p-5">
              <label htmlFor="status" className="mb-2 block text-sm font-semibold text-fg">
                Status
              </label>
              <select
                id="status"
                className="admin-input"
                value={f.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Draft products are hidden from your store.
              </p>
            </section>
            <section className="admin-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-fg">Publishing</h2>
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  className="size-4 accent-blue-600"
                  checked={f.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                />
                Feature on the home page
              </label>
            </section>
            <section className="admin-card space-y-4 p-5">
              <h2 className="text-sm font-semibold text-fg">Product organization</h2>
              <div>
                <label htmlFor="categoryId" className={label}>
                  Category
                </label>
                <select
                  id="categoryId"
                  required
                  className="admin-input"
                  value={f.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                >
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.depth ? `— ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className={label}>Also show in collections</p>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-ink-600 bg-ink-900 p-2">
                  {categories
                    .filter((c) => c.id !== f.categoryId)
                    .map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-300 hover:bg-ink-800"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-blue-600"
                          checked={f.collectionIds.includes(c.id)}
                          onChange={(e) =>
                            set(
                              'collectionIds',
                              e.target.checked
                                ? [...f.collectionIds, c.id]
                                : f.collectionIds.filter((id) => id !== c.id),
                            )
                          }
                        />
                        <span className={c.depth ? 'pl-3' : 'font-medium text-slate-200'}>
                          {c.name}
                        </span>
                      </label>
                    ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  e.g. Trendy Items for the home page grid.
                </p>
              </div>
              <div>
                <label htmlFor="productType" className={label}>
                  Type
                </label>
                <input
                  id="productType"
                  maxLength={100}
                  list="product-types"
                  className="admin-input"
                  placeholder="e.g. Kitchen tool"
                  value={f.productType}
                  onChange={(e) => set('productType', e.target.value)}
                />
                <datalist id="product-types">
                  {suggestions.types.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="brand" className={label}>
                  Vendor
                </label>
                <input
                  id="brand"
                  maxLength={100}
                  list="product-brands"
                  className="admin-input"
                  value={f.brand}
                  onChange={(e) => set('brand', e.target.value)}
                />
                <datalist id="product-brands">
                  {suggestions.brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="tags" className={label}>
                  Tags
                </label>
                <input
                  id="tags"
                  maxLength={1200}
                  list="product-tags"
                  className="admin-input"
                  placeholder="kitchen, baby, bestseller"
                  value={f.tags}
                  onChange={(e) => set('tags', e.target.value)}
                />
                <datalist id="product-tags">
                  {suggestions.tags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-slate-500">Separate tags with commas.</p>
              </div>
              <div>
                <label htmlFor="sku" className={label}>
                  Product code
                </label>
                <input
                  id="sku"
                  maxLength={60}
                  className="admin-input font-mono text-xs"
                  value={f.sku}
                  onChange={(e) => set('sku', e.target.value)}
                />
              </div>
            </section>
            {editing ? (
              <section className="admin-card p-5">
                <h2 className="mb-1 text-sm font-semibold text-fg">Sales</h2>
                <p className="text-sm text-slate-400">
                  {product.soldCount} sold · {product.stock} in stock across{' '}
                  {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className="sticky bottom-0 z-20 mt-6 -mx-4 flex items-center justify-between gap-3 border-t border-ink-600 bg-ink-950/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <p className="text-sm text-slate-400">
          {pending
            ? 'Saving…'
            : dirty
              ? 'Unsaved changes'
              : editing
                ? 'All changes saved'
                : 'New product'}
        </p>
        <div className="flex gap-2">
          {editing && deleteAction && !readOnly ? (
            <button
              type="button"
              className="admin-btn-danger"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`Delete “${product.name}”? This cannot be undone.`)) {
                  startTransition(() => {
                    void deleteAction();
                  });
                }
              }}
            >
              Delete product
            </button>
          ) : null}
          <Link href="/admin/products" className="admin-btn-secondary">
            {readOnly ? 'Back' : 'Discard'}
          </Link>
          {readOnly ? null : (
            <button
              type="submit"
              className="admin-btn-primary px-6"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
