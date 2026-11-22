import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CategoryNode,
  HomeCatalog,
  ProductCard,
  ProductDetail,
  ProductListResponse,
} from '@ehans/shared';
import { CatalogService } from './catalog.service.js';
import { ListProductsQueryDto, SearchProductsQueryDto } from './dto/list-products.query.js';

/** Short shared caching: the storefront revalidates often, the CDN/browser may reuse briefly. */
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'Category tree for menus and collection pages' })
  @ApiOkResponse({ description: 'CategoryNode[]' })
  categories(): Promise<CategoryNode[]> {
    return this.catalog.categoryTree();
  }

  @Get('home')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'Home page catalog: category row, Trending Items grid, best sellers' })
  @ApiOkResponse({ description: 'HomeCatalog' })
  home(): Promise<HomeCatalog> {
    return this.catalog.home();
  }

  @Get('products')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'List products (filter, sort, paginate)' })
  @ApiOkResponse({ description: 'ProductListResponse' })
  @ApiNotFoundResponse({ description: 'Unknown category slug' })
  products(@Query() query: ListProductsQueryDto): Promise<ProductListResponse> {
    return this.catalog.listProducts(query);
  }

  @Get('search')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'Search suggestions for the header search bar' })
  @ApiOkResponse({ description: 'ProductCard[]' })
  search(@Query() query: SearchProductsQueryDto): Promise<ProductCard[]> {
    return this.catalog.search(query.q, query.limit);
  }

  @Get('products/:slug')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'Product detail page data' })
  @ApiOkResponse({ description: 'ProductDetail' })
  @ApiNotFoundResponse({ description: 'Product not found or inactive' })
  product(@Param('slug') slug: string): Promise<ProductDetail> {
    return this.catalog.productBySlug(slug);
  }
}
