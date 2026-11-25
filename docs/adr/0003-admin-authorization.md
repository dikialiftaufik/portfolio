# Admin authorization is an explicit identity, not "any signed-in user"

Status: accepted

The v1 policies were `for all to authenticated using (true)`. Supabase Auth allows public sign-ups by default, and the anon key is public, so anyone could register through the API and then write or delete all content, upload to Storage and read every message.

## Decision

- The admin is the user whose `app_metadata` contains `{"role": "admin"}`. `app_metadata` can only be written from the SQL Editor or with the service role, never by the user, so it is safe to trust inside policies (unlike `user_metadata`).
- `public.is_admin()` reads that claim from `auth.jwt()`. Every write policy (projects, certificates, tech_stack, messages, and `storage.objects` for the media bucket) requires it. Public SELECT on content and the bucket stays.
- Sign-ups are also turned off in the dashboard (defence in depth); see `docs/SECURITY-RUNBOOK.md`.
- Migration `0002_admin_hardening.sql` is idempotent. **Mark the admin user first**, otherwise the new policies lock the admin out until the SQL Editor (which bypasses RLS) is used to fix it.

## Verification

`supabase/tests/rls.test.sql` (pgTAP, `supabase test db`) encodes the whole contract: anon reads content but cannot write; a signed-in non-admin cannot write content, read messages or upload; the admin can. It also covers the CHECK constraints that block `javascript:` image URLs. In this repository it was executed against PostgreSQL 18 with a stand-in for Supabase's `auth`/`storage` schemas (22/22 passing); CI runs it against the real Supabase stack. A negative control on the v1 schema confirms a random authenticated user could write, so the test fails without the migration.

## Consequences

- A stolen session of any other user is harmless. A stolen admin session is still powerful, so enable TOTP MFA on the admin account.
- JWT claims refresh on sign-in: the admin must log out and in once after being marked.
