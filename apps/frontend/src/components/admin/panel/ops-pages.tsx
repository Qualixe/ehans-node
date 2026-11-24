'use client';

import {
  type ActivityType,
  type BlockedContactDto,
  type FraudCheckerPage,
  type FraudLookup,
  fraudRisk,
  ORDER_STATUS_LABELS,
  type SecurityOverview,
  type SecuritySettings,
  type ShipmentsPage,
  type TeamPage,
} from '@ehans/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState, useTransition } from 'react';
import {
  blockValue,
  fraudLookup,
  runSecurityRules,
  saveSecurity,
  settlePayout,
  shipmentStatus,
  unblockValue,
} from '@/app/admin/(panel)/ops-actions';
import { syncCourier } from '@/app/admin/(panel)/orders/panel-actions';
import { AdminIcon } from '../icon';
import {
  ago,
  Avatar,
  clock,
  fmtPhone,
  StatusPill,
  tk,
  ToastProvider,
  useCopy,
  useToast,
} from './panel-ui';

const COLOR: Record<string, string> = {
  steadfast: '#0E9F6E',
  pathao: '#E5322D',
  redx: '#C8102E',
  paperfly: '#1C6FD1',
};

export function Head({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{sub}</p>
      </div>
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  color,
  icon,
}: {
  label: ReactNode;
  value: string;
  hint: string;
  color: string;
  icon?: string;
}) {
  return (
    <div className="admin-card relative overflow-hidden p-4">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        {icon ? (
          <span style={{ color }}>
            <AdminIcon name={icon} className="size-4" />
          </span>
        ) : null}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-extrabold text-fg tabular-nums">{value}</div>
      <div className="mt-0.5 truncate text-xs text-slate-500">{hint}</div>
    </div>
  );
}

const Courier = ({ id, name }: { id: string; name: string }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
    <i className="size-2 rounded-full" style={{ background: COLOR[id] ?? '#5E6470' }} />
    {name}
  </span>
);

// ---------------------------------------------------------------- Courier & COD

export function ShipmentsScreen({ data, manage }: { data: ShipmentsPage; manage: boolean }) {
  return (
    <ToastProvider>
      <Shipments data={data} manage={manage} />
    </ToastProvider>
  );
}

