import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The storefront reproduces the ehans-mart template markup exactly (plain <img>
    // elements styled by the template CSS), so next/image is intentionally not used there.
    files: ['src/components/store/**', 'src/app/(store)/**', 'src/app/not-found.tsx'],
    rules: { '@next/next/no-img-element': 'off' },
  },
  {
    // The admin ports glowy's Blade markup: product/category images are small thumbnails
    // from the catalog's own paths, rendered as plain <img> like glowy does.
    files: ['src/components/admin/**', 'src/app/admin/**'],
    rules: { '@next/next/no-img-element': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
