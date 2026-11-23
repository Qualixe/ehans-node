import { getApiBaseUrl } from '@/lib/env';

/**
 * Admin image uploads (/uploads/<folder>/<file>), stored by the API and served from it.
 * Proxied here so the storefront and admin use one same-origin path in every setup
 * (dev, the laptop's nginx, a VPS behind host Nginx).
 */
export async function GET(_request: Request, ctx: RouteContext<'/uploads/[...path]'>) {
  const { path } = await ctx.params;
  if (!path.length || path.some((part) => !/^[\w.-]+$/.test(part) || part.startsWith('.'))) {
    return new Response('Not found', { status: 404 });
  }
  const upstream = await fetch(`${getApiBaseUrl().replace(/\/$/, '')}/uploads/${path.join('/')}`, {
    cache: 'no-store',
  });
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
