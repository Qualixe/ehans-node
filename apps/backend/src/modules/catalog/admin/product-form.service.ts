import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AdminProductDetail, AdminProductSuggestions } from '@ehans/shared';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  type StoredImage,
  type UploadedImage,
  UploadsService,
} from '../../uploads/uploads.service.js';
import { slugify } from './categories-admin.service.js';
import { ProductInputDto } from './dto/product-input.dto.js';
import { sanitizeHtml } from './html-sanitizer.js';

const DEFAULT_TITLE = 'Default Title';
const MAX_IMAGES = 20;

const blankToNull = (value: string | null | undefined) => {
  const v = value?.trim();
  return v ? v : null;
};

function flatten(errors: ValidationError[]): string[] {
  return errors.flatMap((e) => [
    ...Object.values(e.constraints ?? {}),
    ...flatten(e.children ?? []),
  ]);
}

/** Add/edit product (glowy ProductController store/update + ProductVariants::sync). */
@Injectable()
export class ProductFormService {
  private readonly logger = new Logger(ProductFormService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /** Parses and validates the JSON form payload like the global ValidationPipe would. */
  async parse(json: string): Promise<ProductInputDto> {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new BadRequestException(['The form data is not valid JSON.']);
    }
    const input = plainToInstance(ProductInputDto, raw);
    const errors = await validate(input, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException([...new Set(flatten(errors))]);
    return input;
  }

  async detail(id: string): Promise<AdminProductDetail> {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' }, select: { id: true, path: true } },
        options: { orderBy: { position: 'asc' } },
        variants: { orderBy: { position: 'asc' } },
        collections: { select: { categoryId: true } },
        bundles: { orderBy: { quantity: 'asc' } },
        relations: {
          orderBy: { position: 'asc' },
          select: {
            type: true,
            relatedProduct: {
              select: {
                id: true,
                name: true,
                price: true,
                isActive: true,
                images: { orderBy: { position: 'asc' }, take: 1, select: { path: true } },
              },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Product not found');
    const crossSells = (type: 'BUY_WITH' | 'UPSELL') =>
      p.relations
        .filter((r) => r.type === type)
        .map(({ relatedProduct: r }) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          isActive: r.isActive,
          image: r.images[0]?.path ?? null,
        }));
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      categoryId: p.categoryId,
      collectionIds: p.collections.map((c) => c.categoryId).filter((c) => c !== p.categoryId),
      brand: p.brand,
      productType: p.productType,
      tags: p.tags,
      shortDescription: p.shortDescription,
      description: p.description,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      bundlesEnabled: p.bundlesEnabled,
      variantPickerEnabled: p.variantPickerEnabled,
      bundleTiers: p.bundles.map((b) => ({
        quantity: b.quantity,
        discountPercent: b.discountPercent,
        freeDelivery: b.freeDelivery,
      })),
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      buyWith: crossSells('BUY_WITH'),
      upsells: crossSells('UPSELL'),
      buyWithTitle: p.buyWithTitle,
      upsellTitle: p.upsellTitle,
      soldCount: p.soldCount,
      stock: p.stock,
      images: p.images,
      options: p.options.map((o) => ({ name: o.name, values: o.values })),
      variants: p.variants.length
        ? p.variants.map((v) => ({
            id: v.id,
            options: [v.option1, v.option2, v.option3].filter((x): x is string => x !== null),
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            costPerItem: v.costPerItem,
            sku: v.sku,
            barcode: v.barcode,
            stock: v.stock,
            weightGrams: v.weightGrams,
            imageId: v.imageId,
          }))
        : // imported products without variant rows: show the product's own price/stock
          [
            {
              id: '',
              options: [],
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              costPerItem: null,
              sku: null,
              barcode: null,
              stock: p.stock,
              weightGrams: null,
              imageId: null,
            },
          ],
    };
  }

  async suggestions(): Promise<AdminProductSuggestions> {
    const [brands, types, tagRows, count] = await Promise.all([
      this.prisma.product.findMany({
        where: { brand: { not: null } },
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
        select: { brand: true },
      }),
      this.prisma.product.findMany({
        where: { productType: { not: null } },
        distinct: ['productType'],
        orderBy: { productType: 'asc' },
        select: { productType: true },
      }),
      this.prisma.product.findMany({ select: { tags: true } }),
      this.prisma.product.count(),
    ]);
    return {
      brands: brands.map((b) => b.brand!),
      types: types.map((t) => t.productType!),
      tags: [...new Set(tagRows.flatMap((r) => r.tags))].sort().slice(0, 500),
      nextSku: `EHM-${String(count + 1001).padStart(5, '0')}`,
    };
  }

  async create(input: ProductInputDto, files: UploadedImage[]): Promise<{ id: string }> {
    return this.save(null, input, files);
  }

  async update(
    id: string,
    input: ProductInputDto,
    files: UploadedImage[],
  ): Promise<{ id: string }> {
    return this.save(id, input, files);
  }

  private async save(
    id: string | null,
    input: ProductInputDto,
    files: UploadedImage[],
  ): Promise<{ id: string }> {
    const current = id
      ? await this.prisma.product.findUnique({
          where: { id },
          select: { id: true, sku: true, images: { select: { id: true, path: true } } },
        })
      : null;
    if (id && !current) throw new NotFoundException('Product not found');

    const { options, variants } = this.validatedVariants(input);
    const slug = slugify(input.slug || input.name);
    if (!slug) throw new BadRequestException(['The URL handle is required.']);
    const sku = blankToNull(input.sku) ?? current?.sku ?? (await this.suggestions()).nextSku;
    await this.assertUnique(id, slug, sku, input.categoryId, input.collectionIds);

    await this.assertCrossSells(id, input.buyWithIds, input.upsellIds);

    const remove = new Set(input.removeImages);
    const keptImages = (current?.images ?? []).filter((i) => !remove.has(i.id));
    if (keptImages.length + files.length > MAX_IMAGES) {
      throw new BadRequestException([`A product can have at most ${MAX_IMAGES} images.`]);
    }

    // store new files first; if anything below fails they are removed again
    const stored: StoredImage[] = [];
    try {
      for (const file of files) {
        stored.push(await this.uploads.storeImage(file, 'products', MAX_PRODUCT_IMAGE_BYTES));
      }
    } catch (error) {
      await Promise.all(stored.map((s) => this.uploads.delete(s.path)));
      throw error;
    }

    const cheapest = [...variants].sort((a, b) => a.price - b.price)[0]!;
    const data = {
      name: input.name.trim(),
      slug,
      sku,
      categoryId: input.categoryId,
      brand: blankToNull(input.brand),
      productType: blankToNull(input.productType),
      tags: [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))],
      shortDescription: blankToNull(input.shortDescription),
      description: sanitizeHtml(input.description),
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      bundlesEnabled: input.bundlesEnabled,
      variantPickerEnabled: input.variantPickerEnabled,
      metaTitle: blankToNull(input.metaTitle),
      metaDescription: blankToNull(input.metaDescription),
      buyWithTitle: blankToNull(input.buyWithTitle),
      upsellTitle: blankToNull(input.upsellTitle),
      price: cheapest.price,
      compareAtPrice:
        cheapest.compareAtPrice && cheapest.compareAtPrice > cheapest.price
          ? cheapest.compareAtPrice
          : null,
      stock: variants.reduce((n, v) => n + v.stock, 0),
    };

