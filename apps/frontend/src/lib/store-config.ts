/**
 * Storefront contact + shipping constants (from the ehans-mart template).
 * These move to the admin "Settings" module when it is ported from glowy.
 */
export const STORE = {
  name: 'Ehans Mart',
  phone: '+8801841650668',
  whatsapp: '8801841650668',
  email: 'info@ehansmart.com',
  shippingOptions: [
    { value: 130, label: 'Outside Dhaka' },
    { value: 80, label: 'Inside Dhaka' },
  ],
} as const;

export function whatsappOrderUrl(productName: string): string {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Hi, I want to order: ${productName}`)}`;
}
