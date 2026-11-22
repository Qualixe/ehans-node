import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The Prisma CLI does not load .env files automatically. In local development we
// load apps/backend/.env with Node's built-in loader (no dotenv dependency).
// In containers, variables come from the environment and no file is present.
if (!process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // `prisma generate` does not need a connection; migrate/studio commands do.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
