import type { OrderStatusName } from '@ehans/shared';
import type { ReactNode } from 'react';
import { AdminIcon } from './icon';

/** glowy components/admin/page-header */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

const TONES = {
  blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-300 ring-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
};

/** glowy components/admin/stat-card */
export function StatCard({
  label,
  value,
  change = null,
  sub,
  icon,
  tone = 'blue',
  invert = false,
}: {
  label: string;
  value: string;
  change?: number | null;
  sub?: string;
  icon: string;
  tone?: keyof typeof TONES;
  invert?: boolean;
}) {
  const positive = change !== null && (invert ? change < 0 : change >= 0);
  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ring-1 ${TONES[tone]}`}>
          <AdminIcon name={icon} className="size-[18px]" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[26px] leading-none font-extrabold tracking-tight text-fg">{value}</p>
        {change !== null ? (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            <AdminIcon name={change >= 0 ? 'arrow-up' : 'arrow-down'} className="size-3.5" />
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        ) : null}
      </div>
      {sub ? <p className="mt-3 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export const STATUS_BADGES: Record<OrderStatusName, string> = {
  pending: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
  confirmed: 'bg-sky-500/10 text-sky-400 ring-sky-500/30',
  processing: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/30',
  shipped: 'bg-violet-500/10 text-violet-400 ring-violet-500/30',
  delivered: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30',
  cancelled: 'bg-rose-500/10 text-rose-400 ring-rose-500/30',
  returned: 'bg-slate-500/10 text-slate-300 ring-slate-500/30',
};

/** glowy components/admin/status-badge (OrderStatus::badgeClasses) */
export function StatusBadge({ status }: { status: OrderStatusName }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_BADGES[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current"></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/** glowy components/admin/donut */
export function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; color: string; percent: number; count: number }[];
  centerValue?: string;
  centerLabel?: string;
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const gap = segments.length > 1 ? 4 : 0;
  // each segment starts where the previous ones end
  const starts = segments.map((_, i) =>
    segments.slice(0, i).reduce((sum, s) => sum + (circumference * s.percent) / 100, 0),
  );
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[240px]">
      <svg
        viewBox="0 0 220 220"
        className="size-full -rotate-90"
        role="img"
        aria-label="Channel breakdown"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          className="stroke-ink-700"
          strokeWidth="22"
        />
        {segments.map((s, i) => {
          const length = Math.max((circumference * s.percent) / 100 - gap, 0);
          const dashOffset = -starts[i]!;
          return (
            <circle
              key={s.label}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
            >
              <title>{`${s.label}: ${s.percent}% (${s.count} orders)`}</title>
            </circle>
          );
        })}
      </svg>
      {centerValue !== undefined ? (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-extrabold text-fg">{centerValue}</p>
            <p className="text-xs text-slate-400">{centerLabel}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
