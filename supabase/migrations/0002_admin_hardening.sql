-- 0002_admin_hardening
-- Closes the findings from docs/internal/ANALISIS-DAN-ROADMAP.md (S1, S2, S3, S7):
--   * writes are restricted to the admin identity, not "any authenticated user"
--   * the contact form goes through a rate-limited RPC (no direct anon INSERT)
--   * updated_at is maintained by a trigger
--   * the media bucket only accepts web image types
-- Idempotent: safe to run more than once.
--
-- !! RUN docs/SECURITY-RUNBOOK.md STEP 1 FIRST (mark your admin user) !!
-- Otherwise these policies lock the admin out until you mark the user from the
-- SQL Editor (which always works: it bypasses RLS).

-- ============================================================ admin identity
-- The admin is the user whose app_metadata contains {"role": "admin"}.
-- app_metadata can only be written with the service role / SQL Editor, never by
-- the user themselves (unlike user_metadata), so it is safe to trust in policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- ==================================================================== policies
-- Content tables: public read stays, writes become admin-only.
drop policy if exists "projects_write_admin" on public.projects;
create policy "projects_write_admin" on public.projects
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "certificates_write_admin" on public.certificates;
create policy "certificates_write_admin" on public.certificates
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "tech_stack_write_admin" on public.tech_stack;
create policy "tech_stack_write_admin" on public.tech_stack
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Inbox: only the admin reads and manages messages.
drop policy if exists "messages_manage_admin" on public.messages;
create policy "messages_manage_admin" on public.messages
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Visitors no longer INSERT directly: they call submit_message() below.
drop policy if exists "messages_insert_public" on public.messages;

-- Storage: public read, admin-only write.
drop policy if exists "media_write_admin" on storage.objects;
create policy "media_write_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'portfolio-media' and (select public.is_admin()))
  with check (bucket_id = 'portfolio-media' and (select public.is_admin()));

-- ===================================================================== bucket
-- Server-side MIME allow-list (the client check alone is bypassable).
update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'],
       file_size_limit    = 2097152
 where id = 'portfolio-media';

-- ================================================================== messages
alter table public.messages drop constraint if exists messages_email_length;
alter table public.messages add constraint messages_email_length
  check (char_length(email) <= 254);

-- Contact form entry point. Replaces the old "insert with check (true)" policy:
--   * honest rate limit: 3 messages / hour per email, 60 / hour overall
--   * returns nothing, so anon never needs (or gets) SELECT access to messages
-- It is SECURITY DEFINER because anon has no INSERT right on the table any more;
-- search_path is pinned so it cannot be hijacked.
create or replace function public.submit_message(p_name text, p_email text, p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  per_email integer;
  overall   integer;
begin
  select count(*) into per_email
    from public.messages
   where lower(email) = lower(btrim(p_email))
     and created_at > now() - interval '1 hour';
  if per_email >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select count(*) into overall
    from public.messages
   where created_at > now() - interval '1 hour';
  if overall >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.messages (name, email, message)
  values (btrim(p_name), btrim(p_email), btrim(p_message));
end;
$$;

revoke all on function public.submit_message(text, text, text) from public;
grant execute on function public.submit_message(text, text, text) to anon, authenticated;

-- Retention: delete messages older than N days. Not callable from the API.
-- Schedule it with pg_cron if you want it automatic (Database -> Extensions):
--   select cron.schedule('purge-old-messages', '0 3 * * 0',
--                        $$ select public.purge_old_messages(365) $$);
create or replace function public.purge_old_messages(retain_days integer default 365)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  delete from public.messages where created_at < now() - make_interval(days => retain_days);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_old_messages(integer) from public, anon, authenticated;

-- ============================================================== updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists certificates_set_updated_at on public.certificates;
create trigger certificates_set_updated_at before update on public.certificates
  for each row execute function public.set_updated_at();

drop trigger if exists tech_stack_set_updated_at on public.tech_stack;
create trigger tech_stack_set_updated_at before update on public.tech_stack
  for each row execute function public.set_updated_at();
