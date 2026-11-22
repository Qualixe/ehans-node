/** "Tk 1,250.00" — same format as the ehans-mart template's formatPrice(). */
export function formatPrice(amount: number): string {
  return `Tk ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "tk1250" — compact format used on template product cards. */
export function formatCardPrice(amount: number): string {
  return `tk${Math.round(amount)}`;
}

/** "(495 +)" style review count label used on cards. */
export function formatRatingCount(count: number): string {
  return `(${count} +)`;
}

export function productUrl(slug: string): string {
  return `/products/${slug}`;
}

export function collectionUrl(slug?: string): string {
  return slug ? `/collections/${slug}` : '/collections';
}
