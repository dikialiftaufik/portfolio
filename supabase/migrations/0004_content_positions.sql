-- 0004_content_positions
-- sort_order becomes a dense, 0-based position (0 shows first) on the three
-- content tables:
--   * writing position p puts the row there and shifts the others
--   * out-of-range values are clamped to the first / last position
--   * deleting a row closes the gap
-- Enforced here so every write path (admin console, SQL Editor, seed.sql) agrees,
-- inside the same transaction as the write itself.
-- Idempotent: safe to run more than once.

begin;

-- ================================================================= functions
-- Both are SECURITY INVOKER on purpose: row-level security keeps applying.

create or replace function public.lock_content_positions()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- One writer per table at a time, locked before any row lock is taken.
  perform pg_advisory_xact_lock(hashtext('positions:' || tg_table_name));
  return null;
end;
$$;

create or replace function public.apply_content_position()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  tbl    text := format('%I.%I', tg_table_schema, tg_table_name);
  total  integer;
  target integer;
begin
  if tg_op = 'DELETE' then
    execute format($q$
      with ranked as (
        select id, (row_number() over (order by sort_order, created_at, id) - 1)::int as pos
          from %1$s)
      update %1$s t set sort_order = r.pos from ranked r
       where t.id = r.id and t.sort_order is distinct from r.pos
    $q$, tbl);
    return null;
  end if;

  execute format('select count(*)::int from %s', tbl) into total;
  target := least(greatest(new.sort_order, 0), total - 1);

  -- Rank everyone else, leave a hole at the target, drop the written row into it.
  execute format($q$
    with others as (
      select id, (row_number() over (order by sort_order, created_at, id) - 1)::int as pos
        from %1$s where id <> $1),
    ranked as (
      select id, case when pos >= $2 then pos + 1 else pos end as pos from others
      union all
      select $1, $2)
    update %1$s t set sort_order = r.pos from ranked r
     where t.id = r.id and t.sort_order is distinct from r.pos
  $q$, tbl)
  using new.id, target;
  return null;
end;
$$;

-- ================================================== backfill, then triggers
-- Order matters: drop, backfill, create. A re-run must not fire the triggers
-- while the backfill is renumbering.
do $$
declare
  t text;
begin
  foreach t in array array['projects', 'certificates', 'tech_stack'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_position_lock', t);
    execute format('drop trigger if exists %I on public.%I', t || '_position_insert', t);
    execute format('drop trigger if exists %I on public.%I', t || '_position_update', t);
    execute format('drop trigger if exists %I on public.%I', t || '_position_delete', t);

    -- Makes the numbers dense WITHOUT changing the order visitors see today.
    execute format($q$
      with ranked as (
        select id, (row_number() over (order by sort_order, created_at, id) - 1)::int as pos
          from public.%1$I)
      update public.%1$I x set sort_order = r.pos from ranked r
       where x.id = r.id and x.sort_order is distinct from r.pos
    $q$, t);

    -- pg_trigger_depth() = 0 keeps the renumbering UPDATE from re-triggering.
    execute format(
      'create trigger %I before insert or update or delete on public.%I
         for each statement when (pg_trigger_depth() = 0)
         execute function public.lock_content_positions()',
      t || '_position_lock', t);
    execute format(
      'create trigger %I after insert on public.%I
         for each row when (pg_trigger_depth() = 0)
         execute function public.apply_content_position()',
      t || '_position_insert', t);
    execute format(
      'create trigger %I after update of sort_order on public.%I
         for each row when (pg_trigger_depth() = 0 and old.sort_order is distinct from new.sort_order)
         execute function public.apply_content_position()',
      t || '_position_update', t);
    execute format(
      'create trigger %I after delete on public.%I
         for each row when (pg_trigger_depth() = 0)
         execute function public.apply_content_position()',
      t || '_position_delete', t);
  end loop;
end;
$$;

commit;
