-- ============================================================================
-- Bible Plan -- migration: simplified plan progress
-- ----------------------------------------------------------------------------
-- This rewrite ships with a single, fixed 121-day reading plan (the same one
-- already in readings-data.js / src/lib/readingPlanData.js), rather than the
-- multi-plan / configurable book_groups + order_mode system the original
-- reading_plans + reading_schedule tables were built for. Those two tables
-- are untouched -- this just adds a much smaller table for the one thing the
-- new Plan page needs: which of the 121 days are marked read.
--
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================================

create table if not exists public.plan_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  day_index    integer not null check (day_index >= 0),
  date         date,
  passage      text,
  completed    boolean not null default true,
  completed_at timestamptz not null default now(),
  primary key (user_id, day_index)
);

comment on table public.plan_progress is
  'Which days of the fixed 121-day reading plan a user has marked read.';

alter table public.plan_progress enable row level security;

drop policy if exists plan_progress_select_own on public.plan_progress;
create policy plan_progress_select_own on public.plan_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists plan_progress_upsert_own on public.plan_progress;
create policy plan_progress_upsert_own on public.plan_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists plan_progress_update_own on public.plan_progress;
create policy plan_progress_update_own on public.plan_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists plan_progress_delete_own on public.plan_progress;
create policy plan_progress_delete_own on public.plan_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);
