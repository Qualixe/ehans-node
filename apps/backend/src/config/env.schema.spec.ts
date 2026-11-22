import { validateEnv } from './env.schema.js';

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
};

describe('validateEnv', () => {
  it('applies development defaults', () => {
    const env = validateEnv(base);
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGINS: [],
      TRUST_PROXY: 0,
      SWAGGER_ENABLED: true,
      LOG_FORMAT: 'pretty',
    });
  });

  it('uses secure defaults in production', () => {
    const env = validateEnv({
      ...base,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://example.com, https://www.example.com',
    });
    expect(env.SWAGGER_ENABLED).toBe(false);
    expect(env.LOG_FORMAT).toBe('json');
    expect(env.CORS_ORIGINS).toEqual(['https://example.com', 'https://www.example.com']);
  });

  it('requires CORS origins in production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).toThrow(/CORS_ORIGINS/);
  });

  it('rejects a missing or non-postgres DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
    expect(() => validateEnv({ DATABASE_URL: 'mysql://x' })).toThrow(/postgresql/);
  });

  it('treats empty optional variables (VAR= in compose) as unset', () => {
    const env = validateEnv({ ...base, COOKIE_DOMAIN: '', SWAGGER_ENABLED: '', LOG_FORMAT: '' });
    expect(env.COOKIE_DOMAIN).toBeUndefined();
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.LOG_FORMAT).toBe('pretty');
  });

  it('rejects malformed origins', () => {
    expect(() => validateEnv({ ...base, CORS_ORIGINS: 'not-a-url' })).toThrow(/CORS_ORIGINS/);
  });
});
