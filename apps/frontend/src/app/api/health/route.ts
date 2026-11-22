import type { HealthCheckResponse } from '@ehans/shared';
import { connection } from 'next/server';

/**
 * Frontend liveness probe used by Docker health checks and uptime monitors.
 * `connection()` makes this run at request time instead of being prerendered.
 */
export async function GET(): Promise<Response> {
  await connection();
  const body: HealthCheckResponse = {
    status: 'ok',
    service: 'ehans-frontend',
    version: process.env.APP_VERSION ?? '0.0.0-dev',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
