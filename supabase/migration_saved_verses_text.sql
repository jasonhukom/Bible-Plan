-- ============================================================================
-- Bible Plan -- migration: cache verse text on save
-- ----------------------------------------------------------------------------
-- The new Bible reader saves the verse's own text (and the book's display
-- name) alongside the reference, so the Saves page can render a verse
-- without an extra HelloAO fetch, and so a saved verse keeps reading the
-- same even if you later switch your default translation.
--
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================================

alter table public.saved_verses
  add column if not exists book_name text,
  add column if not exists verse_text text;

comment on column public.saved_verses.book_name is
  'Display name of the book at save time, e.g. "Genesis".';
comment on column public.saved_verses.verse_text is
  'The verse text at save time, so Saves can render without refetching.';
