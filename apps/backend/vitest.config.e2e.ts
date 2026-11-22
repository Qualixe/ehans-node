import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // ConfigModule validates the environment when AppModule is imported,
    // so the test environment must exist before any test file loads.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CORS_ORIGINS: 'http://localhost:3000',
      SWAGGER_ENABLED: 'true',
      APP_VERSION: 'e2e',
      LOG_LEVEL: 'error',
    },
  },
});
