'use client';

export function PrintButton({ label = 'Print invoice' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
