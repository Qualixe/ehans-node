import { existsSync } from 'node:fs';

/**
 * Loads `.env` from the working directory for local development only.
 * Production containers receive variables from Docker Compose; no file is read there.
 */
export function loadLocalEnvFile(path = '.env'): void {
  if (process.env.NODE_ENV === 'production') return;
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
