'use client';

import type { AdminProductOption, AdminVariantInput } from '@ehans/shared';
import { useState } from 'react';
import { AdminIcon } from './icon';

const MAX_OPTIONS = 3;
const MAX_VARIANTS = 100;

/** Every combination of the option values, in option order. */
export function combinations(options: AdminProductOption[]): string[][] {
  const usable = options.filter((o) => o.values.length);
  if (!usable.length) return [];
  return usable.reduce<string[][]>(
    (acc, option) => acc.flatMap((combo) => option.values.map((v) => [...combo, v])),
    [[]],
  );
}

/** Rebuilds the variant list for new options, keeping what was typed for surviving combinations. */
export function regenerate(
  options: AdminProductOption[],
  previous: AdminVariantInput[],
  template: AdminVariantInput,
): AdminVariantInput[] {
  const byKey = new Map(previous.map((v) => [v.options.join('\u0000'), v]));
  return combinations(options)
    .slice(0, MAX_VARIANTS)
    .map(
      (combo) =>
        byKey.get(combo.join('\u0000')) ?? {
          ...template,
          id: null,
          options: combo,
          sku: null,
          imageId: null,
        },
    );
}

function ValuesInput({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const lower = values.map((v) => v.toLocaleLowerCase());
    const next = [...values];
    for (const p of parts)
      if (!lower.includes(p.toLocaleLowerCase()) && next.length < 50) next.push(p);
    onChange(next);
    setDraft('');
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-ink-600 bg-ink-900 px-2 py-1.5">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-md bg-ink-700 px-2 py-0.5 text-xs text-slate-200"
        >
          {v}
          <button
            type="button"
            className="text-slate-400 hover:text-rose-400"
            aria-label={`Remove ${v}`}
            disabled={disabled}
            onClick={() => onChange(values.filter((x) => x !== v))}
          >
            <AdminIcon name="x" className="size-3" />
          </button>
        </span>
      ))}
      <input
        className="min-w-28 flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        placeholder={values.length ? 'Add another value' : 'Small, Medium, Large'}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
          if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={add}
      />
    </div>
  );
}

const num = (value: string): number | null =>
  value === '' ? null : Math.max(0, Math.round(Number(value)));

/** glowy's options & variants editor (data-variant-editor). */
export function VariantsEditor({
  options,
  variants,
  images,
  onChange,
  disabled = false,
}: {
  options: AdminProductOption[];
  variants: AdminVariantInput[];
  images: { id: string; path: string }[];
  onChange: (options: AdminProductOption[], variants: AdminVariantInput[]) => void;
  disabled?: boolean;
}) {
  // the details new combinations start from (a simple product's price and stock carry over)
  const template: AdminVariantInput = variants[0] ?? {
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

  const setOptions = (next: AdminProductOption[]) => {
    if (!next.length) {
      // back to a single variant: keep the first row's details (and its id)
      onChange([], [{ ...template, options: [] }]);
      return;
    }
    const generated = regenerate(next, variants, { ...template, options: [] });
    // an option without values yet has no combinations: keep the current rows until it has
    onChange(next, generated.length ? generated : variants);
  };
  const hasCombinations = combinations(options).length > 0;
  const setVariant = (index: number, patch: Partial<AdminVariantInput>) =>
    onChange(
      options,
      variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  const overLimit = combinations(options).length > MAX_VARIANTS;

  return (
    <>
      <div className="space-y-3 px-5 pt-3">
        {options.map((option, index) => (
          <div key={index} className="rounded-xl border border-ink-600 p-3">
            <div className="flex items-center gap-2">
              <input
                className="admin-input max-w-52"
                placeholder="Option name (e.g. Size)"
                value={option.name}
                maxLength={60}
                disabled={disabled}
                onChange={(e) =>
                  setOptions(
                    options.map((o, i) => (i === index ? { ...o, name: e.target.value } : o)),
                  )
                }
              />
              <button
                type="button"
                className="ml-auto grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                title="Remove option"
                disabled={disabled}
                onClick={() => setOptions(options.filter((_, i) => i !== index))}
              >
                <AdminIcon name="trash" className="size-4" />
              </button>
            </div>
            <div className="mt-2">
              <ValuesInput
                values={option.values}
                disabled={disabled}
                onChange={(values) =>
                  setOptions(options.map((o, i) => (i === index ? { ...o, values } : o)))
                }
              />
            </div>
          </div>
        ))}
        {options.length < MAX_OPTIONS ? (
          <button
            type="button"
            className="admin-link inline-flex items-center gap-1 text-sm"
            disabled={disabled}
            onClick={() =>
              setOptions([...options, { name: options.length ? '' : 'Size', values: [] }])
            }
          >
            <AdminIcon name="plus" className="size-4" />
            {options.length ? 'Add another option' : 'Add options like size or color'}
          </button>
        ) : null}
        {overLimit ? (
          <p className="text-xs text-rose-400">
            Only the first {MAX_VARIANTS} combinations are kept.
          </p>
        ) : null}
      </div>

      {hasCombinations && variants.length ? (
        <div className="mt-4 overflow-x-auto px-5 pb-5">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Variant</th>
                <th>Price</th>
                <th>Compare-at</th>
                <th>Stock</th>
                <th>SKU</th>
                {images.length ? <th>Image</th> : null}
              </tr>
            </thead>
            <tbody>
              {variants.map((v, index) => (
                <tr key={v.options.join(' / ')}>
                  <td className="font-medium whitespace-nowrap text-slate-100">
                    {v.options.join(' / ')}
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="admin-input w-28 py-1.5"
                      aria-label={`Price of ${v.options.join(' / ')}`}
                      value={v.price}
                      disabled={disabled}
                      onChange={(e) => setVariant(index, { price: num(e.target.value) ?? 0 })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="admin-input w-28 py-1.5"
                      aria-label={`Compare-at price of ${v.options.join(' / ')}`}
                      value={v.compareAtPrice ?? ''}
                      disabled={disabled}
                      onChange={(e) => setVariant(index, { compareAtPrice: num(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      className="admin-input w-24 py-1.5"
                      aria-label={`Stock of ${v.options.join(' / ')}`}
                      value={v.stock}
                      disabled={disabled}
                      onChange={(e) => setVariant(index, { stock: num(e.target.value) ?? 0 })}
                    />
                  </td>
                  <td>
                    <input
                      className="admin-input w-32 py-1.5 font-mono text-xs"
                      aria-label={`SKU of ${v.options.join(' / ')}`}
                      value={v.sku ?? ''}
                      maxLength={80}
                      disabled={disabled}
                      onChange={(e) => setVariant(index, { sku: e.target.value || null })}
                    />
                  </td>
                  {images.length ? (
                    <td>
                      <select
                        className="admin-input w-32 py-1.5"
                        aria-label={`Image of ${v.options.join(' / ')}`}
                        value={v.imageId ?? ''}
                        disabled={disabled}
                        onChange={(e) => setVariant(index, { imageId: e.target.value || null })}
                      >
                        <option value="">Main image</option>
                        {images.map((img, i) => (
                          <option key={img.id} value={img.id}>
                            Image {i + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            {variants.length} variants · {variants.reduce((n, v) => n + v.stock, 0)} in stock
          </p>
        </div>
      ) : (
        <div className="pb-5"></div>
      )}
    </>
  );
}
