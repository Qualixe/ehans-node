import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { type AdminSection, type AdminUser, canManage, canView } from '@ehans/shared';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

const SECTION_KEY = 'admin:section';

export type AdminRequest = Request & { admin?: AdminUser; adminToken?: string };

/** Bearer token from `Authorization: Bearer <token>` (the /admin frontend sends it server-side). */
export function bearerToken(req: Request): string {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

/**
 * Requires a signed-in admin. With a section (glowy's `section:` middleware), reads need
 * view access and writes need manage access; the owner passes every check.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AdminRequest>();
    const token = bearerToken(req);
    const admin = token ? await this.auth.authenticate(token) : null;
    if (!admin) throw new UnauthorizedException('Please sign in to continue.');

    const section = this.reflector.getAllAndOverride<AdminSection | undefined>(SECTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (section) {
      const safe = req.method === 'GET' || req.method === 'HEAD';
      const allowed = safe ? canView(admin, section) : canManage(admin, section);
      if (!allowed) throw new ForbiddenException('You do not have access to this section.');
    }
    req.admin = admin;
    req.adminToken = token;
    return true;
  }
}

/** Protects a controller or route: any signed-in admin, or one with access to `section`. */
export function AdminOnly(section?: AdminSection) {
  return applyDecorators(
    ...(section ? [SetMetadata(SECTION_KEY, section)] : []),
    UseGuards(AdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Not signed in' }),
    ApiForbiddenResponse({ description: 'No access to this section' }),
  );
}

/** The signed-in admin (set by AdminGuard). */
export const CurrentAdmin = createParamDecorator((_: unknown, ctx: ExecutionContext): AdminUser => {
  const admin = ctx.switchToHttp().getRequest<AdminRequest>().admin;
  if (!admin) throw new UnauthorizedException('Please sign in to continue.');
  return admin;
});