    let productId: string;
    try {
      productId = await this.prisma.$transaction(async (tx) => {
        const product = current
          ? await tx.product.update({ where: { id: current.id }, data, select: { id: true } })
          : await tx.product.create({ data, select: { id: true } });
        await this.syncImages(tx, product.id, input.imageOrder, remove, stored, data.name);
        await this.syncVariants(tx, product.id, options, variants);
        await this.syncCollections(tx, product.id, input.categoryId, input.collectionIds);
        await this.syncCrossSells(tx, product.id, input.buyWithIds, input.upsellIds);
        return product.id;
      });
    } catch (error) {
      await Promise.all(stored.map((s) => this.uploads.delete(s.path)));
      throw error;
    }

    // files of removed images are deleted only after the database change is committed
    const removedPaths = (current?.images ?? []).filter((i) => remove.has(i.id)).map((i) => i.path);
    await Promise.all(removedPaths.map((p) => this.uploads.delete(p)));
    this.logger.log(current ? 'product updated' : 'product created', { productId });
    return { id: productId };
  }

  /** glowy option/variant rules: distinct names and values, one variant per valid combination. */
  private validatedVariants(input: ProductInputDto) {
    const options = input.options.map((o) => ({
      name: o.name.trim(),
      values: o.values.map((v) => v.trim()),
    }));
    const errors: string[] = [];
    const lower = (s: string) => s.toLocaleLowerCase();
    if (new Set(options.map((o) => lower(o.name))).size !== options.length) {
      errors.push('Option names must be different.');
    }
    for (const o of options) {
      if (!o.name) errors.push('Each option needs a name.');
      if (o.values.some((v) => !v)) errors.push(`Values of “${o.name}” cannot be empty.`);
      if (new Set(o.values.map(lower)).size !== o.values.length) {
        errors.push(`Values of “${o.name}” must be different.`);
      }
    }
    let variants = input.variants;
    if (!options.length) {
      variants = variants.slice(0, 1).map((v) => Object.assign(v, { options: [] }));
    } else {
      const seen = new Set<string>();
      for (const v of variants) {
        const valid =
          v.options.length === options.length &&
          v.options.every((value, i) => options[i]!.values.includes(value));
        if (!valid) errors.push('A variant does not match the product options.');
        const key = v.options.join(' / ');
        if (seen.has(key)) errors.push(`The variant “${key}” is listed twice.`);
        seen.add(key);
      }
    }
    if (errors.length) throw new BadRequestException([...new Set(errors)]);
    return { options, variants };
  }

  private async assertUnique(
    id: string | null,
    slug: string,
    sku: string,
    categoryId: string,
    collectionIds: string[],
  ): Promise<void> {
    const errors: string[] = [];
    const [bySlug, bySku, categories] = await Promise.all([
      this.prisma.product.findUnique({ where: { slug }, select: { id: true } }),
      this.prisma.product.findUnique({ where: { sku }, select: { id: true } }),
      this.prisma.category.count({
        where: { id: { in: [...new Set([categoryId, ...collectionIds])] } },
      }),
    ]);
    if (bySlug && bySlug.id !== id) errors.push('The URL handle has already been taken.');
    if (bySku && bySku.id !== id) errors.push('The product code has already been taken.');
    if (categories !== new Set([categoryId, ...collectionIds]).size) {
      errors.push('Choose an existing category and collections.');
    }
    if (errors.length) throw new BadRequestException(errors);
  }

  /** Remove ticked images, apply the dragged order, then append new uploads (glowy syncMedia). */
  private async syncImages(
    tx: Prisma.TransactionClient,
    productId: string,
    order: string[],
    remove: Set<string>,
    stored: StoredImage[],
    alt: string,
  ): Promise<void> {
    if (remove.size) {
      await tx.productImage.deleteMany({ where: { productId, id: { in: [...remove] } } });
    }
    const existing = await tx.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    const ids = existing.map((i) => i.id);
    const ordered = [
      ...order.filter((i) => ids.includes(i)),
      ...ids.filter((i) => !order.includes(i)),
    ];
    for (const [position, imageId] of ordered.entries()) {
      await tx.productImage.update({ where: { id: imageId }, data: { position } });
    }
    let position = ordered.length;
    for (const s of stored) {
      await tx.productImage.create({
        data: {
          productId,
          path: s.path,
          width: s.width,
          height: s.height,
          alt,
          position: position++,
        },
      });
    }
  }

  /** ProductVariants::sync: rewrite options, then update/create/delete variants (ids are kept). */
  private async syncVariants(
    tx: Prisma.TransactionClient,
    productId: string,
    options: { name: string; values: string[] }[],
    variants: ProductInputDto['variants'],
  ): Promise<void> {
    await tx.productOption.deleteMany({ where: { productId } });
    if (options.length) {
      await tx.productOption.createMany({
        data: options.map((o, i) => ({
          productId,
          name: o.name,
          values: o.values,
          position: i + 1,
        })),
      });
    }
    const [existing, images] = await Promise.all([
      tx.productVariant.findMany({ where: { productId }, orderBy: { position: 'asc' } }),
      tx.productImage.findMany({ where: { productId }, select: { id: true } }),
    ]);
    const imageIds = new Set(images.map((i) => i.id));
    const kept: string[] = [];
    for (const [index, v] of variants.entries()) {
      const values = v.options;
      const match =
        existing.find((e) => e.id === v.id && !kept.includes(e.id)) ??
        existing.find(
          (e) =>
            !kept.includes(e.id) &&
            JSON.stringify([e.option1, e.option2, e.option3].filter((x) => x !== null)) ===
              JSON.stringify(values),
        ) ??
        (options.length === 0 ? existing.find((e) => !kept.includes(e.id)) : undefined);
      const attributes = {
        title: values.length ? values.join(' / ') : DEFAULT_TITLE,
        option1: values[0] ?? null,
        option2: values[1] ?? null,
        option3: values[2] ?? null,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
        costPerItem: v.costPerItem ?? null,
        sku: blankToNull(v.sku),
        barcode: blankToNull(v.barcode),
        stock: v.stock,
        weightGrams: v.weightGrams ?? null,
        imageId: v.imageId && imageIds.has(v.imageId) ? v.imageId : null,
        position: index + 1,
      };
      if (match) {
        await tx.productVariant.update({ where: { id: match.id }, data: attributes });
        kept.push(match.id);
      } else {
        kept.push((await tx.productVariant.create({ data: { productId, ...attributes } })).id);
      }
    }
    await tx.productVariant.deleteMany({ where: { productId, id: { notIn: kept } } });
  }

  /** Cross-sells must be other, existing products, each listed once per section. */
  private async assertCrossSells(
    id: string | null,
    buyWith: string[],
    upsells: string[],
  ): Promise<void> {
    const errors: string[] = [];
    for (const [label, ids] of [
      ['Buy it with', buyWith],
      ['Complete your …', upsells],
    ] as const) {
      if (new Set(ids).size !== ids.length) errors.push(`“${label}” lists a product twice.`);
      if (id && ids.includes(id)) errors.push(`A product cannot be its own “${label}” product.`);
    }
    const all = [...new Set([...buyWith, ...upsells])];
    if (
      all.length &&
      (await this.prisma.product.count({ where: { id: { in: all } } })) !== all.length
    ) {
      errors.push('A cross-sell product no longer exists.');
    }
    if (errors.length) throw new BadRequestException(errors);
  }

  /** Rewrites the product page "Buy it with" and "Complete your …" lists in the chosen order. */
  private async syncCrossSells(
    tx: Prisma.TransactionClient,
    productId: string,
    buyWith: string[],
    upsells: string[],
  ): Promise<void> {
    await tx.productRelation.deleteMany({ where: { productId } });
    const rows = [
      ...buyWith.map((relatedProductId, position) => ({
        productId,
        relatedProductId,
        type: 'BUY_WITH' as const,
        position,
      })),
      ...upsells.map((relatedProductId, position) => ({
        productId,
        relatedProductId,
        type: 'UPSELL' as const,
        position,
      })),
    ];
    if (rows.length) await tx.productRelation.createMany({ data: rows });
  }

  /** Category + extra collections; existing memberships keep their collection position. */
  private async syncCollections(
    tx: Prisma.TransactionClient,
    productId: string,
    categoryId: string,
    collectionIds: string[],
  ): Promise<void> {
    const wanted = [...new Set([categoryId, ...collectionIds])];
    await tx.productCategory.deleteMany({ where: { productId, categoryId: { notIn: wanted } } });
    const existing = await tx.productCategory.findMany({
      where: { productId },
      select: { categoryId: true },
    });
    for (const id of wanted.filter((c) => !existing.some((e) => e.categoryId === c))) {
      const last = await tx.productCategory.aggregate({
        where: { categoryId: id },
        _max: { position: true },
      });
      await tx.productCategory.create({
        data: { productId, categoryId: id, position: (last._max.position ?? -1) + 1 },
      });
    }
  }
}
