import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AdminUser,
  FraudCheckerPage,
  FraudLookup,
  SecurityOverview,
  SecuritySettings,
  ShipmentsPage,
  TeamPage,
} from '@ehans/shared';
import { AdminOnly, CurrentAdmin } from '../auth/admin.guard.js';
import { FraudLookupQueryDto, SecuritySettingsDto, SettleDto } from './dto/ops.dto.js';
import { OpsService } from './ops.service.js';

/** Order panel pages: Courier & COD, Team activity, Fraud checker, Fraud & security. */
@ApiTags('admin: order panel')
@AdminOnly('orders')
@Controller('admin/ops')
export class OpsController {
  constructor(private readonly ops: OpsService) {}

  @Get('shipments')
  @ApiOperation({ summary: 'Courier & COD: in transit per courier, payouts to receive, shipments' })
  @ApiOkResponse({ description: 'ShipmentsPage' })
  shipments(): Promise<ShipmentsPage> {
    return this.ops.shipments();
  }

  @Post('shipments/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark a courier's delivered COD as received" })
  async settle(@Body() body: SettleDto, @CurrentAdmin() admin: AdminUser) {
    return { parcels: await this.ops.settle(body.courier, admin) };
  }

  @Get('team')
  @ApiOperation({
    summary: 'Team activity: per staff counts, activity log, actions per hour today',
  })
  @ApiOkResponse({ description: 'TeamPage' })
  team(): Promise<TeamPage> {
    return this.ops.team();
  }

  @Get('fraud')
  @ApiOperation({ summary: 'Fraud checker: recent lookups and orders waiting to confirm' })
  fraudChecker(): Promise<FraudCheckerPage> {
    return this.ops.fraudChecker();
  }

  @Post('fraud/lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Look up a number: courier history, our orders, block state' })
  fraudLookup(@Query() q: FraudLookupQueryDto): Promise<FraudLookup> {
    return this.ops.fraudLookup(q.phone, q.run ?? false, q.fresh ?? false);
  }

  @Get('security')
  @ApiOperation({ summary: 'Fraud & security: rules, block counts, sign-in history' })
  security(): Promise<SecurityOverview> {
    return this.ops.security();
  }

  @Put('security')
  @ApiOperation({ summary: 'Save the order protection rules' })
  saveSecurity(
    @Body() body: SecuritySettingsDto,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<SecuritySettings> {
    return this.ops.saveSecurity(body, admin);
  }

  @Post('security/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply the hold rule to open orders now' })
  async runRules() {
    return { held: await this.ops.runRules() };
  }
}
