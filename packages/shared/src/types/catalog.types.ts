/**
 * Public catalog API contract (GET /api/v1/catalog/*).
 * Money values are integer taka.
 */

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  image: string | null;
}

export interface CategoryNode extends CategorySummary {
  description: string | null;
  productCount: number;
  children: CategorySummary[];
}

export interface ProductImageDto {
  url: string;
  alt: string;
}

/** Everything a product card (grid, slider, search result, cart line) needs. */
export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  /** Rounded percentage off compareAtPrice, or null when not discounted. */
  discountPercent: number | null;
  image: ProductImageDto | null;
  hoverImage: ProductImageDto | null;
  ratingAverage: number | null;
  ratingCount: number;
  inStock: boolean;
  category: CategorySummary;
  /** True when the product has selectable options (quick view must pick a variant). */
  hasVariants: boolean;
}

/** A variant of a cross-sell product (picked in its row on the product page). */
export interface CrossSellVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  image: ProductImageDto | null;
}

/** "Buy it with" / "Complete your …" product: a card plus its variants (empty without options). */
export interface CrossSellCard extends ProductCard {
  variants: CrossSellVariant[];
}

export interface ProductOptionDto {
  name: string;
  values: string[];
  swatches: Record<string, string> | null;
}

export interface ProductVariantDto {
  id: string;
  title: string;
  options: string[];
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
}

export interface ProductBundleDto {
  quantity: number;
  title: string;
  discountPercent: number;
  badge: string | null;
  freeDelivery: boolean;
  isDefault: boolean;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductDetail extends ProductCard {
  sku: string;
  brand: string | null;
  tags: string[];
  shortDescription: string | null;
  /** Trusted HTML authored in the admin. */
  descriptionHtml: string | null;
  specifications: ProductSpecification[];
  images: ProductImageDto[];
  stock: number;
  soldCount: number;
  options: ProductOptionDto[];
  variants: ProductVariantDto[];
  bundles: ProductBundleDto[];
  buyWith: CrossSellCard[];
  upsells: CrossSellCard[];
  /** Admin-set headings for the two sections (null = template default). */
  buyWithTitle: string | null;
  upsellTitle: string | null;
  related: ProductCard[];
  breadcrumbs: CategorySummary[];
}

/** The home page "Trending Items" grid: the first page of a collection in manual order. */
export interface HomeProductGrid {
  title: string;
  category: CategorySummary;
  items: ProductCard[];
  total: number;
  pageSize: number;
}

export interface HomeCatalog {
  /** Home category row, in home order. */
  categories: CategorySummary[];
  /** Null when the grid collection does not exist. */
  trending: HomeProductGrid | null;
  /** Best sellers (404 page, product page "popular"). */
  popular: ProductCard[];
}

/** `manual` = the collection's own order (requires `category`). */
export type ProductSort =
  'manual' | 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling';

export interface ProductListResponse {
  items: ProductCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  priceRange: { min: number; max: number };
}
