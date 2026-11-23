'use client';

import { type FraudCheckDto, type FraudRisk, fraudRisk } from '@ehans/shared';
import { useState, useTransition } from 'react';
import { runFraudCheck } from '@/app/admin/(panel)/orders/actions';
import { timeAgo } from '@/lib/admin/format';
import { AdminIcon } from './icon';

const RISK_CLASSES: Record<FraudRisk, string> = {
  safe: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/40',
  watch: 'bg-amber-500/10 text-amber-400 ring-amber-500/40',
  risky: 'bg-rose-500/10 text-rose-400 ring-rose-500/40',
  new: 'bg-sky-500/10 text-sky-400 ring-sky-500/40',
};

/** glowy admin/orders/partials/fraud: BD Courier delivery history for the order's phone. */
export function FraudCheck({
  number,
  check: initial,
  enabled,
  manage,
  open: startOpen = false,
}: {
  number: string;
  check: FraudCheckDto | null;
  enabled: boolean;
  manage: boolean;
  /** Show the details straight away (the order page) instead of a dropdown. */
  open?: boolean;
}) {
  const [check, setCheck] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fresh: boolean) => {
    setError(null);
    start(async () => {
      const result = await runFraudCheck(number, fresh);
      if (result.ok) setCheck(result.check);
      else setError(result.error);
    });
  };

  if (!check && !enabled) {
    return (
      <span className="text-xs text-slate-500" title="Add BDCOURIER_API_KEY to the server settings">
        Not set up
      </span>
    );
  }

  if (!check) {
    return (
      <div>
        {manage ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-500 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:border-blue-500 hover:text-blue-400 disabled:opacity-60"
            disabled={pending}
            onClick={() => run(false)}
          >
            <AdminIcon name="shield" className="size-3.5" /> {pending ? 'Checking…' : 'Check'}
          </button>
        ) : (
          <span className="text-xs text-slate-500">Not checked</span>
        )}
        {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
      </div>
    );
  }

  const risk = fraudRisk(check);
  const label = risk === 'new' ? 'New customer' : `${check.successRatio}% Success`;
  const details = (
    <>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-ink-800 p-2">
          <p className="text-lg font-extrabold text-fg">{check.totalParcels}</p>
          <p className="text-[11px] text-slate-400">Total</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2">
          <p className="text-lg font-extrabold text-emerald-400">{check.successParcels}</p>
          <p className="text-[11px] text-slate-400">Delivered</p>
        </div>
        <div className="rounded-lg bg-rose-500/10 p-2">
          <p className="text-lg font-extrabold text-rose-400">{check.cancelledParcels}</p>
          <p className="text-[11px] text-slate-400">Cancelled</p>
        </div>
      </div>
      {check.couriers.length ? (
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="py-1 text-left font-medium">Courier</th>
              <th className="text-right font-medium">Total</th>
              <th className="text-right font-medium">OK</th>
              <th className="text-right font-medium">Cancel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {check.couriers.map((row) => (
              <tr key={row.name} className="text-slate-300">
                <td className="py-1.5">{row.name}</td>
                <td className="text-right">{row.total}</td>
                <td className="text-right text-emerald-400">{row.success}</td>
                <td className="text-right text-rose-400">{row.cancelled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : risk === 'new' ? (
        <p className="mt-3 text-xs text-slate-400">
          No courier history for this number yet. Consider calling to confirm before shipping.
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between border-t border-ink-700 pt-2 text-[11px] text-slate-500">
        <span>Checked {timeAgo(check.checkedAt)}</span>
        {manage && enabled ? (
          <button
            type="button"
            className="admin-link disabled:opacity-60"
            disabled={pending}
            onClick={() => run(true)}
          >
            {pending ? 'Checking…' : 'Re-check'}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </>
  );

  const pill = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ${RISK_CLASSES[risk]}`}
    >
      <AdminIcon name="shield" className="size-3.5" />
      {label}
    </span>
  );

  if (startOpen) {
    return (
      <div>
        {pill}
        <div className="mt-3">{details}</div>
      </div>
    );
  }

  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {pill}
      </summary>
      <div className="absolute top-full left-0 z-30 mt-2 w-72 rounded-xl border border-ink-600 bg-ink-850 p-4 text-left shadow-2xl">
        {details}
      </div>
    </details>
  );
}
