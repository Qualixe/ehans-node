/**
 * Runs once when the Next.js server starts, before it handles requests.
 * Validating here makes a misconfigured deployment fail at startup instead of
 * on the first request.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getServerEnv } = await import('./lib/env');
    getServerEnv();
  }
}
