import { Injectable } from '@nestjs/common';
import type { PosCatalog } from '@ehans/shared';
import { CatalogCheckoutService } from '../catalog/catalog-checkout.service.js';

/** POS / Manual orders page: the product grid (orders are created by OrderPanelService). */
@Injectable()
export class PosAdminService {
  constructor(private readonly catalog: CatalogCheckoutService) {}

  catalogue(): Promise<PosCatalog> {
    return this.catalog.posCatalog();
  }
}