function Shipments({ data, manage }: { data: ShipmentsPage; manage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const copy = useCopy();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      toast(r.ok ? msg : (r.error ?? 'Failed'));
      if (r.ok) router.refresh();
    });

  return (
    <>
      <Head
        title="Courier & COD"
        sub="Parcels with couriers, cash they're collecting, and payouts still to receive."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.couriers.map((c) => (
          <Kpi
            key={c.id}
            label={<Courier id={c.id} name={c.name} />}
            value={tk(c.inTransitCod)}
            hint={`${c.inTransit} parcels in transit · ${c.delivered} delivered · ${c.returned} returned`}
            color={COLOR[c.id] ?? '#5E6470'}
          />
        ))}
      </div>
      <section className="admin-card mb-4">
        <div className="border-b border-ink-600 px-5 py-4">
          <h2 className="font-bold text-fg">Courier payouts to receive</h2>
          <p className="text-xs text-slate-500">COD minus the courier charge and 1% COD fee</p>
        </div>
        <div className="divide-y divide-ink-700 px-5">
          {data.payouts.length ? (
            data.payouts.map((p) => (
              <div key={p.courier} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="w-28">
                  <Courier id={p.courier} name={p.name} />
                </span>
                <span className="flex-1 text-slate-400">
                  {p.parcels} delivered parcels not paid yet · COD {tk(p.cod)} − fees {tk(p.fees)}
                </span>
                <b className="text-fg tabular-nums">{tk(p.net)}</b>
                {manage ? (
                  <button
                    type="button"
                    className="admin-btn-secondary h-8 px-3 text-xs text-emerald-600"
                    disabled={pending}
                    onClick={() =>
                      act(() => settlePayout(p.courier), `${p.name} payout marked received`)
                    }
                  >
                    <AdminIcon name="check" className="size-3.5" /> Mark received
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="py-5 text-center text-sm text-slate-500">
              All delivered parcels are paid out.
            </p>
          )}
        </div>
      </section>
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[980px]">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>CN / tracking</th>
                <th>Booked</th>
                <th>COD</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.rows.length ? (
                data.rows.map((r) => (
                  <tr key={r.number}>
                    <td className="font-mono font-bold text-fg">#{r.number}</td>
                    <td>
                      <b className="text-slate-200">{r.customerName}</b>
                      <div className="text-xs text-slate-500">
                        {r.district} · {fmtPhone(r.phone)}
                      </div>
                    </td>
                    <td>
                      <Courier id={r.courier} name={r.courierName} />
                    </td>
                    <td className="tabular-nums">
                      <div className="flex items-center gap-1">
                        <b>{r.consignmentId ?? '—'}</b>
                        {r.consignmentId ? (
                          <button
                            type="button"
                            className="text-slate-500 hover:text-fg"
                            aria-label="Copy CN"
                            onClick={() => copy(r.consignmentId!)}
                          >
                            <AdminIcon name="copy" className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                      {r.trackingUrl ? (
                        <a
                          href={r.trackingUrl}
                          target="_blank"
                          rel="noopener"
                          className="admin-link text-xs"
                        >
                          {r.trackingCode ?? 'Track'}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">{r.trackingCode}</span>
                      )}
                      {r.courierStatus ? (
                        <div className="text-[11px] text-violet-500">
                          {r.courierStatus.replace(/_/g, ' ')}
                        </div>
                      ) : null}
                    </td>
                    <td className="text-xs text-slate-500">{r.sentAt ? ago(r.sentAt) : '—'}</td>
                    <td className="font-bold tabular-nums">
                      {tk(r.cod)}
                      {r.settled ? (
                        <div className="text-[11px] font-semibold text-emerald-600">Paid out</div>
                      ) : null}
                    </td>
                    <td>
                      <StatusPill status={r.status} />
                    </td>
                    <td>
                      {manage && r.status === 'shipped' ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="admin-btn-secondary h-7 px-2.5 text-xs text-emerald-600"
                            disabled={pending}
                            onClick={() =>
                              act(
                                () => shipmentStatus(r.number, 'delivered'),
                                `#${r.number} delivered`,
                              )
                            }
                          >
                            <AdminIcon name="check" className="size-3.5" /> Delivered
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary h-7 px-2.5 text-xs"
                            disabled={pending}
                            onClick={() =>
                              act(
                                () => shipmentStatus(r.number, 'returned'),
                                `#${r.number} returned`,
                              )
                            }
                          >
                            <AdminIcon name="undo" className="size-3.5" /> Returned
                          </button>
                          <button
                            type="button"
                            className="admin-btn-secondary h-7 px-2.5 text-xs"
                            title="Ask the courier for the latest status"
                            disabled={pending}
                            onClick={() =>
                              act(async () => {
                                const s = await syncCourier(r.number);
                                return s.ok ? { ok: true } : { ok: false, error: s.error };
                              }, 'Courier status updated')
                            }
                          >
                            <AdminIcon name="refresh" className="size-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-500">
                    No parcels sent to a courier yet. Use “Assign courier” on an order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Block list

export function BlockListScreen({ list, manage }: { list: BlockedContactDto[]; manage: boolean }) {
  return (
    <ToastProvider>
      <BlockList list={list} manage={manage} />
    </ToastProvider>
  );
}

function BlockList({ list, manage }: { list: BlockedContactDto[]; manage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<'phone' | 'ip'>('phone');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  const add = () =>
    start(async () => {
      const v = kind === 'phone' ? value.replace(/\D/g, '').replace(/^88(?=01)/, '') : value.trim();
      if (kind === 'phone' && !/^01[3-9]\d{8}$/.test(v))
        return toast('Enter an 11-digit mobile number starting with 01');
      const r = await blockValue(kind, v, reason);
      toast(r.ok ? `${kind === 'phone' ? fmtPhone(v) : v} blocked` : r.error);
      if (r.ok) {
        setValue('');
        setReason('');
        router.refresh();
      }
    });
  return (
    <>
      <Head
        title="Block list"
        sub={`${list.length} blocked · they can't order on the website, and their orders are flagged red.`}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[600px]">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Reason</th>
                  <th>Blocked</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.length ? (
                  list.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.kind === 'phone' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-500/10 text-slate-500'}`}
                        >
                          <AdminIcon
                            name={b.kind === 'phone' ? 'phone' : 'globe'}
                            className="size-3.5"
                          />
                          {b.kind === 'phone' ? 'Phone' : 'IP address'}
                        </span>
                      </td>
                      <td className="font-bold tabular-nums text-fg">
                        {b.kind === 'phone' ? fmtPhone(b.value) : b.value}
                      </td>
                      <td className="text-sm text-slate-300">{b.reason ?? '—'}</td>
                      <td className="text-xs text-slate-500">
                        {ago(b.createdAt)}
                        {b.createdBy ? ` · ${b.createdBy}` : ''}
                      </td>
                      <td>
                        {manage ? (
                          <button
                            type="button"
                            className="admin-btn-secondary h-8 px-3 text-xs"
                            disabled={pending}
                            onClick={() =>
                              start(async () => {
                                const r = await unblockValue(b.id);
                                toast(r.ok ? 'Unblocked' : r.error);
                                if (r.ok) router.refresh();
                              })
                            }
                          >
                            Unblock
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-500">
                      Nobody is blocked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {manage ? (
          <div className="admin-card flex flex-col gap-3 p-4">
            <h2 className="font-bold text-fg">Add to block list</h2>
            <div className="inline-flex rounded-lg bg-ink-800 p-0.5 text-sm">
              {(['phone', 'ip'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`flex-1 rounded-md px-3 py-1.5 font-semibold ${kind === k ? 'bg-white text-fg shadow dark:bg-ink-600' : 'text-slate-400'}`}
                  onClick={() => setKind(k)}
                >
                  {k === 'phone' ? 'Phone' : 'IP address'}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
              Phone number or IP
              <input
                className="admin-input"
                placeholder={kind === 'phone' ? '01XXXXXXXXX' : '103.x.x.x'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
              Reason
              <textarea
                className="admin-input"
                rows={2}
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="admin-btn-primary justify-center"
              disabled={pending || !value.trim()}
              onClick={add}
            >
              <AdminIcon name="ban" className="size-4" /> Block
            </button>
            <p className="text-xs text-slate-500">
              Orders from a blocked number or IP are flagged red, can&apos;t be confirmed or sent to
              a courier, and the website refuses new orders from them.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Fraud checker

const LEVEL = {
  safe: { t: 'Safe customer', c: '#22865A', tip: '. Safe to ship.' },
  watch: { t: 'Check before shipping', c: '#A8690F', tip: '. Call and confirm before sending.' },
  risky: {
    t: 'High return risk',
    c: '#C2414B',
    tip: '. Take the delivery charge in advance or skip this order.',
  },
  new: {
    t: 'No courier history',
    c: '#2F6DB0',
    tip: '. No courier history yet, confirm by phone.',
  },
} as const;

export function FraudCheckerScreen({ page, manage }: { page: FraudCheckerPage; manage: boolean }) {
  return (
    <ToastProvider>
      <FraudChecker page={page} manage={manage} />
    </ToastProvider>
  );
}

function FraudChecker({ page, manage }: { page: FraudCheckerPage; manage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<FraudLookup | null>(null);
  const [pending, start] = useTransition();
  const check = (p = phone, fresh = false) =>
    start(async () => {
      setPhone(p);
      const r = await fraudLookup(p, true, fresh);
      if (!r.ok) return toast(r.error);
      setResult(r.data);
      router.refresh();
    });
  const level = result?.check ? fraudRisk(result.check) : 'new';
  const L = LEVEL[level];
  const ratio = result?.check?.successRatio ?? null;

  return (
    <>
      <Head
        title="Fraud checker"
        sub="Delivery and return history across Steadfast, Pathao, RedX and Paperfly (BD Courier)."
      />
      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="admin-card p-5">
            <h2 className="text-lg font-bold text-fg">Check any customer before you ship</h2>
            <p className="mt-1 mb-3 text-sm text-slate-400">
              Type a mobile number to see their courier history.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                check();
              }}
            >
              <div className="relative flex-1">
                <AdminIcon
                  name="phone"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  className="admin-input py-3 pl-9 text-base font-bold tabular-nums"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                />
              </div>
              <button
                type="submit"
                className="admin-btn-primary px-5"
                disabled={pending || !page.enabled}
              >
                <AdminIcon name="shield" className="size-4" /> {pending ? 'Checking…' : 'Check'}
              </button>
            </form>
            {!page.enabled ? (
              <p className="mt-2 text-xs text-amber-600">
                The fraud check is not set up (BDCOURIER_API_KEY).
              </p>
            ) : null}
            {page.recent.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500">Recent:</span>
                {page.recent.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="rounded-full px-2.5 py-1 text-xs text-slate-300 ring-1 ring-ink-600 hover:bg-ink-800"
                    onClick={() => check(p)}
                  >
                    {fmtPhone(p)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {result ? (
            <div className="admin-card flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-5">
                <div
                  className="grid size-24 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(${L.c} ${(ratio ?? 100) * 3.6}deg, color-mix(in srgb, currentColor 12%, transparent) 0)`,
                  }}
                >
                  <div className="grid size-[78px] place-items-center rounded-full bg-white text-center dark:bg-ink-900">
                    <div>
                      <b className="block text-xl" style={{ color: L.c }}>
                        {ratio === null ? '—' : `${ratio}%`}
                      </b>
                      <span className="text-[11px] text-slate-500">success</span>
                    </div>
                  </div>
                </div>
                <div className="flex min-w-60 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-xl text-fg tabular-nums">{fmtPhone(result.phone)}</b>
                    {result.name ? <span className="text-slate-400">{result.name}</span> : null}
                    {result.blocked ? (
                      <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-xs font-semibold text-rose-600">
                        Blocked
                      </span>
                    ) : null}
                    <a className="admin-link text-xs" href={`tel:+88${result.phone}`}>
                      Call
                    </a>
                    <a
                      className="admin-link text-xs"
                      href={`https://wa.me/88${result.phone}`}
                      target="_blank"
                      rel="noopener"
                    >
                      WhatsApp
                    </a>
                  </div>
                  {result.check ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-slate-500">Courier parcels</div>
                        <div className="text-xl font-extrabold text-fg">
                          {result.check.totalParcels}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Delivered</div>
                        <div className="text-xl font-extrabold text-emerald-600">
                          {result.check.successParcels}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Returned</div>
                        <div className="text-xl font-extrabold text-rose-600">
                          {result.check.cancelledParcels}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div
                    className="rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{
                      color: L.c,
                      background: `color-mix(in srgb, ${L.c} 10%, transparent)`,
                    }}
                  >
                    {L.t}
                    {L.tip}
                  </div>
                </div>
              </div>
              {result.check?.couriers.length ? (
                <table className="admin-table text-sm">
                  <thead>
                    <tr>
                      <th>Courier</th>
                      <th>Total</th>
                      <th>Delivered</th>
                      <th>Returned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.check.couriers.map((c) => (
                      <tr key={c.name}>
                        <td>{c.name}</td>
                        <td className="tabular-nums">{c.total}</td>
                        <td className="tabular-nums">{c.success}</td>
                        <td className="tabular-nums">{c.cancelled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              <div>
                <h3 className="mb-2 text-sm font-bold text-fg">With Ehans Mart</h3>
                {result.orders.length ? (
                  <div className="divide-y divide-ink-700 text-sm">
                    {result.orders.map((o) => (
                      <div key={o.number} className="flex items-center gap-3 py-2">
                        <Link
                          href={`/admin/orders?q=${o.number}`}
                          className="font-mono font-bold text-fg hover:text-blue-500"
                        >
                          #{o.number}
                        </Link>
                        <span className="flex-1 text-xs text-slate-500">
                          {ago(o.createdAt)} · {tk(o.total)}
                        </span>
                        <StatusPill status={o.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Never ordered from us before.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={pending}
                  onClick={() => check(result.phone, true)}
                >
                  <AdminIcon name="refresh" className="size-4" /> Re-check
                </button>
                {manage && !result.blocked ? (
                  <button
                    type="button"
                    className="admin-btn-secondary text-rose-500"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await blockValue(
                          'phone',
                          result.phone,
                          'Blocked from the fraud checker',
                        );
                        toast(r.ok ? 'Number blocked' : r.error);
                        if (r.ok) setResult({ ...result, blocked: true });
                      })
                    }
                  >
                    <AdminIcon name="ban" className="size-4" /> Block this number
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="admin-card py-12 text-center text-sm text-slate-500">
              <AdminIcon name="shield" className="mx-auto mb-1 size-6" />
              Results show here.
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
            <div>
              <h2 className="font-bold text-fg">Orders waiting to confirm</h2>
              <p className="text-xs text-slate-500">
                {page.waiting.length} pending, call not received or follow up
              </p>
            </div>
            <button
              type="button"
              className="admin-btn-primary h-8 px-3 text-xs"
              disabled={pending || !page.enabled}
              onClick={() =>
                start(async () => {
                  const todo = page.waiting.filter((w) => !w.check);
                  for (const w of todo) await fraudLookup(w.phone, true, false);
                  toast(todo.length ? `${todo.length} checked` : 'All are already checked');
                  router.refresh();
                })
              }
            >
              <AdminIcon name="shield" className="size-3.5" /> Check all
            </button>
          </div>
          <div className="divide-y divide-ink-700 px-5">
            {page.waiting.length ? (
              page.waiting.map((w) => {
                const lv = w.check ? fraudRisk(w.check) : null;
                return (
                  <div key={w.number} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="font-semibold text-fg hover:text-blue-500"
                        onClick={() => check(w.phone)}
                      >
                        {w.customerName}
                      </button>
                      <div className="text-xs text-slate-500 tabular-nums">
                        #{w.number} · {fmtPhone(w.phone)}
                      </div>
                    </div>
                    {lv ? (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          color: LEVEL[lv].c,
                          background: `color-mix(in srgb, ${LEVEL[lv].c} 12%, transparent)`,
                        }}
                      >
                        {w.check!.successRatio === null ? 'New' : `${w.check!.successRatio}%`} ·{' '}
                        {lv === 'safe'
                          ? 'Safe'
                          : lv === 'risky'
                            ? 'Risky'
                            : lv === 'watch'
                              ? 'Medium'
                              : 'No history'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn-secondary h-7 px-2.5 text-xs"
                        onClick={() => check(w.phone)}
                      >
                        Check
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Nothing waiting.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Fraud & security

export function SecurityScreen({ data, manage }: { data: SecurityOverview; manage: boolean }) {
  return (
    <ToastProvider>
      <Security data={data} manage={manage} />
    </ToastProvider>
  );
}

function Security({ data, manage }: { data: SecurityOverview; manage: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<SecuritySettings>(data.settings);
  const [pending, start] = useTransition();
  const num = (v: string) => Math.max(0, Math.floor(Number(v.replace(/\D/g, '')) || 0));
  const row = 'flex items-center justify-between gap-4 border-b border-ink-700 py-3 last:border-0';
  const numberRule = (
    k: 'autoHoldBelow' | 'maxPerDay' | 'dupWindowHours',
    label: string,
    hint: string,
    suffix: string,
  ) => (
    <label className={row}>
      <span>
        <b className="text-sm text-fg">{label}</b>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <input
          className="admin-input w-20 text-right tabular-nums"
          inputMode="numeric"
          disabled={!manage}
          value={s[k]}
          onChange={(e) => setS({ ...s, [k]: num(e.target.value) })}
        />
        <span className="w-10 text-xs text-slate-500">{suffix}</span>
      </span>
    </label>
  );
  return (
    <>
      <Head
        title="Fraud & security"
        sub="Rules that protect orders, and who signed in to the admin."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Blocked"
          icon="ban"
          value={String(data.blockedPhones + data.blockedIps)}
          hint={`${data.blockedPhones} numbers · ${data.blockedIps} IPs`}
          color="#C2414B"
        />
        <Kpi
          label="Risky open orders"
          icon="alert"
          value={String(data.riskyOpen)}
          hint={s.autoHoldBelow ? `Below ${s.autoHoldBelow}% courier success` : 'Hold rule is off'}
          color="#A8690F"
        />
        <Kpi
          label="Duplicate window"
          icon="dup"
          value={`${s.dupWindowHours} h`}
          hint="Same phone or IP is flagged"
          color="#2F6DB0"
        />
        <Kpi
          label="Failed logins"
          icon="shield"
          value={String(data.failedLogins48h)}
          hint="Last 48 hours"
          color={data.failedLogins48h ? '#C2414B' : '#22865A'}
        />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="admin-card p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-bold text-fg">Order protection rules</h2>
            {manage ? (
              <button
                type="button"
                className="admin-btn-secondary h-8 px-3 text-xs"
                disabled={pending || !data.settings.autoHoldBelow}
                title={data.settings.autoHoldBelow ? undefined : 'Save a hold % first'}
                onClick={() =>
                  start(async () => {
                    const r = await runSecurityRules();
                    toast(r.ok ? `${r.data.held} orders put on Follow up` : r.error);
                    if (r.ok) router.refresh();
                  })
                }
              >
                <AdminIcon name="shield" className="size-3.5" /> Run on open orders
              </button>
            ) : null}
          </div>
          {numberRule(
            'autoHoldBelow',
            'Put risky orders on hold',
            'New orders go to Follow up when courier success is below this (0 = off)',
            '%',
          )}
          {numberRule(
            'maxPerDay',
            'Orders per number per day',
            'More than this is refused at checkout (0 = no limit)',
            'max',
          )}
          {numberRule(
            'dupWindowHours',
            'Duplicate order window',
            'Flag open orders with the same phone or IP within',
            'hours',
          )}
          <label className={row}>
            <span>
              <b className="text-sm text-fg">Check new orders automatically</b>
              <span className="block text-xs text-slate-500">
                Runs the courier check as soon as an order arrives (uses BD Courier credit)
              </span>
            </span>
            <input
              type="checkbox"
              className="size-5 accent-blue-600"
              disabled={!manage}
              checked={s.autoCheck}
              onChange={(e) => setS({ ...s, autoCheck: e.target.checked })}
            />
          </label>
          {manage ? (
            <button
              type="button"
              className="admin-btn-primary mt-3"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await saveSecurity({
                    ...s,
                    dupWindowHours: Math.max(1, s.dupWindowHours),
                  });
                  toast(r.ok ? 'Rules saved' : r.error);
                  if (r.ok) router.refresh();
                })
              }
            >
              <AdminIcon name="check" className="size-4" /> Save rules
            </button>
          ) : null}
        </section>
        <section className="admin-card p-5">
          <h2 className="mb-3 font-bold text-fg">Login history</h2>
          <div className="divide-y divide-ink-700">
            {data.logins.length ? (
              data.logins.map((l, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  {l.name ? (
                    <Avatar name={l.name} size={30} />
                  ) : (
                    <span className="grid size-[30px] place-items-center rounded-full bg-rose-600 text-sm font-bold text-white">
                      ?
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <b className="text-sm text-slate-200">{l.name ?? l.email}</b>
                    <div className="truncate text-xs text-slate-500" title={l.userAgent ?? ''}>
                      {l.ipAddress ?? 'unknown IP'} · {(l.userAgent ?? '').slice(0, 60)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
                    >
                      {l.success ? 'Success' : 'Failed'}
                    </span>
                    <div className="text-xs text-slate-500" title={clock(l.createdAt)}>
                      {ago(l.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No sign-ins recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Team activity

const TYPES: Record<ActivityType, [string, string]> = {
  order: ['Orders', 'bag'],
  status: ['Status', 'check'],
  courier: ['Courier', 'truck'],
  note: ['Notes', 'note'],
  edit: ['Edits', 'edit'],
  assign: ['Assign', 'users'],
  block: ['Block', 'ban'],
};

export function TeamScreen({ data }: { data: TeamPage }) {
  const [who, setWho] = useState('all');
  const [type, setType] = useState<ActivityType | 'all'>('all');
  const list = data.events.filter(
    (e) => (who === 'all' || e.who === who) && (type === 'all' || e.type === type),
  );
  const hmax = Math.max(1, ...data.hours);
  const maxConf = Math.max(1, ...data.people.map((p) => p.confirmed));
  const chip = (on: boolean) =>
    `rounded-full px-2.5 py-1 text-xs ring-1 ${on ? 'bg-blue-600 text-white ring-blue-600' : 'text-slate-300 ring-ink-600 hover:bg-ink-800'}`;
  return (
    <>
      <Head
        title="Team activity"
        sub="Who confirmed, cancelled, sent and noted what (last 30 days)."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.people.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`admin-card p-4 text-left transition ${who === p.name ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setWho(who === p.name ? 'all' : p.name)}
          >
            <div className="flex items-center gap-3">
              <Avatar name={p.name} size={40} />
              <div className="min-w-0 flex-1">
                <b className="text-fg">{p.name}</b>
                <div className="text-xs text-slate-500">{p.role}</div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.online ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}
              >
                {p.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center">
              {(
                [
                  ['Confirm', p.confirmed],
                  ['Ready', p.ready],
                  ['Cancel', p.cancelled],
                  ['Fake', p.fake],
                  ['Block', p.blocked],
                ] as const
              ).map(([l, v]) => (
                <div key={l}>
                  <b className="block text-fg tabular-nums">{v}</b>
                  <span className="text-[10px] text-slate-500">{l}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {p.avgConfirmMinutes !== null
                ? `Confirms in about ${p.avgConfirmMinutes >= 60 ? `${Math.floor(p.avgConfirmMinutes / 60)} h ${p.avgConfirmMinutes % 60} m` : `${p.avgConfirmMinutes} min`} · `
                : ''}
              {p.lastActive ? `Last active ${ago(p.lastActive)}` : 'No activity yet'}
            </div>
          </button>
        ))}
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <section className="admin-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-600 px-5 py-4">
            <div>
              <h2 className="font-bold text-fg">Activity log</h2>
              <p className="text-xs text-slate-500">
                {who === 'all' ? 'Everyone' : who} · {list.length} events
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={chip(type === 'all')} onClick={() => setType('all')}>
                All
              </button>
              {(Object.keys(TYPES) as ActivityType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={chip(type === t)}
                  onClick={() => setType(t)}
                >
                  {TYPES[t][0]}
                </button>
              ))}
              {who !== 'all' ? (
                <button type="button" className={chip(false)} onClick={() => setWho('all')}>
                  × {who}
                </button>
              ) : null}
            </div>
          </div>
          <div className="divide-y divide-ink-700 px-5">
            {list.slice(0, 120).map((e, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5">
                <Avatar name={e.who} size={28} />
                <div className="min-w-0 flex-1 text-sm">
                  <b className="text-fg">{e.who}</b>{' '}
                  <span className="inline-flex translate-y-0.5 text-slate-500">
                    <AdminIcon name={TYPES[e.type][1]} className="size-3.5" />
                  </span>{' '}
                  <span className="text-slate-300">{e.text}</span>
                  {e.orderNumber ? (
                    <>
                      {' · '}
                      <Link
                        href={`/admin/orders?q=${e.orderNumber}`}
                        className="admin-link text-xs"
                      >
                        #{e.orderNumber} {e.customerName}
                      </Link>
                    </>
                  ) : null}
                  <div className="text-xs text-slate-500">{ago(e.at)}</div>
                </div>
              </div>
            ))}
            {!list.length ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No activity for this filter.
              </p>
            ) : null}
          </div>
        </section>
        <div className="flex flex-col gap-4">
          <section className="admin-card p-5">
            <h2 className="font-bold text-fg">Confirmed orders by staff</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Confirm, Ready, Cancel, Fake and Block count. Sending to courier does not.
            </p>
            <div className="mt-3 space-y-2.5">
              {[...data.people]
                .sort((a, b) => b.confirmed - a.confirmed)
                .map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar name={p.name} size={26} />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <b className="text-slate-200">
                          {i === 0 && p.confirmed ? '🏆 ' : ''}
                          {p.name}
                        </b>
                        <span className="tabular-nums text-slate-400">
                          <b className="text-fg">{p.confirmed}</b> / {p.handled}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700">
                        <i
                          className="block h-full bg-blue-600"
                          style={{ width: `${(p.confirmed / maxConf) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
          <section className="admin-card p-5">
            <h2 className="font-bold text-fg">Team activity today by hour</h2>
            <svg
              viewBox="0 0 320 110"
              width="100%"
              role="img"
              aria-label="Actions per hour today"
              className="mt-2"
            >
              {data.hours.map((v, h) => (
                <rect
                  key={h}
                  x={h * 13.3 + 2}
                  y={90 - (v / hmax) * 78}
                  width={10}
                  height={Math.max(1, (v / hmax) * 78)}
                  rx={2}
                  fill={v ? '#ff5554' : 'currentColor'}
                  opacity={v ? 1 : 0.15}
                >
                  <title>
                    {h}:00 · {v} actions
                  </title>
                </rect>
              ))}
              {[0, 6, 12, 18, 23].map((h) => (
                <text
                  key={h}
                  x={h * 13.3 + 7}
                  y={106}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.6}
                >
                  {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                </text>
              ))}
            </svg>
          </section>
        </div>
      </div>
    </>
  );
}

export { ORDER_STATUS_LABELS };
