// Navigation copied from the live ehansmart.com theme menus (same owner), 2026-11-22.
// Moves to the admin "Menus" settings when the admin is ported.

export interface NavLink {
  label: string;
  href: string;
  image?: string | null;
}

export interface MegaMenuColumn {
  title: string;
  href: string;
  links: NavLink[];
}

export interface HeaderNavLink {
  label: string;
  href: string;
  columns: MegaMenuColumn[];
}

export interface CategoryGroup {
  title: string;
  href: string;
  image: string | null;
  links: NavLink[];
}

/** Rotating words in the header search button. */
export const SEARCH_WORDS: string[] = ['kitchen tools', 'home decoration', 'baby product'];

export const POPULAR_SEARCHES: string[] = [
  'apron',
  'hair clip',
  'fridge',
  'baby safety',
  'kitchen',
  'face mask',
];

/** Search panel "shop by category" tiles. */
export const SEARCH_CATEGORIES: NavLink[] = [
  {
    label: 'Baby & Kids',
    href: '/collections/baby-care',
    image: '/assets/live/collections/baby-care.webp',
  },
  {
    label: 'Women’s Essentials',
    href: '/collections/women-s-essentials',
    image: '/assets/live/collections/women-s-essentials.webp',
  },
  {
    label: 'Man’s Essentials',
    href: '/collections/man-s-essentials',
    image: '/assets/live/collections/man-s-essentials.webp',
  },
];

/** "All Categories" menu (desktop) and the mobile category browser. */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: 'Beauty & Personal Care',
    href: '/collections/beauty-personal-care',
    image: '/assets/live/collections/beauty-personal-care.webp',
    links: [
      {
        label: 'Beauty Tools',
        href: '/collections/beauty-tools',
        image: '/assets/live/collections/beauty-tools.webp',
      },
      {
        label: 'Personal Care',
        href: '/collections/personal-care',
        image: '/assets/live/collections/personal-care.webp',
      },
      {
        label: 'Hair Accessories',
        href: '/collections/hair-accessories',
        image: '/assets/live/collections/hair-accessories.webp',
      },
      {
        label: 'Health & Wellness',
        href: '/collections/health-wellness',
        image: '/assets/live/collections/health-wellness.webp',
      },
    ],
  },
  {
    title: 'Baby & Mother',
    href: '/collections/baby-mother',
    image: '/assets/live/collections/baby-mother.webp',
    links: [
      {
        label: 'Baby & Kids',
        href: '/collections/baby-care',
        image: '/assets/live/collections/baby-care.webp',
      },
      {
        label: 'Baby Safety',
        href: '/collections/baby-safety',
        image: '/assets/live/collections/baby-safety.webp',
      },
      {
        label: "Kids' Fashion",
        href: '/collections/kids-fashion',
        image: '/assets/live/collections/kids-fashion.webp',
      },
      {
        label: 'School Essentials',
        href: '/collections/school-essentials',
        image: '/assets/live/collections/school-essentials.webp',
      },
      {
        label: 'Mother Care',
        href: '/collections/mother-care',
        image: '/assets/live/collections/mother-care.webp',
      },
    ],
  },
  {
    title: 'Home & Living',
    href: '/collections/home-living',
    image: '/assets/live/collections/home-living.webp',
    links: [
      {
        label: 'Home Organization',
        href: '/collections/home-organization',
        image: '/assets/live/collections/home-organization.webp',
      },
      {
        label: 'Home Decor',
        href: '/collections/home-decor',
        image: '/assets/live/collections/home-decor.webp',
      },
      {
        label: 'Home Improvement',
        href: '/collections/home-improvement',
        image: '/assets/live/collections/home-improvement.webp',
      },
      {
        label: 'Cleaning Supplies',
        href: '/collections/cleaning-supplies',
        image: '/assets/live/collections/cleaning-supplies.webp',
      },
      {
        label: 'Bathroom Essentials',
        href: '/collections/bathroom-essentials',
        image: '/assets/live/collections/bathroom-essentials.webp',
      },
    ],
  },
  {
    title: 'Kitchen & Dining',
    href: '/collections/kitchen-dining',
    image: '/assets/live/collections/kitchen-dining.webp',
    links: [
      {
        label: 'Kitchen Tools',
        href: '/collections/kitchen-tools',
        image: '/assets/live/collections/kitchen-tools.webp',
      },
      {
        label: 'Kitchen Cleaning',
        href: '/collections/kitchen-cleaning',
        image: '/assets/live/collections/kitchen-cleaning.webp',
      },
      {
        label: 'Kitchen Safety',
        href: '/collections/kitchen-safety',
        image: '/assets/live/collections/kitchen-safety.webp',
      },
    ],
  },
  {
    title: 'Fashion & Accessories',
    href: '/collections/fashion-accessories',
    image: '/assets/live/collections/fashion-accessories.webp',
    links: [
      {
        label: 'Women’s Essentials',
        href: '/collections/women-s-essentials',
        image: '/assets/live/collections/women-s-essentials.webp',
      },
      {
        label: 'Man’s Essentials',
        href: '/collections/man-s-essentials',
        image: '/assets/live/collections/man-s-essentials.webp',
      },
      {
        label: 'Fashion',
        href: '/collections/fashion',
        image: '/assets/live/collections/fashion.webp',
      },
      {
        label: 'Jewelry',
        href: '/collections/jewelry',
        image: '/assets/live/collections/jewelry.webp',
      },
      {
        label: 'Travel Accessories',
        href: '/collections/travel-accessories',
        image: '/assets/live/collections/travel-accessories.webp',
      },
    ],
  },
  {
    title: 'Lifestyle & Outdoor',
    href: '/collections/lifestyle-outdoor',
    image: '/assets/live/collections/lifestyle-outdoor.webp',
    links: [
      {
        label: 'Lifestyle',
        href: '/collections/lifestyle',
        image: '/assets/live/collections/lifestyle.webp',
      },
      {
        label: 'Garden & Outdoor',
        href: '/collections/garden-outdoor',
        image: '/assets/live/collections/garden-outdoor.webp',
      },
      {
        label: 'Pet Accessories',
        href: '/collections/pet-accessories',
        image: '/assets/live/collections/pet-accessories.webp',
      },
    ],
  },
  {
    title: 'Tools & Hardware',
    href: '/collections/tools-hardware',
    image: '/assets/live/collections/tools-hardware.webp',
    links: [],
  },
];

/** Desktop nav row after "All Categories". */
export const HEADER_LINKS: HeaderNavLink[] = [
  {
    label: 'Baby care',
    href: '/collections/baby-care',
    columns: [
      {
        title: 'Baby wear',
        href: '/collections/baby-care',
        links: [{ label: 'Baby Pant', href: '/collections/baby-care' }],
      },
      {
        title: 'Baby essential',
        href: '/collections/baby-care',
        links: [{ label: 'Baby Tools', href: '/collections/baby-care' }],
      },
      { title: 'Baby lifestyle', href: '/collections/baby-care', links: [] },
    ],
  },
  {
    label: "Women's essentials",
    href: '/collections/women-s-essentials',
    columns: [
      { title: 'Beauty & Grooming Tools', href: '/collections/women-s-essentials', links: [] },
    ],
  },
  { label: 'Home & Kitchen', href: '/collections/home-kitchen', columns: [] },
  { label: 'Garden & Outdoor', href: '/collections/garden-outdoor', columns: [] },
];
