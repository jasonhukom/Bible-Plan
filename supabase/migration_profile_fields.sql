-- ============================================================================
-- Bible Plan -- migration: profile page fields
-- ----------------------------------------------------------------------------
-- Run this AFTER the existing supabase/schema.sql (it only adds to what's
-- already there -- your saved_verses, reading_plans, etc. are untouched).
--
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Adds the two new profile fields the Profile page needs (bio, church) and a
-- public storage bucket for avatar images. Idempotent: safe to re-run.
-- ============================================================================

alter table public.profiles
  add column if not exists bio         text,
  add column if not exists church_name text;

comment on column public.profiles.bio is
  'Short free-text description the user writes about themselves.';
comment on column public.profiles.church_name is
  'Plain-text church name/location the user typed in on their profile.';

-- ----------------------------------------------------------------------------
-- Storage: avatars bucket
-- ----------------------------------------------------------------------------
-- Public bucket (read) so avatar URLs work in <img> tags without signing;
-- writes are still locked to the owner via the policies below. Files are
-- keyed as "<user_id>/<filename>" so the folder name IS the RLS check.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
