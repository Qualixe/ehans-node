import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema.js';
import { detectImage } from './image-file.js';

/** Upload limit per image (glowy: max:2048 KB; product images allow 4096 KB). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;
/** Public URL prefix of uploaded files (the storefront proxies it to the API). */
export const UPLOADS_URL_PREFIX = '/uploads/';

/** The parts of a multipart file (multer, via @UploadedFile()) the uploader uses. */
export interface UploadedImage {
  buffer: Buffer;
  size: number;
}

export interface StoredImage {
  path: string;
  width: number | null;
  height: number | null;
}

/**
 * Admin image uploads (glowy's ImageUploader): keeps the original file under a random name in
 * UPLOADS_DIR/<folder>/ and only ever deletes files it stored itself.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  readonly root: string;

  constructor(config: ConfigService<Env, true>) {
    this.root = path.resolve(config.get('UPLOADS_DIR', { infer: true }));
  }

  async storeImage(
    file: UploadedImage,
    folder: 'categories' | 'products',
    maxBytes = MAX_IMAGE_BYTES,
  ): Promise<StoredImage> {
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `The image may not be greater than ${Math.round(maxBytes / 1024)} kilobytes.`,
      );
    }
    const image = detectImage(file.buffer);
    if (!image)
      throw new BadRequestException('The image must be a file of type: jpg, jpeg, png, webp.');

    const name = `${randomUUID()}.${image.ext}`;
    const dir = path.join(this.root, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), file.buffer, { flag: 'wx' });
    this.logger.log('image uploaded', { folder, bytes: file.size });
    return {
      path: `${UPLOADS_URL_PREFIX}${folder}/${name}`,
      width: image.width,
      height: image.height,
    };
  }

  /** Deletes an uploaded file; template/live assets (not under /uploads/) are never touched. */
  async delete(publicPath: string | null | undefined): Promise<void> {
    if (!publicPath?.startsWith(UPLOADS_URL_PREFIX)) return;
    const file = path.resolve(this.root, publicPath.slice(UPLOADS_URL_PREFIX.length));
    if (!file.startsWith(this.root + path.sep)) return; // never outside the uploads folder
    await unlink(file).catch(() => undefined);
  }
}
