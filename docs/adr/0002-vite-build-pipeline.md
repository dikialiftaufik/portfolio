# Vite + TypeScript + Tailwind v4 replace the in-browser toolchain

Status: accepted (supersedes the "no build step" assumption in ADR-0001's context)

The first version compiled JSX in every visitor's browser (Babel standalone, about 3 MB), generated Tailwind CSS at runtime from the Play CDN (which Tailwind documents as not for production), and pulled React, Lucide, Devicon and supabase-js from four third-party hosts without Subresource Integrity. That cost performance, made a Content-Security-Policy meaningless (`unsafe-eval` was required), and left the admin page, which holds a session token, exposed to a CDN compromise.

## Decision

- **Vite** multi-page build with two entry points (`index.html`, `admin.html`): the public bundle never contains admin code (checked by an e2e test).
- **React 19 + TypeScript (strict)**, feature folders under `src/features`, shared code under `src/shared`. One `Icon`/theme/store implementation instead of two copies.
- **Tailwind v4** via the Vite plugin; the old inline `tailwind.config` moved to `@theme` in `src/styles/main.css`.
- **Everything self-hosted**: `lucide-react` (only the icons used), `@fontsource-variable` fonts with `font-display: swap`, tech icons as per-icon SVGs copied from `devicon` by `scripts/sync-tech-icons.mjs` (no icon font), flags as inline SVG, no external image hosts.
- **Runtime config** comes from Vite env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); `window.__PORTFOLIO_CONFIG__` and `config.*.js` are gone. `.env.production` is committed on purpose because the anon key is public by design; a Vercel env var of the same name overrides it.
- Hashed assets live in `/static` (not `/assets`, which still serves the legacy seed images that database rows reference).

## Options considered

- **Astro (+ React islands):** better SEO and less JS, but needs a rebuild webhook whenever the admin edits content. Revisit if SEO or a blog becomes a priority.
- **Next.js:** SSR/ISR is overkill for one page.
- **Stay as-is:** rejected; every problem above remains.

## Consequences

- CSP can drop `unsafe-eval` (`vercel.json`). JS on first load is about 90 KB gzip; Lighthouse (local, simulated mobile) performance 94, accessibility 100, SEO 100.
- Deploys now run `npm run build` (Vercel detects Vite). Node 22 is pinned in `.nvmrc`.
- The page is still client-rendered. Crawlers and link previews get static meta tags, JSON-LD and an `og:image`; full prerendering is a future option, not a requirement today.
- supabase-js is a lazy chunk and the first data load waits for an idle moment, so it stays off the critical path. PostgREST auto-retry is disabled so offline visitors reach the seed fallback immediately.
- Row types in `src/shared/lib/store/types.ts` are hand-written. Generating `database.types.ts` with `supabase gen types` needs a linked project and is a follow-up.
