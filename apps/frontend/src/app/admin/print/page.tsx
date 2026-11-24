import { type PanelOrderDetail, POS_PAYMENT_METHODS } from '@ehans/shared';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PrintButton } from '../invoice/[number]/print-button';
import { adminApi } from '@/lib/admin/session';
import { STORE } from '@/lib/store-config';

export const metadata: Metadata = { title: 'Print', robots: { index: false } };

const tk = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;
const PAYMENT: Record<string, string> = POS_PAYMENT_METHODS;
const SIZES = {
  '4x3': '4 × 3 in sticker',
  '4x6': '4 × 6 in sticker',
  a4: 'A4 (8 per page)',
} as const;
type Size = keyof typeof SIZES;

// plain printable sheets, outside the admin shell
const CSS = `
.pr{min-height:100vh;padding:24px;font:13px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#111827;background:#f3f4f6}
.pr .bar{max-width:820px;margin:0 auto 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.pr .bar a{padding:6px 10px;border-radius:8px;background:#fff;border:1px solid #e5e7eb;color:#111827;text-decoration:none;font-weight:600}
.pr .bar a.on{background:#111827;color:#fff;border-color:#111827}
.pr .bar button{margin-left:auto;background:#ff5554;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:600;cursor:pointer}
.pr .inv{max-width:820px;margin:0 auto 24px;background:#fff;padding:36px;border-radius:12px;page-break-after:always}
.pr .inv header{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #111827;padding-bottom:16px}
.pr h1{margin:0;font-size:24px;font-weight:700}
.pr .muted{color:#6b7280}
.pr .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
.pr table{width:100%;border-collapse:collapse}
.pr th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:1px solid #e5e7eb;padding:6px 0}
.pr td{padding:8px 0;border-bottom:1px solid #f3f4f6}
.pr .num{text-align:right}
.pr .tot{margin-left:auto;width:280px;margin-top:12px}
.pr .tot div{display:flex;justify-content:space-between;padding:3px 0}
.pr .tot .g{border-top:2px solid #111827;margin-top:6px;padding-top:6px;font-weight:700;font-size:16px}
.pr .slips{max-width:820px;margin:0 auto;display:grid;gap:12px}
.pr .sz-4x3 .slip{width:4in;min-height:3in}
.pr .sz-4x6 .slip{width:4in;min-height:6in}
.pr .sz-a4{grid-template-columns:1fr 1fr}
.pr .sz-a4 .slip{min-height:2.6in}
.pr .slip{background:#fff;border:1.5px dashed #9ca3af;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;page-break-inside:avoid}
.pr .sl-top{display:flex;justify-content:space-between;gap:8px;font-size:12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}
.pr .sl-cour{display:flex;justify-content:space-between;align-items:center;background:#f3f4f6;border-radius:6px;padding:8px}
.pr .sl-cour .cn{font:700 18px/1 ui-monospace,Menlo,monospace;letter-spacing:.04em}
.pr .sl-to{display:flex;flex-direction:column;gap:2px}
.pr .sl-to b{font-size:15px}
.pr .sl-items{font-size:12px;color:#374151}
.pr .sl-cod{display:flex;justify-content:space-between;align-items:center;margin-top:auto;border-top:1px solid #e5e7eb;padding-top:6px}
.pr .sl-cod b{font-size:20px}
.pr .sl-foot{font-size:11px;color:#6b7280;text-align:center}
@media print{.pr{background:#fff;padding:0}.pr .bar{display:none}.pr .inv{padding:0;border-radius:0}.pr .slips{gap:6px}}
`;

