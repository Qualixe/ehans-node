import { ChartTooltip } from './line-chart-tooltip';

export interface ChartSeries {
  label: string;
  values: number[];
  color: string;
  dashed?: boolean;
  fill?: boolean;
}

const fmt = (v: number) =>
  v >= 1_000_000
    ? `৳${Math.round(v / 100_000) / 10}M`
    : v >= 1000
      ? `৳${Math.round(v / 100) / 10}k`
      : `৳${Math.trunc(v)}`;

/** glowy components/admin/line-chart: server-rendered SVG (no chart library), hover tooltip. */
export function LineChart({
  labels,
  series,
  height = 300,
  id,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  /** Unique per chart on the page (gradient ids). */
  id: string;
}) {
  const width = 1000;
  const pad = { top: 12, right: 12, bottom: 34, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const count = Math.max(labels.length, 1);

  const max = Math.max(1, ...series.map((s) => Math.max(0, ...s.values)));
  const raw = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, nice * magnitude);
  const yMax = step * 5;

  const x = (i: number) => pad.left + (count === 1 ? plotW / 2 : (i * plotW) / (count - 1));
  const y = (v: number) => pad.top + plotH - (v / yMax) * plotH;
  const f = (n: number) => n.toFixed(1);

  const path = (values: number[]) => {
    const pts = values.map((v, i) => [x(i), y(v)] as const);
    if (pts.length < 2) return pts.length ? `M${f(pts[0]![0])},${f(pts[0]![1])}` : '';
    let d = `M${f(pts[0]![0])},${f(pts[0]![1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[Math.min(i + 2, pts.length - 1)]!;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d;
  };

  const labelEvery = Math.ceil(count / 12);
  const slice = plotW / Math.max(count - (count > 1 ? 1 : 0), 1);

  return (
    <>
      <ChartTooltip>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`${series.map((s) => s.label).join(' vs ')} chart`}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.label} id={`${id}-fill-${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {Array.from({ length: 6 }, (_, t) => {
            const ty = y(step * t);
            return (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={ty}
                  y2={ty}
                  className="stroke-ink-600"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 10}
                  y={ty + 4}
                  textAnchor="end"
                  className="fill-slate-500"
                  fontSize="12"
                >
                  {fmt(step * t)}
                </text>
              </g>
            );
          })}

          {labels.map((label, i) =>
            i % labelEvery === 0 || i === count - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize="12"
              >
                {label}
              </text>
            ) : null,
          )}

          {series.map((s, i) => {
            const d = path(s.values);
            return (
              <g key={s.label}>
                {s.fill && d ? (
                  <path
                    d={`${d} L${x(count - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                    fill={`url(#${id}-fill-${i})`}
                  />
                ) : null}
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={s.dashed ? '4 6' : undefined}
                />
              </g>
            );
          })}

          <line
            x1="0"
            x2="0"
            y1={pad.top}
            y2={pad.top + plotH}
            stroke="#475569"
            strokeDasharray="3 3"
            data-chart-cursor=""
            opacity="0"
          />

          {labels.map((label, i) => {
            const values = series.map(
              (s) => `${s.label}: ৳${(s.values[i] ?? 0).toLocaleString('en-US')}`,
            );
            return (
              <rect
                key={i}
                x={x(i) - slice / 2}
                y={pad.top}
                width={slice}
                height={plotH}
                fill="transparent"
                data-chart-point=""
                data-x={x(i)}
                data-label={label}
                data-values={values.join('|')}
              >
                <title>{`${label} — ${values.join(', ')}`}</title>
              </rect>
            );
          })}
        </svg>
      </ChartTooltip>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-300">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border-2"
              style={{ borderColor: s.color, borderStyle: s.dashed ? 'dashed' : undefined }}
            ></span>
            {s.label}
          </span>
        ))}
      </div>
    </>
  );
}
