'use client';

import type { AdminCategory } from '@ehans/shared';
import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import type { CategoryFormState } from '@/app/admin/(panel)/categories/actions';
import { FormErrors } from './feedback';

/** Str::slug-like preview for the slug field (the API makes the final slug). */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** glowy admin/categories/form (create + edit). */
export function CategoryForm({
  category,
  parents,
  action,
  readOnly,
}: {
  category: AdminCategory | null;
  parents: { id: string; name: string }[];
  action: (prev: CategoryFormState, form: FormData) => Promise<CategoryFormState>;
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const editing = category !== null;
  const slugRef = useRef<HTMLInputElement>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(category?.slug));
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <FormErrors errors={state.errors} />
      <form action={formAction} className="grid gap-6 xl:grid-cols-12">
        <fieldset disabled={readOnly || pending} className="contents">
          <section className="admin-card space-y-4 p-6 xl:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="admin-label">
                  Name *
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={category?.name}
                  required
                  maxLength={120}
                  className="admin-input"
                  onChange={(e) => {
                    if (!slugTouched && slugRef.current)
                      slugRef.current.value = slugify(e.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="slug" className="admin-label">
                  URL slug
                </label>
                <input
                  ref={slugRef}
                  id="slug"
                  name="slug"
                  defaultValue={category?.slug}
                  maxLength={140}
                  className="admin-input font-mono text-xs"
                  placeholder="auto-generated"
                  onChange={(e) => setSlugTouched(e.target.value !== '')}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="parentId" className="admin-label">
                  Parent department
                </label>
                <select
                  id="parentId"
                  name="parentId"
                  defaultValue={category?.parentId ?? ''}
                  className="admin-input"
                >
                  <option value="">— None (top-level department) —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="position" className="admin-label">
                  Menu order
                </label>
                <input
                  id="position"
                  name="position"
                  type="number"
                  min={0}
                  defaultValue={category?.position ?? 0}
                  className="admin-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="admin-label">
                Description (shown on the collection page)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={1000}
                defaultValue={category?.description ?? ''}
                className="admin-input"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="metaTitle" className="admin-label">
                  Meta title
                </label>
                <input
                  id="metaTitle"
                  name="metaTitle"
                  defaultValue={category?.metaTitle ?? ''}
                  maxLength={255}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="metaDescription" className="admin-label">
                  Meta description
                </label>
                <input
                  id="metaDescription"
                  name="metaDescription"
                  defaultValue={category?.metaDescription ?? ''}
                  maxLength={320}
                  className="admin-input"
                />
              </div>
            </div>
          </section>

          <div className="space-y-6 xl:col-span-4">
            <section className="admin-card space-y-4 p-6">
              <h2 className="font-bold text-fg">Home page tile</h2>
              {preview || category?.image ? (
                <img
                  src={preview ?? category!.image!}
                  alt=""
                  className="size-24 rounded-full object-cover ring-1 ring-ink-500"
                />
              ) : null}
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp"
                className="admin-input file:mr-3 file:rounded-md file:border-0 file:bg-ink-700 file:px-3 file:py-1 file:text-slate-200"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="homeTitle" className="admin-label">
                    Tile label
                  </label>
                  <input
                    id="homeTitle"
                    name="homeTitle"
                    defaultValue={category?.homeTitle ?? ''}
                    maxLength={120}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label htmlFor="homePosition" className="admin-label">
                    Tile order
                  </label>
                  <input
                    id="homePosition"
                    name="homePosition"
                    type="number"
                    min={1}
                    defaultValue={category?.homePosition ?? ''}
                    className="admin-input"
                    placeholder="Hidden"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                Show in navigation menu
                <input
                  type="checkbox"
                  name="showInMenu"
                  value="1"
                  defaultChecked={category?.showInMenu ?? true}
                  className="size-5 accent-blue-600"
                />
              </label>
            </section>
            <div className="flex gap-3">
              {readOnly ? null : (
                <button
                  type="submit"
                  className="admin-btn-primary flex-1 py-2.5"
                  aria-busy={pending}
                >
                  {pending ? 'Saving…' : editing ? 'Save category' : 'Create category'}
                </button>
              )}
              <Link href="/admin/categories" className="admin-btn-secondary">
                {readOnly ? 'Back' : 'Cancel'}
              </Link>
            </div>
          </div>
        </fieldset>
      </form>
    </>
  );
}
