// Home page media copied from the live ehansmart.com home page (same owner), fetched 2026-11-22.
// Files live in public/assets/live. Moves to the admin "Banners" module when it is ported.

export const HOME_HERO_SLIDES = [
  {
    desktop: '/assets/live/hero/hero-1.webp',
    mobile: '/assets/live/hero/hero-1-mobile.webp',
    alt: 'Bangladeshi fast-growing e-commerce brand',
    heading: 'Bangladeshi fast-growing e-commerce brand',
    href: '/collections/all',
  },
] as const;

export const HOME_GRID_BANNERS = [
  {
    href: '/collections/women-s-essentials',
    desktop: '/assets/live/banners/banner-1.webp',
    mobile: '/assets/live/banners/banner-1-mobile.webp',
    title: 'Women’s Essentials',
    text: 'Beauty, care & style picks for every day',
    slug: 'women-s-essentials',
  },
  {
    href: '/collections/home-kitchen',
    desktop: '/assets/live/banners/banner-2.webp',
    mobile: '/assets/live/banners/banner-2-mobile.webp',
    title: 'Home & Kitchen',
    text: 'Cook, serve & live better',
    slug: 'home-kitchen',
  },
  {
    href: '/collections/man-s-essentials',
    desktop: '/assets/live/banners/banner-3.webp',
    mobile: '/assets/live/banners/banner-3-mobile.webp',
    title: 'Man’s Essentials',
    text: 'Grooming & style for him',
    slug: 'man-s-essentials',
  },
] as const;

export const STORE_LOGO = '/assets/live/brand/ehans-mart-logo.webp';
