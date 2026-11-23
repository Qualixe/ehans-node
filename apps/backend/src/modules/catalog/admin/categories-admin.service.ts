import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AdminCategory, AdminCategoryTree } from '@ehans/shared';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { type UploadedImage, UploadsService } from '../../uploads/uploads.service.js';
import type { CategoryInputDto } from './dto/category.dto.js';

/** Str::slug(): lowercase ASCII words joined by hyphens. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const select = {
  id: true,
  parentId: true,
  name: true,
  slug: true,
  image: true,
  description: true,
  position: true,
  showInMenu: true,
  homePosition: true,
  homeTitle: true,
  metaTitle: true,
  metaDescription: true,
  _count: { select: { memberships: true } },
} as const;

type Row = Omit<AdminCategory, 'productCount'> & { _count: { memberships: number } };
const toAdmin = ({ _count, ...c }: Row): AdminCategory => ({
  ...c,
  productCount: _count.memberships,
});

/** Admin Categories screens (glowy CategoryController). */
@Injectable()
export class CategoriesAdminService {
  private readonly logger = new Logger(CategoriesAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async tree(): Promise<AdminCategoryTree> {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        ...select,
        children: { orderBy: [{ position: 'asc' }, { name: 'asc' }], select },
      },
    });
    return roots.map(({ children, ...root }) => ({
      ...toAdmin(root),
      children: children.map(toAdmin),
    }));
  }

  async find(id: string): Promise<AdminCategory> {
    const row = await this.prisma.category.findUnique({ where: { id }, select });
    if (!row) throw new NotFoundException('Category not found');
    return toAdmin(row);
  }

  async create(input: CategoryInputDto, image?: UploadedImage): Promise<AdminCategory> {
    const data = await this.validated(input, null);
    const stored = image ? await this.uploads.storeImage(image, 'categories') : null;
    const row = await this.prisma.category.create({
      data: { ...data, image: stored?.path ?? null },
      select,
    });
    this.logger.log('category created', { categoryId: row.id });
    return toAdmin(row);
  }

  async update(id: string, input: CategoryInputDto, image?: UploadedImage): Promise<AdminCategory> {
    const current = await this.find(id);
    const data = await this.validated(input, current);
    const stored = image ? await this.uploads.storeImage(image, 'categories') : null;
    const row = await this.prisma.category.update({
      where: { id },
      data: { ...data, ...(stored ? { image: stored.path } : {}) },
      select,
    });
    if (stored) await this.uploads.delete(current.image);
    this.logger.log('category updated', { categoryId: id });
    return toAdmin(row);
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: {
        name: true,
        image: true,
        _count: { select: { products: true, memberships: true, children: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    const { products, memberships, children } = category._count;
    if (products + memberships + children > 0) {
      throw new ConflictException(
        `“${category.name}” still has products or sub-categories. Move them first.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    await this.uploads.delete(category.image);
    this.logger.log('category deleted', { categoryId: id });
  }

  /** glowy CategoryRequest rules beyond the DTO: unique slug, parent must be a top-level category. */
  private async validated(input: CategoryInputDto, current: AdminCategory | null) {
    const slug = slugify(input.slug ?? input.name);
    if (!slug) throw new BadRequestException(['The slug field is required.']);
    const clash = await this.prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== current?.id) {
      throw new BadRequestException(['The slug has already been taken.']);
    }

    const parentId = input.parentId ?? null;
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });
      const hasChildren = current
        ? await this.prisma.category.count({ where: { parentId: current.id } })
        : 0;
      if (!parent || parent.parentId !== null || parentId === current?.id || hasChildren > 0) {
        throw new BadRequestException(['Choose a top-level category as the parent.']);
      }
    }

    return {
      name: input.name,
      slug,
      parentId,
      homeTitle: input.homeTitle ?? null,
      description: input.description ?? null,
      position: input.position ?? 0,
      homePosition: input.homePosition ?? null,
      showInMenu: input.showInMenu ?? false,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
    };
  }
}
