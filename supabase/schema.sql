-- ============================================================================
-- Bible Plan — Supabase schema
-- ----------------------------------------------------------------------------
-- Run this once against your Supabase project:
--
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--   or: supabase db push   (if you use the Supabase CLI)
--
-- The script is idempotent: re-running it is safe.
--
-- Everything in here is user-owned data. Row Level Security is enabled on
-- every table and every policy is keyed on auth.uid(), so a signed-in user
-- can only ever see or change their own rows. There is no policy that lets
-- one user read another user's verses, notes, settings, calendar or progress.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto" with schema extensions;

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------

-- Keeps updated_at honest without trusting the client to send it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Public-facing profile fields for a user. One row per auth.users row.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- user_settings
-- ============================================================================
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  theme       text not null default 'default',
  translation text not null default 'KJV',
  canon       text not null default 'protestant',
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.user_settings is
  'Per-user app preferences. `preferences` holds anything that does not deserve its own column yet.';

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- reading_plans
-- ----------------------------------------------------------------------------
-- A user's reading-plan subscription/configuration. Mirrors the settings the
-- plan panel already collects (start date, length, weekdays, book groups,
-- order mode, daily wise words). A user may keep several; exactly one is
-- flagged active.
-- ============================================================================
create table if not exists public.reading_plans (
  id          uuid primary key default extensions.gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default 'My reading plan',
  start_date  date,
  days        integer not null default 121 check (days between 1 and 730),
  weekdays    smallint[] not null default '{0,1,2,3,4,5,6}'::smallint[],
  book_groups text[] not null default '{ot,nt}'::text[],
  order_mode  text not null default 'inorder' check (order_mode in ('inorder', 'overlap')),
  wise_words  text[] not null default '{psalms,proverbs}'::text[],
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.reading_plans is
  'Reading-plan subscriptions/configuration owned by a user.';

create index if not exists reading_plans_user_id_idx
  on public.reading_plans (user_id);

-- At most one active plan per user.
create unique index if not exists reading_plans_one_active_per_user
  on public.reading_plans (user_id)
  where is_active;

drop trigger if exists reading_plans_set_updated_at on public.reading_plans;
create trigger reading_plans_set_updated_at
  before update on public.reading_plans
  for each row execute function public.set_updated_at();

-- ============================================================================
-- reading_schedule
-- ----------------------------------------------------------------------------
-- One row per chapter scheduled on a day. This is the normalised, queryable
-- form of the calendar the app renders, and it carries the completion state.
-- ============================================================================
create table if not exists public.reading_schedule (
  id           uuid primary key default extensions.gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  plan_id      uuid references public.reading_plans (id) on delete cascade,
  day_index    integer not null default 0,
  date         date,
  book         text not null,           -- abbreviation as used by the app, e.g. 'Gen'
  book_name    text,                    -- full name, e.g. 'Genesis'
  chapter      integer not null check (chapter > 0),
  category     text,                    -- ot | dc | nt | psalms | proverbs
  position     integer not null default 0,  -- order within the day
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Keyed on position rather than on book+chapter: a day can legitimately
  -- schedule the same chapter twice (e.g. Psalm 1 as part of the Old
  -- Testament run *and* as that day's Daily Psalm), and position is unique
  -- within a day by construction.
  constraint reading_schedule_unique_entry
    unique (user_id, plan_id, day_index, position)
);

comment on table public.reading_schedule is
  'Scheduled chapters and their completion state, one row per chapter per day.';

create index if not exists reading_schedule_user_plan_idx
  on public.reading_schedule (user_id, plan_id, day_index, position);

create index if not exists reading_schedule_user_date_idx
  on public.reading_schedule (user_id, date);

create index if not exists reading_schedule_reference_idx
  on public.reading_schedule (user_id, plan_id, book, chapter);

drop trigger if exists reading_schedule_set_updated_at on public.reading_schedule;
create trigger reading_schedule_set_updated_at
  before update on public.reading_schedule
  for each row execute function public.set_updated_at();

-- ============================================================================
-- verse_collections
-- ----------------------------------------------------------------------------
-- Optional folders for saved verses. saved_verses.collection_id points here.
-- ============================================================================
create table if not exists public.verse_collections (
  id         uuid primary key default extensions.gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verse_collections_unique_name unique (user_id, name)
);

comment on table public.verse_collections is
  'User-defined collections that saved verses can be filed under.';

create index if not exists verse_collections_user_id_idx
  on public.verse_collections (user_id);

drop trigger if exists verse_collections_set_updated_at on public.verse_collections;
create trigger verse_collections_set_updated_at
  before update on public.verse_collections
  for each row execute function public.set_updated_at();

-- ============================================================================
-- saved_verses
-- ============================================================================
create table if not exists public.saved_verses (
  id            uuid primary key default extensions.gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  translation   text not null default 'KJV',
  book          text not null,
  chapter       integer not null check (chapter > 0),
  verse         integer check (verse is null or verse > 0),
  note          text,
  collection_id uuid references public.verse_collections (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.saved_verses is
  'Verses a user has saved, with an optional private note and collection.';

create index if not exists saved_verses_user_id_idx
  on public.saved_verses (user_id, created_at desc);

create index if not exists saved_verses_collection_idx
  on public.saved_verses (collection_id);

create index if not exists saved_verses_reference_idx
  on public.saved_verses (user_id, book, chapter);

drop trigger if exists saved_verses_set_updated_at on public.saved_verses;
create trigger saved_verses_set_updated_at
  before update on public.saved_verses
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- RLS is forced on for every table. Policies are granted to the `authenticated`
-- role only — the anonymous role gets no policy at all, so an unauthenticated
-- request reads and writes nothing.
--
-- auth.uid() is wrapped in a scalar sub-select, which lets Postgres evaluate it
-- once per statement instead of once per row.
-- ============================================================================

alter table public.profiles          enable row level security;
alter table public.user_settings     enable row level security;
alter table public.reading_plans     enable row level security;
alter table public.reading_schedule  enable row level security;
alter table public.verse_collections enable row level security;
alter table public.saved_verses      enable row level security;

-- ---- profiles --------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

-- ---- user_settings ---------------------------------------------------------
drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_settings_delete_own on public.user_settings;
create policy user_settings_delete_own on public.user_settings
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- reading_plans ---------------------------------------------------------
drop policy if exists reading_plans_select_own on public.reading_plans;
create policy reading_plans_select_own on public.reading_plans
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists reading_plans_insert_own on public.reading_plans;
create policy reading_plans_insert_own on public.reading_plans
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists reading_plans_update_own on public.reading_plans;
create policy reading_plans_update_own on public.reading_plans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists reading_plans_delete_own on public.reading_plans;
create policy reading_plans_delete_own on public.reading_plans
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- reading_schedule ------------------------------------------------------
-- Writes additionally verify the referenced plan belongs to the same user, so
-- nobody can attach schedule rows to someone else's plan.
drop policy if exists reading_schedule_select_own on public.reading_schedule;
create policy reading_schedule_select_own on public.reading_schedule
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists reading_schedule_insert_own on public.reading_schedule;
create policy reading_schedule_insert_own on public.reading_schedule
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      plan_id is null
      or exists (
        select 1 from public.reading_plans p
        where p.id = plan_id and p.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists reading_schedule_update_own on public.reading_schedule;
create policy reading_schedule_update_own on public.reading_schedule
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      plan_id is null
      or exists (
        select 1 from public.reading_plans p
        where p.id = plan_id and p.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists reading_schedule_delete_own on public.reading_schedule;
create policy reading_schedule_delete_own on public.reading_schedule
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- verse_collections -----------------------------------------------------
drop policy if exists verse_collections_select_own on public.verse_collections;
create policy verse_collections_select_own on public.verse_collections
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists verse_collections_insert_own on public.verse_collections;
create policy verse_collections_insert_own on public.verse_collections
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists verse_collections_update_own on public.verse_collections;
create policy verse_collections_update_own on public.verse_collections
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists verse_collections_delete_own on public.verse_collections;
create policy verse_collections_delete_own on public.verse_collections
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---- saved_verses ----------------------------------------------------------
-- Writes additionally verify the collection belongs to the same user.
drop policy if exists saved_verses_select_own on public.saved_verses;
create policy saved_verses_select_own on public.saved_verses
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists saved_verses_insert_own on public.saved_verses;
create policy saved_verses_insert_own on public.saved_verses
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      collection_id is null
      or exists (
        select 1 from public.verse_collections c
        where c.id = collection_id and c.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists saved_verses_update_own on public.saved_verses;
create policy saved_verses_update_own on public.saved_verses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      collection_id is null
      or exists (
        select 1 from public.verse_collections c
        where c.id = collection_id and c.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists saved_verses_delete_own on public.saved_verses;
create policy saved_verses_delete_own on public.saved_verses
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- Grants
-- ----------------------------------------------------------------------------
-- PostgREST reaches these tables as `anon` or `authenticated`. Only the
-- authenticated role is granted anything; RLS then narrows that to own rows.
-- ============================================================================
revoke all on public.profiles,
              public.user_settings,
              public.reading_plans,
              public.reading_schedule,
              public.verse_collections,
              public.saved_verses
  from anon;

grant select, insert, update, delete on
  public.profiles,
  public.user_settings,
  public.reading_plans,
  public.reading_schedule,
  public.verse_collections,
  public.saved_verses
  to authenticated;

-- ============================================================================
-- New-user bootstrap
-- ----------------------------------------------------------------------------
-- When someone signs up (email/password or OAuth), give them a profile row and
-- a settings row immediately, so the client never has to special-case "no row
-- yet". Runs as security definer because it writes on behalf of a brand new
-- user before any session exists.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
