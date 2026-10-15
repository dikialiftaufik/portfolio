# Portfolio — Diki Alif Taufik

Two views, one backend, still no build step: public portfolio (`/`) plus an
admin console (`/admin.html`), both React 18 UMD + Tailwind Play CDN + Babel
standalone reading live data through `PortfolioStore` (`js/store.js`).

## Preview

```bash
npx serve .
# user view:  http://localhost:3000/
# admin:      http://localhost:3000/admin.html
```

On first run without backend config, both views render from the frozen seed
in `js/content.js` with an honest "Showing cached content…" banner.

## Backend setup (Supabase, once per machine)

1. Create a project at Supabase, then SQL Editor → run `supabase/schema.sql`
   (tables + RLS + `portfolio-media` bucket) → run `supabase/seed.sql`
   (3 projects, 7 certificates, 18 tech items).
2. Authentication → Add user → one admin account (turn **Auto Confirm** on).
3. Storage → confirm the `portfolio-media` bucket exists and is public.
4. Copy `config.local.example.js` to `config.local.js` (git-ignored, never
   committed) and fill in the project URL + **anon** key from
   Project Settings → API.

Verify: anonymous `GET /rest/v1/projects` → 200; anonymous `POST` → 401.
Full checklist with curl snippets: `docs/E2E-BACKEND.md`.

## Structure

```text
index.html              # user view: wiring + presentation, data via PortfolioStore
admin.html              # admin console: Auth login, CRUD, Storage upload, inbox (noindex)
css/main.css            # responsive + .admin-* scope; zero !important
js/config.js            # getConfig() reads window.__PORTFOLIO_CONFIG__ (null = seed mode)
js/store.js             # PortfolioStore: list/subscribe/create/update/remove/sendMessage
js/content.js           # frozen seed fallback (never edited to change content)
js/locale.js            # translations + get(path, lang) with English fallback
js/matcher.js           # knowledgeBase + findAnswer(query) -> string (static)
supabase/schema.sql     # tables, checks, RLS, bucket (idempotent)
supabase/seed.sql       # verbatim seed from js/content.js (stable ids)
config.local.example.js # credential shape (REPLACE-ME, committed)
config.local.js         # real credentials (local only, ignored)
assets/                 # legacy seed images + convention notes
docs/adr/               # versioned decisions (0001: Supabase backend)
docs/E2E-BACKEND.md     # manual end-to-end proof script
GLOSSARY.md             # domain + architecture terms
```

## Data & fallback behavior

- Admin edits (projects, certificates, tech stack) write to Supabase and
  appear in the user view live (realtime subscription, at worst after refresh).
- Contact form calls `sendMessage()` → stored in the admin inbox.
  No backend / offline → it falls back to the old honest `mailto:` flow
  ("Opening your email app…") and never claims a delivery it didn't make.
- Backend down or misconfigured → seed renders with banner + "Try again".

## Chatbot note

The chatbot answers from the static `knowledgeBase` in `js/matcher.js` — it
does **not** automatically learn newly added projects. Dynamic title lookup
is a follow-up, not a silent behavior.

## Security & limits

- The anon key is public by design; access control is row-level security
  (public read, authenticated write; messages: public insert only).
- `service_role` must **never** enter the repo or the browser. Verified with
  `git log -S` scans; CI-less rule: grep before every commit.
- Rotate a leaked anon key in Supabase dashboard → update `config.local.js`.
- Supabase free-tier limits apply (DB size, bandwidth, idle pause); exit path is a
  plain SQL dump — no lock-in beyond Postgres.

## Asset convention

`kebab-case`, lowercase, no spaces or apostrophes — for `assets/` and for
Storage paths (`projects/<slug>`, `certs/<slug>`, 2 MB cap, compress first).
Details: `assets/README.md`.

## Deploy

Any static host (GitHub Pages, Netlify, Vercel). No server, no env vars.
Pinned CDN versions are in the `<head>` of both pages. `admin.html` carries
`noindex, nofollow`.
