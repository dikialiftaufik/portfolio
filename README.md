# Portfolio — Diki Alif Taufik

Public portfolio (`/`) plus an admin console (`/admin.html`) on one Supabase backend.
React 19 · TypeScript (strict) · Vite · Tailwind v4 · Supabase (Postgres + RLS + Auth + Storage + Realtime) · Vercel.

## Quick start

```bash
nvm use            # Node 22 (.nvmrc)
npm install
npm run dev        # http://localhost:5173/   admin: /admin.html
```

Without backend config both views render from the frozen seed (`src/content/seed.ts`) with an
honest "Showing cached content…" banner. To connect a Supabase project, copy `.env.example`
to `.env.local` and fill in the URL and **anon** key (Project Settings → API).

## Scripts

| Script                                  | What it does                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `preview`     | Vite dev server / production build (`dist/`) / serve the build                   |
| `npm run lint` · `typecheck` · `format` | ESLint (flat config) · `tsc --noEmit` · Prettier                                 |
| `npm test` · `test:coverage`            | Vitest + Testing Library (≥ 80% on `src/shared/lib` and the matcher)             |
| `npm run test:e2e`                      | Playwright + axe against a hermetic build (needs `npm run e2e:install` once)     |
| `npm run images`                        | Rebuild optimized images in `public/assets` from `assets-src/`                   |
| `npm run icons`                         | Copy tech SVGs from `devicon` into `public/tech` (runs before `dev` and `build`) |

Git hooks (Husky) run lint-staged on commit and Commitlint (Conventional Commits) on the message.
CI (`.github/workflows/ci.yml`): lint, format, types, unit + coverage, build, e2e + axe,
Lighthouse budgets, pgTAP RLS tests, gitleaks. Dependabot is enabled.

## Structure

```text
index.html, admin.html     # two Vite entry points (admin code never ships to visitors)
src/
  app/                     # entries (public-main, admin-main), App, Footer
  features/
    navigation/ hero/ chatbot/ showcase/ contact/ admin/
  shared/
    ui/                    # Modal (focus trap), TechIcon, OptimizedImage, flags, brand icons
    lib/                   # config, locale, profile, store/ (typed Supabase + seed adapters)
  content/seed.ts          # frozen offline fallback
  styles/main.css          # Tailwind v4 theme (@theme) + responsive layer
public/                    # favicon, og-image, assets/ (optimized legacy images), tech/ (generated)
assets-src/                # master images; `npm run images` writes public/assets
supabase/
  migrations/              # 0001 init · 0002 admin hardening · 0003 image typo · 0004 content positions · 0005 site settings
  tests/rls.test.sql       # pgTAP contract for RLS and constraints
  seed.sql                 # stable-id seed
e2e/                       # Playwright specs (live, offline, a11y, admin)
docs/                      # ADRs, deploy guide, security runbook, E2E checklist
```

## Backend setup (once)

1. Create a Supabase project, then apply `supabase/migrations/*.sql` in order and `seed.sql`
   (**read `docs/SECURITY-RUNBOOK.md` first**: mark your admin user before migration 0002,
   and turn off public sign-ups).
2. Authentication → add one admin user (Auto Confirm on), enable TOTP MFA.
3. Put the URL and anon key in `.env.local` (dev) or Vercel env vars (production).

Local database with Docker: `npx supabase start && npx supabase db reset && npx supabase test db`.

## Data and fallback behaviour

- Admin edits write to Supabase and show up in the public view live (debounced realtime).
- The contact form calls the rate-limited `submit_message` RPC (ADR-0004). Backend not
  configured → honest `mailto:` fallback; offline → the message is kept and the error shown.
- Backend down or misconfigured → seed renders with banner and "Try again", never a blank page.

## Chatbot note

The assistant is a keyword matcher over a static knowledge base (`src/features/chatbot`). It is
labelled as such and does not learn new projects automatically. Facts it shares with the rest
of the site (email, skills) come from `src/shared/lib/profile.ts`.

## Security and limits

- The anon key is public by design; access control is row-level security. Writes require
  `app_metadata.role = 'admin'` (ADR-0003). `service_role` must never enter the repo or a `VITE_*` variable.
- `vercel.json` ships a strict CSP (no `unsafe-eval`), HSTS, `nosniff`, frame and referrer policies.
- Report vulnerabilities per `SECURITY.md`.
- Supabase free-tier limits apply (DB size, bandwidth, idle pause; a keep-alive workflow pings it).
  Exit path is a plain SQL dump: no lock-in beyond Postgres.

## More

`docs/adr/` (decisions) · `docs/DEPLOY-VERCEL.md` · `docs/SECURITY-RUNBOOK.md` · `docs/E2E-BACKEND.md` ·
`docs/ROADMAP-STATUS.md` · `CONTRIBUTING.md` · `GLOSSARY.md`

License: MIT.
