import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Ehans Mart | Home',
    template: 'Ehans Mart | %s',
  },
  description:
    'ইহান্স মার্ট - আপনার স্মার্ট অনলাইন শপিং পার্টনার। Quality products, honest prices and cash on delivery — anywhere in Bangladesh.',
  icons: {
    icon: [{ url: '/assets/images/fav.png', type: 'image/png', sizes: '32x32' }],
    apple: '/assets/images/fav.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout: document only. Each area brings its own styles:
 *   (store) → ehans-mart template CSS, admin (later) → Tailwind.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // suppressHydrationWarning: the store's inline script sets header-space styles on
    // <html>/<body> before React hydrates (prevents a layout jump on first paint)
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
