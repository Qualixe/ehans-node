'use client';

import { type ReactNode, useRef, useState } from 'react';

/** Hover tooltip + cursor line for LineChart (glowy admin.js initCharts). */
export function ChartTooltip({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ label: string; rows: string[]; left: number } | null>(null);

  const cursor = () => rootRef.current?.querySelector('[data-chart-cursor]');

  const onOver = (event: React.MouseEvent) => {
    const point = (event.target as Element).closest<SVGRectElement>('[data-chart-point]');
    const root = rootRef.current;
    const svg = root?.querySelector('svg');
    if (!point || !root || !svg) return;
    const x = Number(point.dataset.x);
    const line = cursor();
    line?.setAttribute('x1', String(x));
    line?.setAttribute('x2', String(x));
    line?.setAttribute('opacity', '1');
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const tipWidth = tipRef.current?.offsetWidth ?? 160;
    setTip({
      label: point.dataset.label ?? '',
      rows: (point.dataset.values ?? '').split('|'),
      left: Math.max(Math.min(x * scale + 12, root.clientWidth - tipWidth - 4), 0),
    });
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      data-line-chart=""
      onMouseOver={onOver}
      onMouseLeave={() => {
        setTip(null);
        cursor()?.setAttribute('opacity', '0');
      }}
    >
      {children}
      <div
        ref={tipRef}
        className={`pointer-events-none absolute top-0 left-0 z-10 rounded-lg border border-ink-500 bg-ink-800/95 px-3 py-2 text-xs shadow-xl ${tip ? '' : 'hidden'}`}
        style={tip ? { transform: `translate(${tip.left}px, 8px)` } : undefined}
      >
        {tip ? (
          <>
            <p className="mb-1 font-semibold text-fg">{tip.label}</p>
            {tip.rows.map((row) => (
              <p key={row} className="text-slate-300">
                {row}
              </p>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
