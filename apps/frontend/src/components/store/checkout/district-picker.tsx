'use client';

import { DISTRICTS, SHIPPING_ZONES } from '@ehans/shared';
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatTaka } from '@/lib/format';
import { QcIcon } from './qc-icons';

const SORTED = [...DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
const haystack = (d: (typeof DISTRICTS)[number]) =>
  `${d.name} ${d.aliases ?? ''} ${d.bn}`.toLowerCase();

/**
 * glowy's searchable district picker (components/district-select + app.js): a button showing
 * "Name বাংলা", a panel with a search box and every district with its delivery charge.
 */
export function DistrictPicker({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string;
  value: string;
  invalid?: boolean;
  onChange: (key: string) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const visible = useMemo(() => {
    const t = term.trim().toLowerCase();
    return t ? SORTED.filter((d) => haystack(d).includes(t)) : SORTED;
  }, [term]);
  const chosen = SORTED.find((d) => d.key === value);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const show = () => {
    setTerm('');
    setActive(
      Math.max(
        0,
        SORTED.findIndex((d) => d.key === value),
      ),
    );
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const choose = (key: string | undefined) => {
    if (!key) return;
    onChange(key);
    close();
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = visible.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (n) setActive((a) => (a + 1) % n);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (n) setActive((a) => (a - 1 + n) % n);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(visible[active]?.key);
    } else if (e.key === 'Escape') {
      // close the list, not the whole popup
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`district-select is-enhanced${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}`}
    >
      <QcIcon name="map-pin" />
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="district-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="District"
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
      >
        <span className="district-value">
          {chosen ? (
            <>
              {chosen.name} <small>{chosen.bn}</small>
            </>
          ) : (
            <span className="district-placeholder">Select your district</span>
          )}
        </span>
        <svg aria-hidden="true" viewBox="0 0 10 6" width="10" height="6">
          <path
            d="M.67.67l4.33 4.33L9.33.67"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="district-panel">
          <div className="district-search">
            <input
              ref={searchRef}
              type="search"
              placeholder="Search district… e.g. Dhaka / ঢাকা"
              aria-label="Search district"
              aria-controls={listId}
              aria-activedescendant={
                visible[active] ? `${listId}-${visible[active].key}` : undefined
              }
              autoComplete="off"
              spellCheck={false}
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
            />
          </div>
          <ul
            ref={listRef}
            className="district-list"
            id={listId}
            role="listbox"
            aria-label="Districts"
          >
            {visible.map((d, i) => (
              <li
                key={d.key}
                id={`${listId}-${d.key}`}
                role="option"
                data-index={i}
                aria-selected={d.key === value}
                className={i === active ? 'is-active' : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(d.key)}
              >
                <span>
                  {d.name} <small>{d.bn}</small>
                </span>
                <em>{formatTaka(SHIPPING_ZONES[d.zone].fee)}</em>
              </li>
            ))}
          </ul>
          {visible.length ? null : <p className="district-empty">No district found</p>}
        </div>
      ) : null}
    </div>
  );
}