function Invoice({ o }: { o: PanelOrderDetail }) {
  const date = new Date(o.createdAt).toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <div className="inv">
      <header>
        <div>
          <h1>{STORE.name}</h1>
          <p className="muted">
            {STORE.phone} · {STORE.email}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1>INVOICE</h1>
          <p className="muted">
            #{o.number}
            <br />
            {date}
          </p>
        </div>
      </header>
      <div className="grid">
        <div>
          <p className="muted" style={{ margin: '0 0 4px' }}>
            Bill to
          </p>
          <strong>{o.customerName}</strong>
          <br />
          {o.phone}
          {o.altPhone ? ` / ${o.altPhone}` : ''}
          <br />
          {o.address}, {o.district}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="muted" style={{ margin: '0 0 4px' }}>
            Payment
          </p>
          <strong>{PAYMENT[o.payment] ?? o.payment}</strong>
          {o.courier?.consignmentId ? (
            <>
              <br />
              {o.courier.name} · CN {o.courier.consignmentId}
            </>
          ) : null}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th className="num">Price</th>
            <th className="num">Qty</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, k) => (
            <tr key={k}>
              <td>
                {i.name}
                {i.variantTitle ? <span className="muted"> ({i.variantTitle})</span> : null}
              </td>
              <td className="num">{tk(i.unitPrice)}</td>
              <td className="num">{i.quantity}</td>
              <td className="num">{tk(i.unitPrice * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="tot">
        <div>
          <span className="muted">Subtotal</span>
          <span>{tk(o.subtotal)}</span>
        </div>
        <div>
          <span className="muted">Delivery</span>
          <span>{tk(o.delivery)}</span>
        </div>
        {o.discount ? (
          <div>
            <span className="muted">Discount</span>
            <span>−{tk(o.discount)}</span>
          </div>
        ) : null}
        <div className="g">
          <span>Total</span>
          <span>{tk(o.total)}</span>
        </div>
        {o.advance ? (
          <>
            <div>
              <span className="muted">Advance paid</span>
              <span>−{tk(o.advance)}</span>
            </div>
            <div className="g">
              <span>Cash to collect</span>
              <span>{tk(o.due)}</span>
            </div>
          </>
        ) : null}
      </div>
      <p className="muted" style={{ marginTop: 32, textAlign: 'center' }}>
        Thank you for shopping with {STORE.name}!
      </p>
    </div>
  );
}

function Slip({ o }: { o: PanelOrderDetail }) {
  return (
    <div className="slip">
      <div className="sl-top">
        <b>{STORE.name}</b>
        <span>#{o.number}</span>
        <span>
          {new Date(o.createdAt).toLocaleDateString('en-GB', {
            timeZone: 'Asia/Dhaka',
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
      <div className="sl-cour">
        {o.courier?.consignmentId ? (
          <>
            <b>{o.courier.name}</b>
            <span className="cn">CN {o.courier.consignmentId}</span>
          </>
        ) : (
          <>
            <b>Courier not assigned</b>
            <span className="muted">Assign a courier to get the CN</span>
          </>
        )}
      </div>
      <div className="sl-to">
        <span className="muted">To</span>
        <b>{o.customerName}</b>
        <b>{o.phone}</b>
        <span>
          {o.address}, {o.district}
        </span>
      </div>
      <div className="sl-items">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</div>
      <div className="sl-cod">
        <span>
          {o.insideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'}
          {o.advance ? ` · advance ${tk(o.advance)} paid` : ''}
        </span>
        <b>COD {tk(o.due)}</b>
      </div>
      <div className="sl-foot">{STORE.phone} · পণ্য দেখে টাকা দিন</div>
    </div>
  );
}

async function Sheets({
  searchParams,
}: {
  searchParams: PageProps<'/admin/print'>['searchParams'];
}) {
  const sp = await searchParams;
  const type = sp.type === 'slip' ? 'slip' : 'invoice';
  const size: Size = typeof sp.size === 'string' && sp.size in SIZES ? (sp.size as Size) : '4x3';
  const numbers = String(sp.numbers ?? '')
    .split(',')
    .filter((n) => /^[A-Z]{2}\d{6}[A-Z0-9]{5}$/.test(n))
    .slice(0, 200);
  const orders = (
    await Promise.all(
      numbers.map((n) => adminApi<PanelOrderDetail>(`/order-panel/orders/${n}`).catch(() => null)),
    )
  ).filter((o): o is PanelOrderDetail => o !== null);
  const base = `/admin/print?type=slip&numbers=${numbers.join(',')}`;
  const noCn = orders.filter((o) => !o.courier?.consignmentId).length;

  return (
    <div className="pr">
      <div className="bar">
        {type === 'slip'
          ? (Object.keys(SIZES) as Size[]).map((s) => (
              <a key={s} href={`${base}&size=${s}`} className={s === size ? 'on' : ''}>
                {SIZES[s]}
              </a>
            ))
          : null}
        {type === 'slip' && noCn ? (
          <span style={{ color: '#a8690f', fontWeight: 600 }}>{noCn} without courier CN</span>
        ) : null}
        <PrintButton label={type === 'slip' ? 'Print slips' : 'Print invoices'} />
      </div>
      {!orders.length ? (
        <p className="muted" style={{ textAlign: 'center' }}>
          No orders to print.
        </p>
      ) : null}
      {type === 'invoice' ? (
        orders.map((o) => <Invoice key={o.number} o={o} />)
      ) : (
        <div className={`slips sz-${size}`}>
          {orders.map((o) => (
            <Slip key={o.number} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Invoices and parcel slips for one or many orders (order panel "Invoices" / "Slips"). */
export default function PrintPage({ searchParams }: PageProps<'/admin/print'>) {
  return (
    <>
      <style>{CSS}</style>
      <Suspense fallback={null}>
        <Sheets searchParams={searchParams} />
      </Suspense>
    </>
  );
}
