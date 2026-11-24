import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  type AdminCustomerAccount,
  type CustomerLoginRequest,
  type CustomerPasswordUpdate,
  type CustomerProfile,
  type CustomerProfileUpdate,
  type CustomerRegisterRequest,
  type CustomerSession,
  districtByKey,
} from '@ehans/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { hashToken } from './auth.service.js';
import { LoginThrottle } from './login-throttle.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password.js';

/** glowy: customers stay signed in (remember) for 30 days, otherwise for the browser session. */
const REMEMBER_DAYS = 30;
const SESSION_HOURS = 24;
const TOUCH_INTERVAL_MS = 5 * 60_000;

const profileSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  district: true,
  createdAt: true,
} as const;

type ProfileRow = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

const toProfile = (u: ProfileRow): CustomerProfile => ({
  id: u.id,
  name: u.name,
  phone: u.phone ?? '',
  email: u.email,
  address: u.address,
  district: u.district,
  createdAt: u.createdAt.toISOString(),
});

/** "+88 017-1234 5678" → "01712345678" (glowy Phone::normalize). */
export const normalizePhone = (phone: string): string =>
  phone.replace(/[\s\-()]/g, '').replace(/^\+?88(?=01)/, '');

export interface SessionMeta {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Storefront customer accounts (glowy's "customer" guard): sign up and sign in with a mobile
 * number and password. Customers are users with isAdmin = false; they share the sessions
 * table with staff, but the admin sign-in and guard never accept them (and vice versa).
 */
@Injectable()
export class CustomerAuthService {
  private readonly logger = new Logger(CustomerAuthService.name);
  /** glowy: throttle:10,1 on login (per phone here, like LoginRequest's per-email limit) */
  private readonly loginThrottle = new LoginThrottle(5, 60_000);
  /** glowy: throttle:5,1 on register, per IP */
  private readonly registerThrottle = new LoginThrottle(5, 60_000);

  constructor(private readonly prisma: PrismaService) {}

  async register(input: CustomerRegisterRequest, meta: SessionMeta): Promise<CustomerSession> {
    const ipKey = meta.ipAddress ?? 'unknown';
    const wait = this.registerThrottle.retryAfter(ipKey);
    if (wait > 0) throw tooMany(wait);
    this.registerThrottle.hit(ipKey);

    const phone = normalizePhone(input.phone);
    const email = input.email?.trim().toLowerCase() || null;
    const taken = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
      select: { phone: true },
    });
    if (taken) {
      throw new ConflictException([
        taken.phone === phone
          ? 'This mobile number already has an account. Please sign in.'
          : 'This email is already used by another account.',
      ]);
    }
    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        phone,
        email,
        passwordHash: await hashPassword(input.password),
        isAdmin: false,
      },
      select: profileSelect,
    });
    this.logger.log('customer registered', { userId: user.id });
    return this.startSession(user, true, meta);
  }

  async login(input: CustomerLoginRequest, meta: SessionMeta): Promise<CustomerSession> {
    const phone = normalizePhone(input.phone);
    const wait = this.loginThrottle.retryAfter(phone);
    if (wait > 0) throw tooMany(wait);

    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: { ...profileSelect, isAdmin: true, passwordHash: true },
    });
    // always hash, so unknown numbers take as long as wrong passwords
    const valid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !valid || user.isAdmin) {
      this.loginThrottle.hit(phone);
      throw new UnauthorizedException(['The mobile number or password is incorrect.']);
    }
    this.loginThrottle.clear(phone);
    return this.startSession(user, input.remember ?? true, meta);
  }

  /** The customer behind a session token, or null (unknown, expired, or a staff session). */
  async authenticate(token: string | undefined): Promise<CustomerProfile | null> {
    if (!token || token.length > 200) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        expiresAt: true,
        lastUsedAt: true,
        user: { select: { ...profileSelect, isAdmin: true } },
      },
    });
    if (!session || session.user.isAdmin) return null;
    const now = Date.now();
    if (session.expiresAt.getTime() <= now) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    if (now - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.session
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date(now) } })
        .catch(() => undefined);
    }
    return toProfile(session.user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  /** glowy AccountProfileController@update */
  async updateProfile(userId: string, input: CustomerProfileUpdate): Promise<CustomerProfile> {
    const phone = normalizePhone(input.phone);
    const email = input.email?.trim().toLowerCase() || null;
    if (input.district && !districtByKey(input.district)) {
      throw new BadRequestException(['Please choose a district from the list.']);
    }
    const clash = await this.prisma.user.findFirst({
      where: { id: { not: userId }, OR: [{ phone }, ...(email ? [{ email }] : [])] },
      select: { phone: true },
    });
    if (clash) {
      throw new ConflictException([
        clash.phone === phone
          ? 'This mobile number is used by another account.'
          : 'This email is used by another account.',
      ]);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        phone,
        email,
        address: input.address?.trim() || null,
        district: input.district || null,
      },
      select: profileSelect,
    });
    return toProfile(user);
  }

  /** glowy AccountProfileController@password: needs the current password; signs out other devices. */
  async changePassword(
    userId: string,
    input: CustomerPasswordUpdate,
    keepToken: string | undefined,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new BadRequestException(['Your current password is incorrect.']);
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(input.password) },
      }),
      this.prisma.session.deleteMany({
        where: { userId, ...(keepToken ? { tokenHash: { not: hashToken(keepToken) } } : {}) },
      }),
    ]);
    this.logger.log('customer password changed', { userId });
  }

  // ---------------------------------------------------------------- staff (admin customer page)

  /** The storefront account registered with a phone number, if any. */
  async accountForPhone(phone: string): Promise<AdminCustomerAccount | null> {
    const user = await this.prisma.user.findFirst({
      where: { phone: normalizePhone(phone), isAdmin: false },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return user ? { ...user, createdAt: user.createdAt.toISOString() } : null;
  }

  /** glowy CustomerPasswordController: staff set a new password (forgot password, by phone). */
  async setPasswordByStaff(userId: string, password: string, staffId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isAdmin: false },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Customer account not found');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      // the old password may be known to someone else: sign out everywhere
      this.prisma.session.deleteMany({ where: { userId } }),
    ]);
    this.logger.log('customer password set by staff', { userId, staffId });
  }

  private async startSession(
    user: ProfileRow,
    remember: boolean,
    meta: SessionMeta,
  ): Promise<CustomerSession> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + (remember ? REMEMBER_DAYS * 24 * 3600_000 : SESSION_HOURS * 3600_000),
    );
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: now } } }),
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt,
          ipAddress: meta.ipAddress?.slice(0, 45) ?? null,
          userAgent: meta.userAgent?.slice(0, 500) ?? null,
        },
      }),
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } }),
    ]);
    return { token, expiresAt: expiresAt.toISOString(), customer: toProfile(user) };
  }
}

const tooMany = (wait: number) =>
  new HttpException(
    `Too many attempts. Please try again in ${wait} seconds.`,
    HttpStatus.TOO_MANY_REQUESTS,
  );
