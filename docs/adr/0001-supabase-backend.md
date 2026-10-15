# Supabase as the portfolio backend

Status: accepted

Content (projects, certificates, tech stack) and the contact Inbox live in Supabase Postgres, edited through the admin view with Supabase Auth and images in Supabase Storage, because the site must stay build-free static hosting while the admin works across devices — which rules out localStorage and a self-hosted server.

## Considered Options

- **Firebase (Firestore + Auth + Storage):** rejected — per-collection security rules are more verbose for this public-read/admin-write shape, and seed data cannot be reviewed as one explicit SQL file.
- **Static only (localStorage + export/import JSON):** rejected — data stays in one browser, which fails the core requirement that admin edits appear for every viewer.

## Consequences

- The anon key is public by design; row-level security is the real access control, so `service_role` must never enter the repo or the browser.
- When the backend is unreachable or unconfigured, the user view falls back to the frozen seed in `js/content.js` with an honest banner — never a blank page or a false success.
- Free-tier limits (database size, bandwidth, idle pause) apply; the exit path is a plain SQL dump, no lock-in beyond Postgres.

## Verify RLS (replace PROJECT with the project ref, ANON with the anon key)

```bash
# Public read works (expect 200 with rows after seed):
curl "https://PROJECT.supabase.co/rest/v1/projects?select=id,title" \
  -H "apikey: ANON" -H "Authorization: Bearer ANON"

# Anonymous write is denied (expect 401/403, never 201):
curl -X POST "https://PROJECT.supabase.co/rest/v1/projects" \
  -H "apikey: ANON" -H "Authorization: Bearer ANON" \
  -H "Content-Type: application/json" \
  -d '{"title":"probe","image":"assets/x.png","tech":[]}'
```
