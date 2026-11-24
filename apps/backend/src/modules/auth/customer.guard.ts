import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { CustomerProfile } from '@ehans/shared';
import type { Request } from 'express';
import { bearerToken } from './admin.guard.js';
import { CustomerAuthService } from './customer-auth.service.js';

export type CustomerRequest = Request & { customer?: CustomerProfile; customerToken?: string };

/** Signed-in storefront customer (Bearer session token from the storefront's httpOnly cookie). */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(private readonly accounts: CustomerAuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<CustomerRequest>();
    const token = bearerToken(req);
    const customer = await this.accounts.authenticate(token);
    if (!customer) throw new UnauthorizedException('Please sign in to continue.');
    req.customer = customer;
    req.customerToken = token;
    return true;
  }
}

export const CurrentCustomer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CustomerProfile => {
    const customer = ctx.switchToHttp().getRequest<CustomerRequest>().customer;
    if (!customer) throw new UnauthorizedException('Please sign in to continue.');
    return customer;
  },
);
