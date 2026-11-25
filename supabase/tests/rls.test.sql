-- RLS contract tests (pgTAP). Encodes every claim in docs/adr/0001-supabase-backend.md
-- and migration 0002. Run against a LOCAL Supabase only:
--   npx supabase start && npx supabase db reset && npx supabase test db
-- Everything runs inside one transaction and is rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

-- Helper: how many rows a DML statement touched (CTEs with DML cannot sit in a subquery).
create function public.rows_affected(q text) returns integer language plpgsql as $$
declare n integer;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---- fixtures (as the table owner, RLS bypassed)
insert into public.projects (id, title, image)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Fixture project', 'https://example.com/p.png');
insert into public.messages (name, email, message)
values ('Fixture', 'fixture@example.com', 'A pre-existing private message.');
-- now() is frozen inside a transaction: age the settings row so the admin update below
-- can prove the updated_at trigger.
alter table public.site_settings disable trigger site_settings_set_updated_at;
update public.site_settings set updated_at = '2000-01-01';
alter table public.site_settings enable trigger site_settings_set_updated_at;

-- ================================================================== anonymous
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select lives_ok($$ select * from public.projects $$, 'anon can read projects');
select lives_ok($$ select * from public.certificates $$, 'anon can read certificates');
select lives_ok($$ select * from public.tech_stack $$, 'anon can read tech_stack');

select throws_ok(
  $$ insert into public.projects (title, image) values ('Nope', 'https://example.com/x.png') $$,
  '42501', null, 'anon cannot insert projects');

select is(public.rows_affected($$ update public.projects set title = 'Hacked' $$), 0,
  'anon update touches no rows');
select is(public.rows_affected($$ delete from public.projects $$), 0,
  'anon delete touches no rows');

select is((select count(*)::int from public.messages), 0, 'anon cannot read messages');
select throws_ok(
  $$ insert into public.messages (name, email, message) values ('Eve', 'eve@example.com', 'direct insert attempt') $$,
  '42501', null, 'anon cannot insert messages directly');

select lives_ok(
  $$ select public.submit_message('Ada Lovelace', 'ada@example.com', 'Hello from the contact form') $$,
  'anon can submit a message through the RPC');
select lives_ok($$ select public.submit_message('Ada Lovelace', 'ada@example.com', 'Second message here') $$, 'second message ok');
select lives_ok($$ select public.submit_message('Ada Lovelace', 'ada@example.com', 'Third message here') $$, 'third message ok');
select throws_ok(
  $$ select public.submit_message('Ada Lovelace', 'ada@example.com', 'Fourth message here') $$,
  'P0001', 'rate_limited', 'fourth message from one email within an hour is rate limited');

select is((select count(*)::int from public.site_settings), 1, 'anon can read site settings');
select throws_ok(
  $$ update public.site_settings set cv_url = 'https://evil.example.com/cv' $$,
  '42501', null, 'anon cannot update site settings');
select throws_ok(
  $$ insert into public.site_settings (id, cv_url) values (true, 'https://evil.example.com/cv') $$,
  '42501', null, 'anon cannot insert site settings');

-- ==================================================== authenticated, NOT admin
reset role;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111"}', true);
set local role authenticated;

select throws_ok(
  $$ insert into public.projects (title, image) values ('Nope', 'https://example.com/x.png') $$,
  '42501', null, 'a signed-in non-admin cannot insert projects (S1)');
select is((select count(*)::int from public.messages), 0, 'a signed-in non-admin cannot read messages');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('portfolio-media', 'projects/x.png') $$,
  '42501', null, 'a signed-in non-admin cannot upload to the media bucket');

select is(public.rows_affected($$ update public.site_settings set cv_url = 'https://evil.example.com/cv' $$), 0,
  'a signed-in non-admin update touches no settings');

-- ============================================================== admin identity
reset role;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"22222222-2222-4222-8222-222222222222","app_metadata":{"role":"admin"}}', true);
set local role authenticated;

