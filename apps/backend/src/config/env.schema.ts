import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'] as const;

const commaSeparatedList = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

/** Docker Compose passes `VAR=` as an empty string; treat that as "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

function isBareOrigin(value: string): boolean {
  try {
    return new URL(value).origin === value;
  } catch {
    return false; // malformed URLs are already reported by z.url()
  }
}

/**
 * Environment contract for the backend. Validated once at startup:
 * the process exits before listening if anything is missing or malformed.
 * Document every new variable in .env.example (root + apps/backend) and docs/deployment.md.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),

    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .refine((value) => /^postgres(ql)?:\/\//.test(value), {
        message: 'DATABASE_URL must be a postgresql:// connection string',
      }),

    CORS_ORIGINS: commaSeparatedList.pipe(
      z.array(
        z.url({ protocol: /^https?$/ }).refine(isBareOrigin, {
          message: 'each origin must look like https://example.com (no path or trailing slash)',
        }),
      ),
    ),
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    COOKIE_DOMAIN: optional(z.string().min(1)),

    APP_VERSION: z.string().min(1).default('0.0.0-dev'),
    SWAGGER_ENABLED: optional(z.stringbool()),
    LOG_LEVEL: z.enum(LOG_LEVELS).default('log'),
    LOG_FORMAT: optional(z.enum(['json', 'pretty'])),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.CORS_ORIGINS.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list at least one origin in production',
      });
    }
  })
  .transform((env) => {
    const isProduction = env.NODE_ENV === 'production';
    return {
      ...env,
      // Secure defaults: Swagger off and JSON logs in production unless explicitly overridden.
      SWAGGER_ENABLED: env.SWAGGER_ENABLED ?? !isProduction,
      LOG_FORMAT: env.LOG_FORMAT ?? (isProduction ? 'json' : 'pretty'),
    };
  });

export type Env = z.output<typeof envSchema>;
export type LogLevelName = (typeof LOG_LEVELS)[number];
export { LOG_LEVELS };

/** Validates raw environment variables and throws a readable error listing every problem. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}
