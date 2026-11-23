import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminPage,
  AdminProductDetail,
  AdminProductRow,
  AdminProductSuggestions,
} from '@ehans/shared';
import { AdminOnly } from '../../auth/admin.guard.js';
import { MAX_PRODUCT_IMAGE_BYTES, type UploadedImage } from '../../uploads/uploads.service.js';
import { IdParamDto } from './dto/category.dto.js';
import { ProductFormBodyDto } from './dto/product-input.dto.js';
import { ListAdminProductsQueryDto } from './dto/product-list.dto.js';
import { ProductFormService } from './product-form.service.js';
import { ProductsAdminService } from './products-admin.service.js';

// a little over the limit so the uploader can answer with glowy's message
const imageUploads = FilesInterceptor('images', 20, {
  limits: { fileSize: MAX_PRODUCT_IMAGE_BYTES + 1, files: 20 },
});

@ApiTags('admin: catalog')
@AdminOnly('products')
@Controller('admin/products')
export class ProductsAdminController {
  constructor(
    private readonly products: ProductsAdminService,
    private readonly form: ProductFormService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Products, newest first, 20 per page (search, category, status)' })
  @ApiOkResponse({ description: 'AdminPage<AdminProductRow>' })
  list(@Query() query: ListAdminProductsQueryDto): Promise<AdminPage<AdminProductRow>> {
    return this.products.list({
      q: query.q,
      category: query.category,
      status: query.status,
      page: query.page ?? 1,
    });
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Existing vendors, types and tags, and the next product code' })
  @ApiOkResponse({ description: 'AdminProductSuggestions' })
  suggestions(): Promise<AdminProductSuggestions> {
    return this.form.suggestions();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'AdminProductDetail' })
  detail(@Param() { id }: IdParamDto): Promise<AdminProductDetail> {
    return this.form.detail(id);
  }

  @Post()
  @UseInterceptors(imageUploads)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a product: `data` (AdminProductInput JSON) + `images` files' })
  async create(
    @Body() body: ProductFormBodyDto,
    @UploadedFiles() images: UploadedImage[] = [],
  ): Promise<{ id: string }> {
    return this.form.create(await this.form.parse(body.data), images);
  }

  @Put(':id')
  @UseInterceptors(imageUploads)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product: `data` (AdminProductInput JSON) + new `images`' })
  async update(
    @Param() { id }: IdParamDto,
    @Body() body: ProductFormBodyDto,
    @UploadedFiles() images: UploadedImage[] = [],
  ): Promise<{ id: string }> {
    return this.form.update(id, await this.form.parse(body.data), images);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product and its uploaded images' })
  @ApiOkResponse({ description: '{ name }' })
  remove(@Param() { id }: IdParamDto): Promise<{ name: string }> {
    return this.products.remove(id);
  }
}
