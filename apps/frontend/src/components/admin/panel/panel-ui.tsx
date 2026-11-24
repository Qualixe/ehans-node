'use client';

import { ORDER_STATUS_LABELS, type OrderStatusName } from '@ehans/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AdminIcon } from '../icon';

/** The order panel's status colours (demo .t-* classes). */
export const STATUS_PILL: Record<OrderStatusName, string> = {
  pending: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  no_answer: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  follow_up: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ready: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  shipped: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  delivered: 'bg-green-500/10 text-green-700 ring-1 ring-green-600/30 dark:text-green-400',
  partial: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  returned: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  fake: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-600/35 dark:text-rose-400',
  cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

/** Tab dots (demo TAB_DOT). */
export const STATUS_DOT: Record<string, string> = {
  pending: '#2F6DB0',
  confirmed: '#22865A',
  no_answer: '#D9822B',
  follow_up: '#C9A227',
  ready: '#6A55B5',
  shipped: '#8B5CF6',
  delivered: '#16A34A',
  partial: '#3A9E9A',
  returned: '#64748B',
  fake: '#B91C1C',
  cancelled: '#E5484D',
  dup: '#D97706',
  blocked: '#7F1D1D',
};

export function StatusPill({
  status,
  children,
}: {
  status: OrderStatusName;
  children?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_PILL[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current"></span>
      {ORDER_STATUS_LABELS[status]}
      {children}
    </span>
  );
}

const AV = ['#2F6DB0', '#22865A', '#6A55B5', '#D9822B', '#C23B6B', '#13A39A', '#B45309', '#4F46E5'];
const hash = (s: string) =>
  [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: AV[hash(name) % AV.length],
      }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------- formatting

export const tk = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;
export const fmtPhone = (p: string) => (/^01\d{9}$/.test(p) ? `${p.slice(0, 5)}-${p.slice(5)}` : p);
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
/** "18 Nov 2026 · 9:09 PM" in Dhaka */
export const clock = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit' })}`;
};

// ---------------------------------------------------------------- toast

type Toast = { id: number; text: string };
const ToastCtx = createContext<(text: string) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[80] flex flex-col items-end gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-2xl ring-1 ring-ink-600 dark:bg-ink-700"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------------------------------------------------------------- modal

export function Modal({
  title,
  subtitle,
  size = 'md',
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  size?: 'sm' | 'md' | 'mid' | 'wide';
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const width = {
    sm: 'w-[min(420px,calc(100%-24px))]',
    md: 'w-[min(540px,calc(100%-24px))]',
    mid: 'w-[min(760px,calc(100%-24px))]',
    wide: 'w-[min(1080px,calc(100%-24px))]',
  }[size];
  return (
    <dialog
      ref={ref}
      className={`${width} m-auto flex max-h-[calc(100dvh-32px)] flex-col rounded-2xl bg-white p-0 text-slate-200 shadow-2xl ring-1 ring-ink-600 backdrop:bg-black/50 backdrop:backdrop-blur-[2px] open:flex dark:bg-ink-900`}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <header className="flex items-start justify-between gap-3 border-b border-ink-600 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-ink-800 hover:text-fg"
          aria-label="Close"
          onClick={onClose}
        >
          <AdminIcon name="x" className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer ? (
        <footer className="flex flex-wrap items-center gap-2 border-t border-ink-600 px-5 py-3">
          {footer}
        </footer>
      ) : null}
    </dialog>
  );
}

// ---------------------------------------------------------------- popover menu

export type MenuItem =
  { label: string; icon?: string; danger?: boolean; onSelect: () => void } | '-';

/** A small menu anchored to a button (demo openPop). */
export function PopMenu({
  anchor,
  items,
  onClose,
}: {
  anchor: HTMLElement;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    const r = anchor.getBoundingClientRect();
    const h = ref.current?.offsetHeight ?? 300;
    const w = ref.current?.offsetWidth ?? 220;
    const top = r.bottom + 6 + h > window.innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6;
    const left = Math.min(window.innerWidth - w - 8, Math.max(8, r.left));
    setPos({ top, left });
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onClose, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [anchor, onClose]);
  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[70] min-w-52 rounded-xl bg-white p-1.5 shadow-2xl ring-1 ring-ink-600 dark:bg-ink-850"
      style={{ top: pos.top, left: pos.left }}
    >
      {items.map((it, i) =>
        it === '-' ? (
          <div key={i} className="my-1 h-px bg-ink-600" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-800 ${it.danger ? 'text-rose-500' : 'text-slate-200'}`}
            onClick={() => {
              onClose();
              it.onSelect();
            }}
          >
            {it.icon ? <AdminIcon name={it.icon} className="size-4 opacity-80" /> : null}
            {it.label}
          </button>
        ),
      )}
    </div>
  );
}

/** Copies text and tells the user. */
export function useCopy() {
  const toast = useToast();
  return (text: string, done = `Copied ${text}`) => {
    void navigator.clipboard?.writeText(text).then(() => toast(done));
  };
}
