/**
 * Creates (or resets) the store owner account for the admin at /admin.
 *
 *   ADMIN_EMAIL=owner@example.com ADMIN_NAME="Store owner" pnpm --filter @ehans/backend admin:create
 *
 * The password is read from ADMIN_PASSWORD, or asked for on the terminal when that is not set
 * (prefer the prompt: environment variables can end up in shell history).
 * Production: docker compose run --rm -it -e ADMIN_EMAIL=... backend node dist/database/create-admin.js
 */
import { createInterface } from 'node:readline/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { loadLocalEnvFile } from '../config/load-env-file.js';
import { MIN_ADMIN_PASSWORD_LENGTH, upsertOwner } from './admin-account.js';

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) throw new Error('Set ADMIN_PASSWORD or run in an interactive terminal');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(`Password (at least ${MIN_ADMIN_PASSWORD_LENGTH} characters): `);
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  loadLocalEnvFile();
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error('Set ADMIN_EMAIL to the owner email address');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const password = await readPassword();
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const result = await upsertOwner(prisma, {
      email,
      name: process.env.ADMIN_NAME ?? 'Store owner',
      password,
    });
    process.stdout.write(
      `${result.created ? 'Created' : 'Updated'} the store owner account (${email.toLowerCase()}).\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
