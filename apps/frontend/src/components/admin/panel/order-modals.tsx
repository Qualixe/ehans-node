'use client';

import {
  type FraudCheckDto,
  fraudRisk,
  type PanelOrderDetail,
  type PanelOrderRow,
} from '@ehans/shared';
import { useEffect, useState, useTransition } from 'react';
import {
  addPanelNote,
  blockFromOrder,
  bookCourier,
  bookCourierBulk,
  cancelDuplicate,
  getPanelOrder,
  keepDuplicate,
  pathaoOptions,
} from '@/app/admin/(panel)/orders/panel-actions';
import { runFraudCheck } from '@/app/admin/(panel)/orders/actions';
import { AdminIcon } from '../icon';
import { clock, fmtPhone, Modal, StatusPill, tk, useToast } from './panel-ui';

type Done = () => void;

// ---------------------------------------------------------------- notes

const NOTE_PRESETS: [string, string[]][] = [
  ['Call', ['২ বার কল দেওয়া হয়েছে', '৪ বার কল দেওয়া হয়েছে', 'ফোন বন্ধ', 'নাম্বার ব্যস্ত', 'ভুল নাম্বার']],
  [
    'Customer',
    [
      'পরে জানাতে চেয়েছেন',
      'পরিবারের সাথে কথা বলে জানাবে',
      'কাস্টমার আপডেট জানাবে',
      'সন্ধ্যার পরে কল দিতে বলছে',
      'অর্ডার করেনি বলছে',
      'কাস্টমার দাম কম বলে',
    ],
  ],
  [
    'Payment',
    [
      'ডেলিভারি চার্জ অ্যাডভান্স দিবে না বলেছে',
      'অ্যাডভান্স চাওয়া হয়েছে',
      'ডিসকাউন্ট চেয়েছে, দেইনি বলে ক্যান্সেল হয়েছে',
    ],
  ],
];

