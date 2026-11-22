import type { CookieOptions } from 'express';
import type { Env } from './env.schema.js';

/**
 * Baseline cookie settings for any cookie the API sets (sessions, refresh tokens, carts).
 * Production: Secure (HTTPS only, requires TRUST_PROXY behind Nginx), HttpOnly, SameSite=Lax.
 */
export function baseCookieOptions(env: Pick<Env, 'NODE_ENV' | 'COOKIE_DOMAIN'>): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}
