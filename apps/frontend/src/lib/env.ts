import { z } from 'zod';

/**
 * Public (browser-visible) configuration. Next.js inlines NEXT_PUBLIC_* values at
 * BUILD time, and only when referenced literally as process.env.NEXT_PUBLIC_X,
 * so each variable is listed explicitly below.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

/** Server-only configuration, read at RUNTIME (Server Components, Route Handlers). */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_INTERNAL_URL: z.url().optional(),
});

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
}

export function getPublicEnv(): z.infer<typeof publicSchema> {
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!result.success) {
    throw new Error(`Invalid public environment configuration:\n${format(result.error)}`);
  }
  return result.data;
}

export function getServerEnv(): z.infer<typeof serverSchema> & z.infer<typeof publicSchema> {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must not be called in the browser');
  }
  const result = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  });
  if (!result.success) {
    throw new Error(`Invalid server environment configuration:\n${format(result.error)}`);
  }
  return { ...getPublicEnv(), ...result.data };
}

/** Base URL for API calls: internal network URL on the server, public URL in the browser. */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const env = getServerEnv();
    return env.API_INTERNAL_URL ?? env.NEXT_PUBLIC_API_URL;
  }
  return getPublicEnv().NEXT_PUBLIC_API_URL;
}
