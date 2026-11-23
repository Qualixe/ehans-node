'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminIcon } from './icon';

export interface MediaState {
  /** Existing images in display order; `remove` = ticked for removal on save. */
  existing: { id: string; path: string; remove: boolean }[];
  /** New files to upload (appended after the existing images). */
  added: File[];
}

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** glowy's media grid (data-media-*): drag to reorder, tick to remove, drop or pick new files. */
export function MediaGrid({
  value,
  onChange,
  disabled = false,
}: {
  value: MediaState;
  onChange: (next: MediaState) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // object URLs for the new files, released when the list changes or the grid unmounts
  const previews = useMemo(() => value.added.map((f) => URL.createObjectURL(f)), [value.added]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addFiles = (files: FileList | File[]) => {
    const list = [...files];
    const ok = list.filter((f) => TYPES.includes(f.type) && f.size <= MAX_BYTES);
    setRejected(
      ok.length < list.length ? 'Some files were skipped: use JPG, PNG or WebP up to 4 MB.' : null,
    );
    if (ok.length) onChange({ ...value, added: [...value.added, ...ok] });
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value.existing];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange({ ...value, existing: next });
  };

  const firstKept = value.existing.findIndex((i) => !i.remove);

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {value.existing.map((image, index) => (
          <div
            key={image.id}
            className={`group relative overflow-hidden rounded-xl border border-ink-600 bg-ink-800 ${image.remove ? 'opacity-40' : ''} ${dragging === index ? 'ring-2 ring-blue-500' : ''}`}
            draggable={!disabled}
            onDragStart={() => setDragging(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging !== null) move(dragging, index);
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
          >
            <img
              src={image.path}
              alt=""
              className="aspect-square size-full cursor-move object-cover"
            />
            <label
              className={`absolute top-2 left-2 size-5 cursor-pointer place-items-center rounded bg-white/90 ${image.remove ? 'grid' : 'hidden group-hover:grid'}`}
              title="Select to remove"
            >
              <input
                type="checkbox"
                className="size-4 accent-blue-600"
                checked={image.remove}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...value,
                    existing: value.existing.map((i) =>
                      i.id === image.id ? { ...i, remove: e.target.checked } : i,
                    ),
                  })
                }
              />
            </label>
            {index === firstKept ? (
              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                Main
              </span>
            ) : null}
          </div>
        ))}
        {value.added.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="group relative overflow-hidden rounded-xl border border-dashed border-blue-500/50 bg-ink-800"
          >
            {previews[index] ? (
              <img src={previews[index]} alt="" className="aspect-square size-full object-cover" />
            ) : null}
            <span className="absolute bottom-2 left-2 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              New
            </span>
            <button
              type="button"
              className="absolute top-2 right-2 hidden size-6 place-items-center rounded-full bg-black/60 text-white group-hover:grid"
              title="Don't upload"
              disabled={disabled}
              onClick={() =>
                onChange({ ...value, added: value.added.filter((_, i) => i !== index) })
              }
            >
              <AdminIcon name="x" className="size-3.5" />
            </button>
          </div>
        ))}
        <label
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-500 p-2 text-center text-xs text-slate-400 transition hover:border-slate-400 hover:text-slate-200"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!disabled && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
        >
          <AdminIcon name="plus" className="size-5" />
          <span className="font-semibold text-slate-200">Add media</span>
          <span>or drop files</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              if (inputRef.current) inputRef.current.value = '';
            }}
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Drag to reorder. The first image is the main image. Tick images to remove them when you
        save. JPG, PNG or WebP up to 4 MB.
      </p>
      {rejected ? <p className="mt-1 text-xs text-rose-400">{rejected}</p> : null}
    </>
  );
}
