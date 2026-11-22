import { ConsoleLogger, type LogLevel } from '@nestjs/common';
import { LOG_LEVELS, type Env } from '../../config/env.schema.js';

/** Keys whose values must never appear in logs. */
export const REDACTED_LOG_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'cardNumber',
  'cvv',
];

/** Returns LOG_LEVEL and every more severe level (e.g. 'warn' -> fatal, error, warn). */
export function enabledLogLevels(level: Env['LOG_LEVEL']): LogLevel[] {
  return LOG_LEVELS.slice(0, LOG_LEVELS.indexOf(level) + 1);
}

/**
 * Structured logger built on Nest's ConsoleLogger (no extra dependency).
 * JSON (one object per line on stdout/stderr) in production for `docker logs` and
 * log shippers; human-readable output locally.
 */
export function createLogger(env: Pick<Env, 'LOG_LEVEL' | 'LOG_FORMAT'>): ConsoleLogger {
  return new ConsoleLogger({
    prefix: 'ehans-api',
    json: env.LOG_FORMAT === 'json',
    colors: env.LOG_FORMAT === 'pretty',
    logLevels: enabledLogLevels(env.LOG_LEVEL),
    redact: REDACTED_LOG_KEYS,
  });
}
