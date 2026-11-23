import { createHash, randomBytes } from 'node:crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { AdminLoginResponse, AdminUser } from '@ehans/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginThrottle } from './login-throttle.js';
import { DUMMY_PASSWORD_HASH, verifyPassword } from './password.js';
import { toAdminUser, type UserAccessRow } from './permissions.js';

const SESSION_HOURS = 12;
const REMEMBER_DAYS = 30;
/** lastUsedAt is refreshed at most this often (avoids a write on every request). */
const TOUCH_INTERVAL_MS = 5 * 60_000;

const userAccessSelect = {
  id: true,
  name: true,
  email: true,
  isAdmin: true,
  role: true,
  permissions: true,
} as const;

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export interface LoginInput {
  email: string;
  password: string;
  remember?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly throttle = new LoginThrottle();

  constructor(private readonly prisma: PrismaService) {}

  async login(input: LoginInput): Promise<AdminLoginResponse> {
    const email = input.email.trim().toLowerCase();
    const wait = this.throttle.retryAfter(email);
    if (wait > 0) {
      throw new HttpException(
        `Too many login attempts. Please try again in ${wait} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...userAccessSelect, passwordHash: true },
    });
    // always run the hash so unknown emails take as long as wrong passwords
    const valid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !valid || !user.isAdmin || !user.role) {
      this.throttle.hit(email);
      this.logger.warn('admin login failed', { reason: user ? 'credentials' : 'unknown-email' });
      throw new UnauthorizedException('These credentials do not match our records.');
    }
    this.throttle.clear(email);

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + (input.remember ? REMEMBER_DAYS * 24 * 3600_000 : SESSION_HOURS * 3600_000),
    );
    const now = new Date();
    await this.prisma.$transaction([
      // housekeeping: drop this user's expired sessions
      this.prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: now } } }),
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt,
          ipAddress: input.ipAddress?.slice(0, 45) ?? null,
          userAgent: input.userAgent?.slice(0, 500) ?? null,
        },
      }),
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } }),
    ]);
    this.logger.log('admin signed in', { userId: user.id });
    return { token, expiresAt: expiresAt.toISOString(), user: toAdminUser(user) };
  }

  /** The admin behind a session token, or null when the token is unknown, expired or revoked. */
  async authenticate(token: string): Promise<AdminUser | null> {
    if (!token || token.length > 200) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, expiresAt: true, lastUsedAt: true, user: { select: userAccessSelect } },
    });
    if (!session) return null;
    const now = Date.now();
    if (session.expiresAt.getTime() <= now) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    const user: UserAccessRow = session.user;
    if (!user.isAdmin || !user.role) return null;
    if (now - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.session
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date(now) } })
        .catch(() => undefined);
    }
    return toAdminUser(user);
  }

  async logout(token: string): Promise<void> {
    if (!token) return;
    await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
}
