/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = fileURLToPath(new URL('.', import.meta.url));

/**
 * SEO plumbing that needs the absolute site URL: canonical, og:url, og:image, JSON-LD,
 * robots.txt and sitemap.xml. The URL comes from VITE_SITE_URL, or from Vercel's
 * VERCEL_PROJECT_PRODUCTION_URL system variable. When neither is set the tags that
 * need it are dropped instead of shipping a wrong URL.
 */
function seoPlugin(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, '');
  return {
    name: 'portfolio-seo',
    transformIndexHtml(html) {
      if (base) return html.replaceAll('__SITE_URL__', base);
      return html
        .split('\n')
        .filter((line) => !line.includes('__SITE_URL__'))
        .join('\n');
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /', 'Disallow: /admin.html', 'Disallow: /admin'];
      if (base) robots.push(`Sitemap: ${base}/sitemap.xml`);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' });
      if (base) {
        const sitemap =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `  <url><loc>${base}/</loc></url>\n` +
          '</urlset>\n';
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      }
    },
  };
}

// Two entry points (public + admin): visitors never download admin code.
// `assetsDir: 'static'` keeps hashed bundles out of /assets, which is
// reserved for the legacy seed images that content rows still point at.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : '');

  return {
    plugins: [react(), tailwindcss(), seoPlugin(siteUrl)],
    resolve: { alias: { '@': resolve(root, 'src') } },
    build: {
      assetsDir: 'static',
      // The CSP in vercel.json is `font-src 'self'`, so an inlined `data:` font gets
      // blocked. Fonts are always emitted as files; other assets keep Vite's default.
      assetsInlineLimit: (filePath: string) => (/\.woff2?$/i.test(filePath) ? false : undefined),
      target: 'es2022',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          admin: resolve(root, 'admin.html'),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/shared/lib/**', 'src/features/chatbot/matcher.ts'],
        exclude: ['**/*.test.*', '**/*.d.ts', 'src/shared/lib/store/index.ts'],
        thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
      },
    },
  };
});
