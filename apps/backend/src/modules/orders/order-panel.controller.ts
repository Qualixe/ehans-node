import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AdminUser,
  BlockedContactDto,
  CustomerHint,
  PanelOrderDetail,
  PanelOrdersPage,
} from '@ehans/shared';
import { AdminOnly, CurrentAdmin } from '../auth/admin.guard.js';
import { CourierService } from '../couriers/courier.service.js';
import {
  BlockContactDto,
  PanelBlockDto,
  PanelBulkCourierDto,
  PanelBulkDto,
  PanelCancelDuplicateDto,
  PanelCourierDto,
  PanelHintQueryDto,
  PanelListQueryDto,
  PanelNoteDto,
  PanelOrderDto,
  PanelOrderNumberDto,
  PanelStatusDto,
  PathaoCityQueryDto,
  PathaoIdParamDto,
} from './dto/order-panel.dto.js';
import { OrderCourierService } from './order-courier.service.js';
import { OrderPanelService } from './order-panel.service.js';

/** The order panel (section "orders"): list, edit, notes, duplicates, block list, manual orders. */
@ApiTags('admin: order panel')
@AdminOnly('orders')
@Controller('admin/order-panel')
export class OrderPanelController {
  constructor(
    private readonly panel: OrderPanelService,
    private readonly couriers: CourierService,
    private readonly booking: OrderCourierService,
  ) {}

  @Get('orders')
  @ApiOperation({ summary: 'Orders with tab counts, KPIs, duplicates and block flags' })
  @ApiOkResponse({ description: 'PanelOrdersPage' })
  list(@Query() { page, perPage, ...filters }: PanelListQueryDto): Promise<PanelOrdersPage> {
    return this.panel.list(filters, page ?? 1, perPage ?? 50, this.couriers.available());
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a manual order (phone, WhatsApp, POS, recovered checkout)' })
  @ApiConflictResponse({ description: 'Blocked number or not enough stock' })
  create(
    @Body() body: PanelOrderDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<{ number: string }> {
    return this.panel.create(body, admin);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk: status (confirm, …), assign to staff, delete' })
  async bulk(@Body() body: PanelBulkDto, @CurrentAdmin() admin: AdminUser) {
    if (body.action === 'assign') {
      return {
        updated: await this.panel.assign(body.numbers, body.staffId ?? null, admin),
        skipped: [],
      };
    }
    if (body.action === 'delete') {
      return { updated: await this.panel.remove(body.numbers, admin), skipped: [] };
    }
    return this.panel.bulkStatus(body.numbers, body.status ?? 'confirmed', admin);
  }

  @Get('hint')
  @ApiOperation({ summary: 'Blocked? Returning customer? Open orders? (under the phone field)' })
  hint(@Query() q: PanelHintQueryDto): Promise<CustomerHint> {
    return this.panel.customerHint(q.phone, q.exclude);
  }

  @Get('manual-summary')
  @ApiOperation({ summary: 'Manual orders today / yesterday / 7 / 15 / 30 days' })
  manualSummary() {
    return this.panel.manualSummary();
  }

  @Post('courier/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send several orders to Steadfast (each booked separately)' })
  bulkCourier(@Body() body: PanelBulkCourierDto, @CurrentAdmin() admin: AdminUser) {
    return this.booking.bookMany(body.numbers, body.courier, admin);
  }

  @Get('couriers')
  @ApiOperation({ summary: 'Couriers and whether their keys are set up' })
  courierList() {
    return this.couriers.available();
  }

  @Get('pathao/cities')
  pathaoCities() {
    return this.couriers.pathaoCities();
  }

  @Get('pathao/city-for')
  async pathaoCityFor(@Query() q: PathaoCityQueryDto) {
    return { cityId: await this.couriers.pathaoCityFor(q.district) };
  }

  @Get('pathao/cities/:id/zones')
  pathaoZones(@Param() { id }: PathaoIdParamDto) {
    return this.couriers.pathaoZones(id);
  }

  @Get('pathao/zones/:id/areas')
  pathaoAreas(@Param() { id }: PathaoIdParamDto) {
    return this.couriers.pathaoAreas(id);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Staff the orders can be assigned to' })
  staff() {
    return this.panel.staff();
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Blocked phone numbers and IPs' })
  blockedList(): Promise<BlockedContactDto[]> {
    return this.panel.blockedList();
  }

  @Post('blocked')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async addBlock(@Body() body: BlockContactDto, @CurrentAdmin() admin: AdminUser): Promise<void> {
    await this.panel.addBlock(body.kind, body.value, body.reason ?? null, admin);
  }

  @Delete('blocked/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async unblock(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.panel.unblock(id);
  }

  @Get('orders/:number')
  @ApiOperation({ summary: 'One order: activity, notes, previous orders, IP names' })
  @ApiOkResponse({ description: 'PanelOrderDetail' })
  detail(@Param() { number }: PanelOrderNumberDto): Promise<PanelOrderDetail> {
    return this.panel.detail(number);
  }

  @Put('orders/:number')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Not enough stock' })
  async update(
    @Param() { number }: PanelOrderNumberDto,
    @Body() body: PanelOrderDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.panel.update(number, body, admin);
  }

  @Patch('orders/:number/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Reopening needs stock that is gone' })
  async status(
    @Param() { number }: PanelOrderNumberDto,
    @Body() body: PanelStatusDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.panel.setStatus(number, body.status, admin);
  }

  @Post('orders/:number/courier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Book the parcel with Steadfast or Pathao; the order becomes Shipped' })
  courier(
    @Param() { number }: PanelOrderNumberDto,
    @Body() body: PanelCourierDto,
    @CurrentAdmin() admin: AdminUser,
  ) {
    return this.booking.book(number, body, admin);
  }

  @Post('orders/:number/courier/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pull the courier's status (delivered / returned move the order)" })
  courierSync(@Param() { number }: PanelOrderNumberDto, @CurrentAdmin() admin: AdminUser) {
    return this.booking.sync(number, admin);
  }

  @Post('orders/:number/notes')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async note(
    @Param() { number }: PanelOrderNumberDto,
    @Body() body: PanelNoteDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.panel.addNote(number, body.body, admin);
  }

  @Post('orders/:number/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Block the order's phone and/or IP (optionally cancel it)" })
  async block(
    @Param() { number }: PanelOrderNumberDto,
    @Body() body: PanelBlockDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<{ added: number }> {
    return { added: await this.panel.block(number, body, admin) };
  }

  @Post('orders/:number/keep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Duplicates: keep this order, cancel the other open duplicates' })
  async keep(@Param() { number }: PanelOrderNumberDto, @CurrentAdmin() admin: AdminUser) {
    return { cancelled: await this.panel.keepDuplicate(number, admin) };
  }

  @Post('orders/:number/cancel-duplicate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async cancelDuplicate(
    @Param() { number }: PanelOrderNumberDto,
    @Body() body: PanelCancelDuplicateDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<void> {
    await this.panel.cancelAsDuplicate(number, body.kept, admin);
  }
}
