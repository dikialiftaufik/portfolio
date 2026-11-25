-- RLS contract tests (pgTAP). Encodes every claim in docs/adr/0001-supabase-backend.md
-- and migration 0002. Run against a LOCAL Supabase only:
--   npx supabase start && npx supabase db reset && npx supabase test db
-- Everything runs inside one transaction and is rolled back.

begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

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

-- ================================================================== constraints
select throws_ok(
  $$ insert into public.projects (title, image) values ('Script URL', 'javascript:alert(1)') $$,
  '23514', null, 'image must be https or a legacy assets/ path (S8)');
select throws_ok(
  $$ insert into public.projects (title, image, github_link) values ('Bad link', 'https://example.com/a.png', 'ftp://x') $$,
  '23514', null, 'github_link must be http(s)');

select * from finish();
rollback;
