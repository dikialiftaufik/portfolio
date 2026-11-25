# Contact form goes through a rate-limited RPC

Status: accepted

`messages` allowed `insert with check (true)` for everyone. Throttling existed only in the browser, so a script could fill the free-tier database and the inbox. The old client also used `.insert().select().single()`, which asks PostgREST to return the row; anon has no SELECT policy on `messages`, so that response can be rejected by RLS even when the row is stored.

## Decision

- Drop the public INSERT policy. Visitors call `public.submit_message(p_name, p_email, p_message)` (SECURITY DEFINER, pinned `search_path`, `execute` granted to `anon`).
- The function limits to 3 messages per hour per email and 60 per hour overall, raising `rate_limited`, which the client turns into a friendly message. It returns nothing, so anon never needs SELECT.
- Table CHECKs stay the last line of defence (name, email length 254, message length).
- The client keeps its honeypot and 30 s throttle (UX only) and, **only while migration 0002 is not applied** (`PGRST202`, function missing), falls back to a plain `.insert()` without `.select()`.
- `public.purge_old_messages(days)` implements a retention policy; schedule it with `pg_cron` if wanted (instructions in the migration).

## Not done (needs an external account)

Cloudflare Turnstile / hCaptcha with an Edge Function that verifies the token and sees the client IP would stop determined bots; the per-email and global limits do not. Add it if spam appears in the inbox. Per-IP limiting is not possible inside Postgres through PostgREST.