select lives_ok(
  $$ insert into public.projects (title, image) values ('Admin project', 'https://example.com/a.png') $$,
  'admin can insert projects');
-- now() is frozen inside a transaction, so prove the trigger by forcing an old value.
select lives_ok(
  $$ update public.projects set title = 'Renamed by admin', updated_at = '2000-01-01'
       where title = 'Admin project' $$,
  'admin can update projects');
select ok(
  (select updated_at > '2001-01-01' from public.projects where title = 'Renamed by admin'),
  'updated_at is maintained by the trigger');
select cmp_ok((select count(*)::int from public.messages), '>=', 1, 'admin can read the inbox');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('portfolio-media', 'projects/ok.png') $$,
  'admin can upload to the media bucket');

-- ================================================================== positions
-- sort_order is a dense 0-based position (migration 0004). now() is frozen here,
-- so none of these rely on created_at.
insert into public.projects (id, title, image, sort_order)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Position probe', 'https://example.com/b.png', 0);
select is(
  (select sort_order from public.projects where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'inserting at position 0 puts the row first');
select ok(
  (select count(distinct sort_order) = count(*) and min(sort_order) = 0
      and max(sort_order) = count(*) - 1 from public.projects),
  'positions stay unique and dense after an insert');

update public.projects set sort_order = 999 where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select is(
  (select sort_order from public.projects where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  (select count(*)::int - 1 from public.projects),
  'a position past the end is clamped to last');

update public.projects set sort_order = -5 where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select is(
  (select sort_order from public.projects where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'a negative position is clamped to first');

update public.projects set title = 'Position probe, renamed'
 where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select is(
  (select sort_order from public.projects where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0,
  'editing another field keeps the position');

delete from public.projects where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select ok(
  (select count(distinct sort_order) = count(*) and min(sort_order) = 0
      and max(sort_order) = count(*) - 1 from public.projects),
  'deleting a row closes the gap');

-- The seed.sql shape: one statement, several rows, consecutive positions.
insert into public.tech_stack (name, icon, sort_order)
values ('Probe A', 'devicon-a-plain', 0), ('Probe B', 'devicon-b-plain', 1),
       ('Probe C', 'devicon-c-plain', 2);
select is(
  (select string_agg(name, ',' order by sort_order) from public.tech_stack where sort_order < 3),
  'Probe A,Probe B,Probe C',
  'a multi-row insert keeps its own order');

-- ================================================================ site settings
select lives_ok(
  $$ update public.site_settings set cv_url = 'https://drive.google.com/file/d/abc/view?usp=sharing' $$,
  'admin can update the CV link');
select ok(
  (select updated_at > '2001-01-01' from public.site_settings),
  'site settings updated_at is maintained by the trigger');
select throws_ok(
  $$ insert into public.site_settings (id, cv_url) values (true, 'https://example.com/cv') $$,
  '42501', null, 'not even the admin can insert a settings row');
select throws_ok(
  $$ delete from public.site_settings $$,
  '42501', null, 'not even the admin can delete the settings row');
select throws_ok(
  $$ update public.site_settings set cv_url = 'http://example.com/cv' $$,
  '23514', null, 'the CV link must be https');
select throws_ok(
  $$ update public.site_settings set cv_url = 'javascript:alert(1)' $$,
  '23514', null, 'the CV link cannot be a script URL');
select throws_ok(
  $$ update public.site_settings set cv_url = 'https://a@evil.example.com/cv' $$,
  '23514', null, 'the CV link cannot carry user info');

-- ================================================================== constraints
select throws_ok(
  $$ insert into public.projects (title, image) values ('Script URL', 'javascript:alert(1)') $$,
  '23514', null, 'image must be https or a legacy assets/ path (S8)');
select throws_ok(
  $$ insert into public.projects (title, image, github_link) values ('Bad link', 'https://example.com/a.png', 'ftp://x') $$,
  '23514', null, 'github_link must be http(s)');

select * from finish();
rollback;