export function NotesModal({
  order,
  onClose,
  onSaved,
}: {
  order: PanelOrderRow;
  onClose: Done;
  onSaved: Done;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState<PanelOrderDetail | null>(null);
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  useEffect(() => {
    void getPanelOrder(order.number).then((r) => r.ok && setDetail(r.data));
  }, [order.number]);
  const add = (v: string) =>
    setText((t) => (t.includes(v) ? t : t.trim() ? `${t.trim()} · ${v}` : v));
  const save = () => {
    if (!text.trim()) return toast('Write a note first');
    start(async () => {
      const r = await addPanelNote(order.number, text);
      if (!r.ok) return toast(r.error);
      toast('Note saved');
      onSaved();
    });
  };
  return (
    <Modal
      title={`Notes · #${order.number}`}
      subtitle={order.customerName}
      onClose={onClose}
      footer={
        <>
          <span className="flex-1" />
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="admin-btn-primary" disabled={pending} onClick={save}>
            <AdminIcon name="check" className="size-4" /> Save note
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ol className="space-y-2.5 border-l border-ink-600 pl-4 text-sm">
          {detail === null ? (
            <li className="text-slate-500">Loading…</li>
          ) : detail.noteList.length ? (
            [...detail.noteList].reverse().map((n, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-blue-600" />
                <span className="text-slate-200">{n.body}</span>
                <span className="block text-xs text-slate-500">
                  {n.author} · {clock(n.at)}
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No notes yet.</li>
          )}
        </ol>
        <div className="space-y-2">
          {NOTE_PRESETS.map(([group, list]) => (
            <div key={group} className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-xs font-semibold text-slate-500">{group}</span>
              {list.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-xs ring-1 ${text.includes(t) ? 'bg-blue-600 text-white ring-blue-600' : 'text-slate-300 ring-ink-600 hover:bg-ink-800'}`}
                  onClick={() => add(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          ))}
          <p className="text-xs text-slate-500">Tap one or more to add them.</p>
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
          New note
          <textarea
            className="admin-input"
            rows={3}
            maxLength={2000}
            placeholder="Write what the team should know"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- duplicates

export function DuplicatesModal({
  order,
  rows,
  onClose,
  onChanged,
  onShowAll,
}: {
  order: PanelOrderRow;
  rows: PanelOrderRow[];
  onClose: Done;
  onChanged: Done;
  onShowAll: (phone: string) => void;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [detail, setDetail] = useState<PanelOrderDetail | null>(null);
  useEffect(() => {
    void getPanelOrder(order.number).then((r) => r.ok && setDetail(r.data));
  }, [order.number]);
  const group = [order, ...rows.filter((r) => order.duplicates.includes(r.number))].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const missing = order.duplicates.filter((n) => !group.some((g) => g.number === n));
  const why = (x: PanelOrderRow) =>
    x.number === order.number
      ? ''
      : x.phone === order.phone && x.ipAddress && x.ipAddress === order.ipAddress
        ? 'Same phone + IP'
        : x.phone === order.phone
          ? 'Same phone'
          : 'Same IP';
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return toast(r.error ?? 'Failed');
      toast(msg);
      onChanged();
    });
  const previous = (detail?.previousOrders ?? []).filter(
    (p) => !group.some((g) => g.number === p.number),
  );

  return (
    <Modal
      size="mid"
      title={`Duplicate orders · ${group.length + missing.length}`}
      subtitle={`${order.customerName} · ${fmtPhone(order.phone)} · within 72 h`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => onShowAll(order.phone)}
          >
            <AdminIcon name="search" className="size-4" /> Show in order list
          </button>
          <span className="flex-1" />
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {group.map((x, i) => (
          <div
            key={x.number}
            className={`rounded-xl p-3 ring-1 ${x.number === order.number ? 'ring-blue-500/60' : 'ring-ink-600'}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-fg">#{x.number}</span>
              {i === 0 ? (
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                  First
                </span>
              ) : null}
              {x.number === order.number ? (
                <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-sky-600">
                  This order
                </span>
              ) : (
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600">
                  {why(x)}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">{clock(x.createdAt)}</span>
              <StatusPill status={x.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-start gap-4 text-sm">
              <div className="min-w-48">
                <b className="text-fg">{x.customerName}</b>
                <div className="text-xs text-slate-500">
                  {fmtPhone(x.phone)} · {x.address}, {x.district}
                </div>
                <div className="text-xs text-slate-500">
                  {x.source} · IP {x.ipAddress ?? '—'}
                </div>
              </div>
              <div className="flex-1 text-xs text-slate-300">
                {x.items.map((it, k) => (
                  <div key={k}>
                    {it.name} · {it.quantity} × {tk(it.unitPrice)}
                  </div>
                ))}
              </div>
              <b className="tabular-nums text-fg">{tk(x.total)}</b>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="admin-btn-secondary h-8 px-3 text-xs"
                disabled={pending}
                onClick={() => act(() => keepDuplicate(x.number), `Kept #${x.number}`)}
              >
                <AdminIcon name="check" className="size-3.5" /> Keep this, cancel others
              </button>
              {['pending', 'confirmed', 'no_answer', 'follow_up', 'ready'].includes(x.status) ? (
                <button
                  type="button"
                  className="admin-btn-secondary h-8 px-3 text-xs text-rose-500"
                  disabled={pending}
                  onClick={() => {
                    const kept = group.find((g) => g.number !== x.number)?.number ?? order.number;
                    act(
                      () => cancelDuplicate(x.number, kept),
                      `#${x.number} cancelled as duplicate`,
                    );
                  }}
                >
                  <AdminIcon name="x" className="size-3.5" /> Cancel as duplicate
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {missing.length ? (
          <p className="text-xs text-slate-500">
            Also: {missing.map((n) => `#${n}`).join(', ')} (not on this page).
          </p>
        ) : null}
        <div className="mt-1">
          <h4 className="mb-2 text-sm font-bold text-fg">Previous orders · {previous.length}</h4>
          {previous.length ? (
            <div className="divide-y divide-ink-700 text-xs">
              {previous.map((p) => (
                <div
                  key={p.number}
                  className="grid grid-cols-[90px_70px_1fr_80px_80px_auto] items-center gap-2 py-2"
                >
                  <span className="font-mono text-slate-400">#{p.number}</span>
                  <span className="text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="truncate text-slate-300">{p.items}</span>
                  <span className="text-slate-500">{p.courier ?? 'No courier'}</span>
                  <b className="text-right tabular-nums">{tk(p.total)}</b>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No earlier orders from this number.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- fraud report

const LEVEL = {
  safe: { t: 'Safe customer', c: 'text-emerald-600', bg: 'bg-emerald-500/10', ring: '#22865A' },
  watch: {
    t: 'Check before shipping',
    c: 'text-amber-600',
    bg: 'bg-amber-500/10',
    ring: '#A8690F',
  },
  risky: { t: 'High return risk', c: 'text-rose-600', bg: 'bg-rose-500/10', ring: '#C2414B' },
  new: { t: 'No courier history', c: 'text-sky-600', bg: 'bg-sky-500/10', ring: '#2F6DB0' },
} as const;

export function FraudModal({
  order,
  check: initial,
  enabled,
  onClose,
  onChecked,
}: {
  order: PanelOrderRow;
  check: FraudCheckDto | null;
  enabled: boolean;
  onClose: Done;
  onChecked: (c: FraudCheckDto) => void;
}) {
  const toast = useToast();
  const [check, setCheck] = useState(initial);
  const [detail, setDetail] = useState<PanelOrderDetail | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    void getPanelOrder(order.number).then((r) => r.ok && setDetail(r.data));
  }, [order.number]);
  const run = (fresh: boolean) =>
    start(async () => {
      const r = await runFraudCheck(order.number, fresh);
      if (!r.ok) return toast(r.error);
      setCheck(r.check);
      onChecked(r.check);
    });
  useEffect(() => {
    if (!initial && enabled) run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);

  const level = check ? fraudRisk(check) : 'new';
  const L = LEVEL[level];
  const ratio = check?.successRatio ?? null;
  const prev = detail?.previousOrders ?? [];
  const ourReturns = prev.filter((p) => p.status === 'returned').length;
  const ourFake = prev.filter((p) => p.status === 'fake' || p.status === 'cancelled').length;
  const signals: { bad: boolean; text: string }[] = [
    {
      bad: ratio !== null && ratio < 80,
      text:
        ratio === null
          ? 'No courier history yet'
          : ratio < 80
            ? `Courier success only ${ratio}%`
            : `Courier success ${ratio}%`,
    },
    {
      bad: ourReturns > 0,
      text: ourReturns
        ? `${ourReturns} parcel${ourReturns > 1 ? 's' : ''} returned with us`
        : 'No returns with Ehans Mart',
    },
    {
      bad: ourFake > 0,
      text: ourFake
        ? `${ourFake} fake/cancelled order${ourFake > 1 ? 's' : ''} with us`
        : 'No fake or cancelled orders with us',
    },
    {
      bad: order.duplicates.length > 0,
      text: order.duplicates.length
        ? `${order.duplicates.length + 1} orders in 72 h (duplicate)`
        : 'No duplicate order',
    },
    {
      bad: order.blocked,
      text: order.blocked ? 'Number or IP is on the block list' : 'Number and IP are not blocked',
    },
    {
      bad: (detail?.ipNames.length ?? 0) > 1,
      text:
        (detail?.ipNames.length ?? 0) > 1
          ? `Same IP used by ${detail!.ipNames.length} different names`
          : 'IP used by this customer only',
    },
    {
      bad: order.total >= 2000 && !prev.length,
      text:
        order.total >= 2000 && !prev.length
          ? `High value (${tk(order.total)}) from a first-time buyer`
          : prev.length
            ? `Returning customer (${prev.length} orders)`
            : 'Order value is normal',
    },
  ];

  return (
    <Modal
      size="mid"
      title="Courier fraud check"
      subtitle={`${order.customerName} · ${fmtPhone(order.phone)}`}
      onClose={onClose}
      footer={
        <>
          {check ? (
            <span className="text-xs text-slate-500">Checked {clock(check.checkedAt)}</span>
          ) : null}
          <span className="flex-1" />
          {enabled ? (
            <button
              type="button"
              className="admin-btn-secondary"
              disabled={pending}
              onClick={() => run(true)}
            >
              <AdminIcon name="refresh" className="size-4" /> {pending ? 'Checking…' : 'Re-check'}
            </button>
          ) : null}
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {!check && !enabled ? (
        <p className="text-sm text-slate-400">The fraud check is not set up (BDCOURIER_API_KEY).</p>
      ) : !check ? (
        <p className="text-sm text-slate-400">Checking 4 couriers…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <div
              className="grid size-24 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${L.ring} ${(ratio ?? 100) * 3.6}deg, color-mix(in srgb, currentColor 12%, transparent) 0)`,
              }}
            >
              <div className="grid size-[78px] place-items-center rounded-full bg-white text-center dark:bg-ink-900">
                <div>
                  <b className={`block text-xl ${L.c}`}>{ratio === null ? '—' : `${ratio}%`}</b>
                  <span className="text-[11px] text-slate-500">success</span>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-slate-500">Total parcels</div>
                  <div className="text-xl font-extrabold text-fg">{check.totalParcels}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Delivered</div>
                  <div className="text-xl font-extrabold text-emerald-600">
                    {check.successParcels}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Returned</div>
                  <div className="text-xl font-extrabold text-rose-600">
                    {check.cancelledParcels}
                  </div>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${L.bg} ${L.c}`}
              >
                <AdminIcon name={level === 'risky' ? 'alert' : 'shield'} className="size-4" />
                {L.t}
                {level === 'risky'
                  ? '. Ask for advance delivery charge before shipping.'
                  : level === 'watch'
                    ? '. Call and confirm before sending.'
                    : level === 'new'
                      ? '. First time with couriers, confirm by phone.'
                      : '. Safe to ship.'}
              </div>
            </div>
          </div>
          {check.couriers.length ? (
            <table className="admin-table text-sm">
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Total</th>
                  <th>Delivered</th>
                  <th>Returned</th>
                  <th className="w-1/3">Success rate</th>
                </tr>
              </thead>
              <tbody>
                {check.couriers.map((c) => {
                  const p = c.total ? Math.round((c.success / c.total) * 100) : null;
                  const col =
                    p === null ? '#ccc' : p >= 80 ? '#22865A' : p >= 55 ? '#A8690F' : '#C2414B';
                  return (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td className="tabular-nums">{c.total}</td>
                      <td className="tabular-nums">{c.success}</td>
                      <td className="tabular-nums">{c.cancelled}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                            <i
                              className="block h-full"
                              style={{ width: `${p ?? 0}%`, background: col }}
                            />
                          </span>
                          <span className="w-9 text-right text-xs tabular-nums">
                            {p === null ? '—' : `${p}%`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
          <div>
            <h4 className="mb-2 text-sm font-bold text-fg">Risk signals</h4>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {signals.map((s, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 ${s.bad ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}`}
                >
                  <AdminIcon name={s.bad ? 'alert' : 'check'} className="size-4 shrink-0" />
                  {s.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------- block

export function BlockModal({
  order,
  onClose,
  onDone,
}: {
  order: PanelOrderRow;
  onClose: Done;
  onDone: Done;
}) {
  const toast = useToast();
  const [phone, setPhone] = useState(true);
  const [ip, setIp] = useState(false);
  const [reason, setReason] = useState('');
  const [cancel, setCancel] = useState(
    ['pending', 'confirmed', 'no_answer', 'follow_up', 'ready'].includes(order.status),
  );
  const [pending, start] = useTransition();
  const row = 'flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm ring-1 ring-ink-600';
  return (
    <Modal
      title="Block customer"
      subtitle={`${order.customerName} · #${order.number}`}
      onClose={onClose}
      footer={
        <>
          <span className="flex-1" />
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={pending || (!phone && !ip)}
            onClick={() =>
              start(async () => {
                const r = await blockFromOrder(order.number, { phone, ip, reason, cancel });
                if (!r.ok) return toast(r.error);
                toast(r.data.added ? 'Customer blocked' : 'Nothing new to block');
                onDone();
              })
            }
          >
            <AdminIcon name="ban" className="size-4" /> Block
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className={row}>
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-blue-600"
            checked={phone}
            onChange={(e) => setPhone(e.target.checked)}
          />
          <span>
            <b className="text-fg">Phone number</b>{' '}
            <span className="tabular-nums">{fmtPhone(order.phone)}</span>
          </span>
        </label>
        <label className={row}>
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-blue-600"
            checked={ip}
            disabled={!order.ipAddress}
            onChange={(e) => setIp(e.target.checked)}
          />
          <span>
            <b className="text-fg">IP address</b>{' '}
            <span className="tabular-nums">{order.ipAddress ?? 'not known'}</span>
            <span className="block text-xs text-slate-500">
              Stops new orders from this device or network
            </span>
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
          Reason
          <textarea
            className="admin-input"
            rows={2}
            maxLength={300}
            placeholder="e.g. Refused parcels twice"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            className="size-4 accent-blue-600"
            checked={cancel}
            onChange={(e) => setCancel(e.target.checked)}
          />
          Also cancel this order
        </label>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- courier

const COURIER_INFO: Record<string, { color: string; eta: string }> = {
  steadfast: { color: '#0E9F6E', eta: 'Inside Dhaka 24h · Outside 48–72h' },
  pathao: { color: '#E5322D', eta: 'Inside Dhaka 24h · Outside 48h' },
};

export function CourierModal({
  orders,
  couriers,
  onClose,
  onDone,
}: {
  orders: PanelOrderRow[];
  couriers: { id: string; name: string; ready: boolean }[];
  onClose: Done;
  onDone: Done;
}) {
  const toast = useToast();
  const list = orders.filter(
    (o) =>
      !o.courier &&
      !o.blocked &&
      ['pending', 'confirmed', 'no_answer', 'follow_up', 'ready'].includes(o.status),
  );
  const one = list.length === 1 ? list[0]! : null;
  const [pick, setPick] = useState(couriers.find((c) => c.ready)?.id ?? 'steadfast');
  const [cod, setCod] = useState(one ? String(one.due) : '');
  const [note, setNote] = useState('');
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [zones, setZones] = useState<{ id: number; name: string }[]>([]);
  const [areas, setAreas] = useState<{ id: number; name: string }[]>([]);
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ready = couriers.find((c) => c.id === pick)?.ready ?? false;

  // Pathao needs city + zone: load the lists, guess the city from the district
  useEffect(() => {
    if (pick !== 'pathao' || !ready || !one) return;
    void pathaoOptions('cities').then(
      (r) => r.ok && setCities(r.data as { id: number; name: string }[]),
    );
    void pathaoOptions('cityFor', one.district).then((r) => {
      const id = r.ok ? (r.data as { cityId: number | null }).cityId : null;
      if (id) setCity(String(id));
    });
  }, [pick, ready, one]);
  useEffect(() => {
    if (!city) return;
    void pathaoOptions('zones', city).then(
      (r) => r.ok && setZones(r.data as { id: number; name: string }[]),
    );
  }, [city]);
  useEffect(() => {
    if (!zone) return;
    void pathaoOptions('areas', zone).then(
      (r) => r.ok && setAreas(r.data as { id: number; name: string }[]),
    );
  }, [zone]);

  const book = () => {
    setError(null);
    start(async () => {
      if (one) {
        const r = await bookCourier(one.number, {
          courier: pick,
          cod: Number(cod) || 0,
          note: note || null,
          ...(pick === 'pathao'
            ? {
                pathao: {
                  cityId: Number(city),
                  zoneId: Number(zone),
                  areaId: area ? Number(area) : null,
                },
              }
            : {}),
        });
        if (!r.ok) return setError(r.error);
        toast(`Parcel booked · CN ${r.data.consignmentId}`);
      } else {
        const r = await bookCourierBulk(list.map((o) => o.number));
        if (!r.ok) return setError(r.error);
        toast(
          `${r.data.booked.length} parcels booked${r.data.failed.length ? ` · ${r.data.failed.length} failed` : ''}`,
        );
        if (r.data.failed.length)
          return setError(r.data.failed.map((f) => `#${f.number}: ${f.reason}`).join(' · '));
      }
      onDone();
    });
  };

  if (!list.length) {
    return (
      <Modal
        title="Send to courier"
        onClose={onClose}
        footer={
          <button type="button" className="admin-btn-secondary ml-auto" onClick={onClose}>
            Close
          </button>
        }
      >
        <p className="text-sm text-slate-400">
          None of the selected orders can be sent to a courier (already sent, blocked, or closed).
        </p>
      </Modal>
    );
  }
  const pathaoBulk = !one && pick === 'pathao';
  return (
    <Modal
      size="mid"
      title={one ? `Assign courier · #${one.number}` : `Send ${list.length} orders to courier`}
      subtitle={
        one
          ? `${one.customerName}, ${one.district}`
          : `Total COD ${tk(list.reduce((n, o) => n + o.due, 0))}`
      }
      onClose={onClose}
      footer={
        <>
          {error ? <span className="max-w-lg text-sm text-rose-500">{error}</span> : null}
          <span className="flex-1" />
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={pending || !ready || pathaoBulk || (pick === 'pathao' && (!city || !zone))}
            onClick={book}
          >
            <AdminIcon name="truck" className="size-4" />{' '}
            {pending ? 'Booking…' : `Create consignment${list.length > 1 ? 's' : ''}`}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {couriers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPick(c.id)}
              className={`flex items-center gap-3 rounded-xl p-3 text-left ring-1 ${pick === c.id ? 'bg-blue-500/5 ring-blue-500' : 'ring-ink-600 hover:bg-ink-800'}`}
            >
              <span
                className="grid size-9 place-items-center rounded-lg text-sm font-bold text-white"
                style={{ background: COURIER_INFO[c.id]?.color ?? '#555' }}
              >
                {c.name[0]}
              </span>
              <span>
                <b className="block text-fg">{c.name}</b>
                <small className="text-xs text-slate-500">
                  {c.ready ? COURIER_INFO[c.id]?.eta : 'Not set up: add its API keys to the server'}
                </small>
              </span>
            </button>
          ))}
        </div>
        {one ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
                COD amount
                <input
                  className="admin-input tabular-nums"
                  inputMode="numeric"
                  value={cod}
                  onChange={(e) => setCod(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
                Items
                <input
                  className="admin-input"
                  disabled
                  value={one.items.reduce((n, i) => n + i.quantity, 0)}
                />
              </label>
            </div>
            {pick === 'pathao' && ready ? (
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
                  City
                  <select
                    className="admin-input"
                    value={city}
                    onChange={(e) => {
                      // a new city clears the zone and area chosen for the old one
                      setCity(e.target.value);
                      setZones([]);
                      setZone('');
                      setAreas([]);
                      setArea('');
                    }}
                  >
                    <option value="">Choose…</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
                  Zone
                  <select
                    className="admin-input"
                    value={zone}
                    onChange={(e) => {
                      setZone(e.target.value);
                      setAreas([]);
                      setArea('');
                    }}
                    disabled={!zones.length}
                  >
                    <option value="">Choose…</option>
                    {zones.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
                  Area (optional)
                  <select
                    className="admin-input"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={!areas.length}
                  >
                    <option value="">—</option>
                    {areas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-400">
              Note for rider
              <input
                className="admin-input"
                maxLength={250}
                placeholder="e.g. Call before delivery"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </>
        ) : (
          <p className="text-xs text-slate-500">{list.map((o) => `#${o.number}`).join(', ')}</p>
        )}
        {pathaoBulk ? (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            Pathao needs a city and zone for each parcel: send Pathao orders one at a time.
          </p>
        ) : null}
        <p className="flex items-start gap-2 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-400">
          <AdminIcon name="truck" className="size-4 shrink-0" />
          The courier creates a real consignment (CN) and tracking code; they are saved on the order
          and its status moves to Shipped.
        </p>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- confirm

export function ConfirmModal({
  title,
  text,
  confirm,
  danger,
  onClose,
  onConfirm,
}: {
  title: string;
  text: string;
  confirm: string;
  danger?: boolean;
  onClose: Done;
  onConfirm: () => Promise<void> | void;
}) {
  const [pending, start] = useTransition();
  return (
    <Modal
      size="sm"
      title={title}
      onClose={onClose}
      footer={
        <>
          <span className="flex-1" />
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Keep it
          </button>
          <button
            type="button"
            className={danger ? 'admin-btn-danger' : 'admin-btn-primary'}
            disabled={pending}
            onClick={() => start(async () => onConfirm())}
          >
            {confirm}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-300">{text}</p>
    </Modal>
  );
}
