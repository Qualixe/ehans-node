import type { AdminOrderDetail } from '@ehans/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ApiError } from '@/lib/api-client';
import { money } from '@/lib/admin/format';
import { adminApi } from '@/lib/admin/session';
import { STORE } from '@/lib/store-config';
import { PrintButton } from './print-button';

export const metadata: Metadata = { title: 'Invoice', robots: { index: false } };

const PAYMENT: Record<string, string> = { cod: 'Cash on delivery', bkash: 'bKash' };
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// glowy admin/orders/invoice: a plain printable sheet, outside the admin shell
const CSS = `
.inv{min-height:100vh;padding:32px;font:14px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#111827;background:#f3f4f6}
.inv .sheet{max-width:760px;margin:0 auto;background:#fff;padding:40px;border-radius:12px}
.inv header{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #111827;padding-bottom:20px}
.inv h1{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.inv .muted{color:#6b7280}
.inv .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:24px 0}
.inv table{width:100%;border-collapse:collapse}
.inv th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:1px solid #e5e7eb;padding:8px 0}
.inv td{padding:10px 0;border-bottom:1px solid #f3f4f6}
.inv .num{text-align:right}
.inv .totals{margin-left:auto;width:280px;margin-top:16px}
.inv .totals div{display:flex;justify-content:space-between;padding:4px 0}
.inv .totals .grand{border-top:2px solid #111827;margin-top:6px;padding-top:8px;font-weight:700;font-size:18px}
.inv .actions{max-width:760px;margin:0 auto 16px;display:flex;justify-content:flex-end}
.inv .actions button{background:#ff5554;color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer}
@media print{.inv{background:#fff;padding:0}.inv .sheet{padding:0}.inv .actions{display:none}}
`;

async function Invoice({ params }: { params: PageProps<'/admin/invoice/[number]'>['params'] }) {
  const { number } = await params;
  if (!/^[A-Z]{2}\d{6}[A-Z0-9]{5}$/.test(number)) notFound();
  let order: AdminOrderDetail;
  try {
    order = await adminApi<AdminOrderDetail>(`/orders/${number}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    timeZone: 'Asia/Dhaka',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="inv">
      <div className="actions">
        <PrintButton />
      </div>
      <div className="sheet">
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
              #{order.number}
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
            <strong>{order.customerName}</strong>
            <br />
            {order.phone}
            <br />
            {order.address}, {order.city}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="muted" style={{ margin: '0 0 4px' }}>
              Payment
            </p>
            <strong>{PAYMENT[order.paymentMethod] ?? order.paymentMethod}</strong>
            <br />
            Status: {label(order.status)}
            {order.trackingNumber ? (
              <>
                <br />
                {order.courier} · {order.trackingNumber}
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
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.name}
                  {item.variantTitle ? <span className="muted"> ({item.variantTitle})</span> : null}
                </td>
                <td className="num">{money(item.unitPrice)}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{money(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div>
            <span className="muted">Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div>
              <span className="muted">Discount</span>
              <span>−{money(order.discount)}</span>
            </div>
          ) : null}
          <div>
            <span className="muted">Shipping</span>
            <span>{money(order.shippingFee)}</span>
          </div>
          <div className="grand">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 40, textAlign: 'center' }}>
          Thank you for shopping with {STORE.name}!
        </p>
      </div>
    </div>
  );
}

export default function InvoicePage({ params }: PageProps<'/admin/invoice/[number]'>) {
  return (
    <>
      <style>{CSS}</style>
      <Suspense fallback={null}>
        <Invoice params={params} />
      </Suspense>
    </>
  );
}
