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
  buyWith: ProductCard[];
  upsells: ProductCard[];
  related: ProductCard[];
  breadcrumbs: CategorySummary[];
}

export interface HomeSlider {
  title: string;
  category: CategorySummary;
  products: ProductCard[];
}

export interface HomeCatalog {
  categories: CategorySummary[];
  sliders: HomeSlider[];
  popular: ProductCard[];
}

export type ProductSort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling';

export interface ProductListResponse {
  items: ProductCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  priceRange: { min: number; max: number };
}
