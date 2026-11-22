import path from 'node:path';
import type { NextConfig } from 'next';

// Monorepo root: lets Turbopack resolve workspace packages (@ehans/shared) and lets
// standalone output tracing include files outside apps/frontend.
const workspaceRoot = path.join(import.meta.dirname, '../..');

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (enabled by the Dockerfile).
  // Off by default because standalone output needs symlink rights on Windows.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: workspaceRoot,

  reactStrictMode: true,
  poweredByHeader: false,

  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    root: workspaceRoot,
    rules: {
      '*.tailwind.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
