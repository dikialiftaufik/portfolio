-- Portfolio backend contract — Task 1.
-- Supabase Postgres: Content tables (projects, certificates, tech_stack)
-- + Inbox (messages) + Storage bucket (portfolio-media), all with RLS.
-- Idempotent: safe to run more than once via SQL Editor.
-- NOTE: seed image values may be relative `assets/...` paths (pre-Storage
-- legacy uploads) or absolute https URLs (Storage uploads / external).

-- ---------------------------------------------------------------- uuids
create extension if not exists "pgcrypto";

-- ================================================================ projects
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 3 and 80),
  tagline     text,
  description text check (description is null or char_length(description) <= 2000),
  tech        text[] not null default '{}',
  image       text not null check (image ~ '^(https?://|assets/)'),
  github_link text check (github_link is null or github_link ~ '^https?://'),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_sort_order_idx
  on public.projects (sort_order, created_at);

-- ============================================================ certificates
create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 3 and 120),
  issuer      text not null check (char_length(issuer) between 2 and 120),
  date_label  text not null check (date_label ~ '^[A-Z][a-z]{2} [0-9]{4}$'),
  image       text not null check (image ~ '^(https?://|assets/)'),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists certificates_sort_order_idx
  on public.certificates (sort_order, created_at);

-- ============================================================= tech_stack
create table if not exists public.tech_stack (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 60),
  icon        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tech_stack_sort_order_idx
  on public.tech_stack (sort_order, created_at);

-- ================================================================ messages
-- Inbox: visitor messages from the contact form. Public may insert only.
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message     text not null check (char_length(message) between 10 and 2000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists messages_created_at_idx
  on public.messages (created_at desc);

-- ==================================================================== RLS
-- Deny-by-default. Viewers read Content; only the Admin (authenticated)
-- writes Content and manages the Inbox; anyone may drop a message in.

alter table public.projects      ENABLE ROW LEVEL SECURITY;
alter table public.certificates  ENABLE ROW LEVEL SECURITY;
alter table public.tech_stack    ENABLE ROW LEVEL SECURITY;
alter table public.messages      ENABLE ROW LEVEL SECURITY;

-- -- projects
drop policy if exists "projects_select_public" on public.projects;
create policy "projects_select_public" on public.projects
  for select using (true);
drop policy if exists "projects_write_admin" on public.projects;
create policy "projects_write_admin" on public.projects
  for all to authenticated using (true) with check (true);

-- -- certificates
drop policy if exists "certificates_select_public" on public.certificates;
create policy "certificates_select_public" on public.certificates
  for select using (true);
drop policy if exists "certificates_write_admin" on public.certificates;
create policy "certificates_write_admin" on public.certificates
  for all to authenticated using (true) with check (true);

-- -- tech_stack
drop policy if exists "tech_stack_select_public" on public.tech_stack;
create policy "tech_stack_select_public" on public.tech_stack
  for select using (true);
drop policy if exists "tech_stack_write_admin" on public.tech_stack;
create policy "tech_stack_write_admin" on public.tech_stack
  for all to authenticated using (true) with check (true);

-- -- messages: public insert only, admin manages
drop policy if exists "messages_insert_public" on public.messages;
create policy "messages_insert_public" on public.messages
  for insert with check (true);
drop policy if exists "messages_manage_admin" on public.messages;
create policy "messages_manage_admin" on public.messages
  for all to authenticated using (true) with check (true);

-- ================================================================ Storage
-- Bucket portfolio-media: public read, authenticated write, 2 MB cap.
-- Paths: projects/<kebab>.<ext>, certs/<kebab>.<ext> (see assets/README.md).

insert into storage.buckets (id, name, "public", file_size_limit)
values ('portfolio-media', 'portfolio-media', true, 2097152)
on conflict (id) do update
  set "public" = true, file_size_limit = 2097152;

drop policy if exists "media_read_public" on storage.objects;
create policy "media_read_public" on storage.objects
  for select using (bucket_id = 'portfolio-media');

drop policy if exists "media_write_admin" on storage.objects;
create policy "media_write_admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'portfolio-media')
  with check (bucket_id = 'portfolio-media');

-- ================================================================ verify
-- After running, confirm in this order:
--   1. select * from public.projects;          -- 3 rows after seed.sql
--   2. Anonymous REST GET  /rest/v1/projects?select=id,title  -> 200
--      Anonymous REST POST /rest/v1/projects                  -> 401/403
-- Curl snippets live in docs/adr/0001-supabase-backend.md.
