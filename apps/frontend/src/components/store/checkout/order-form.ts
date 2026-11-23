/** Client-side checks for the order forms (the API validates again; these only help the shopper). */

const toEnglishDigits = (v: string) => v.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));

/** "+88 017-1234 5678" / Bangla digits → "01712345678". */
export const normalizePhone = (v: string) =>
  toEnglishDigits(v)
    .replace(/[\s-]/g, '')
    .replace(/^\+?88/, '');

export const ORDER_RULES = {
  // in the order the forms show them (the first invalid one gets focus)
  name: (v: string) => v.trim().length >= 2,
  phone: (v: string) => /^01[3-9]\d{8}$/.test(normalizePhone(v)),
  district: (v: string) => v !== '',
  address: (v: string) => v.trim().length >= 8,
};
export type OrderField = keyof typeof ORDER_RULES;
export const ORDER_FIELDS = Object.keys(ORDER_RULES) as OrderField[];

export const confirmationUrl = (order: { number: string; token: string }) =>
  `/orders/${order.number}?t=${encodeURIComponent(order.token)}`;
