-- 0005_site_settings
-- One-row table for site-wide settings the admin edits (first one: the CV link).
--   * public read, admin-only update; no insert or delete through the API
--   * the link must be https, without user info or whitespace, at most 2048 chars
-- Needs is_admin() and set_updated_at() from 0002. Idempotent: safe to run more
-- than once, and a re-run never overwrites the admin's link.

begin;

create table if not exists public.site_settings (
  id          boolean primary key default true check (id),
  cv_url      text not null
              constraint site_settings_cv_url_https check (
                char_length(cv_url) <= 2048
                and cv_url ~ '^https://[^/?#@[:space:]]+\.[^/?#@[:space:]]+([/?#][^[:space:]]*)?$'
              ),
  updated_at  timestamptz not null default now()
);

insert into public.site_settings (id, cv_url)
values (true, 'https://drive.google.com/file/d/1g0QLk5X0iVHT6ocU8TfEqbkOS-xsR3wm/view?usp=sharing')
on conflict (id) do nothing;

-- ==================================================================== access
alter table public.site_settings enable row level security;

-- Defence in depth on top of RLS. TRUNCATE ignores RLS, so its grant goes too.
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (cv_url) on public.site_settings to authenticated;

drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_update_admin" on public.site_settings;
create policy "site_settings_update_admin" on public.site_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

commit;
