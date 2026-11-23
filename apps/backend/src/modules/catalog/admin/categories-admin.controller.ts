import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AdminCategory, AdminCategoryTree } from '@ehans/shared';
import { AdminOnly } from '../../auth/admin.guard.js';
import { MAX_IMAGE_BYTES, type UploadedImage } from '../../uploads/uploads.service.js';
import { CategoriesAdminService } from './categories-admin.service.js';
import { CategoryInputDto, IdParamDto } from './dto/category.dto.js';

// a little over the limit so the service can answer with glowy's message
const imageUpload = FileInterceptor('image', {
  limits: { fileSize: MAX_IMAGE_BYTES + 1, files: 1 },
});

@ApiTags('admin: catalog')
@AdminOnly('products')
@Controller('admin/categories')
export class CategoriesAdminController {
  constructor(private readonly categories: CategoriesAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Departments with their sub-categories' })
  @ApiOkResponse({ description: 'AdminCategoryTree' })
  tree(): Promise<AdminCategoryTree> {
    return this.categories.tree();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'AdminCategory' })
  find(@Param() { id }: IdParamDto): Promise<AdminCategory> {
    return this.categories.find(id);
  }

  @Post()
  @UseInterceptors(imageUpload)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a category (optional `image` file)' })
  create(
    @Body() body: CategoryInputDto,
    @UploadedFile() image?: UploadedImage,
  ): Promise<AdminCategory> {
    return this.categories.create(body, image);
  }

  @Put(':id')
  @UseInterceptors(imageUpload)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a category (a new `image` replaces the old one)' })
  update(
    @Param() { id }: IdParamDto,
    @Body() body: CategoryInputDto,
    @UploadedFile() image?: UploadedImage,
  ): Promise<AdminCategory> {
    return this.categories.update(id, body, image);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiOperation({ summary: 'Delete an empty category' })
  async remove(@Param() { id }: IdParamDto): Promise<void> {
    await this.categories.remove(id);
  }
}
