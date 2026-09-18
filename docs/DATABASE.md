# Database

PostgreSQL, hosted by Supabase. The full definition lives in
[`supabase/schema.sql`](../supabase/schema.sql) and is idempotent — running it
again is safe.

## Applying it

Dashboard → SQL Editor → New query → paste `supabase/schema.sql` → Run.
With the CLI: `supabase db push`.

## Tables

All six hold user-owned data. Every one has `created_at` / `updated_at`, kept
current by a trigger rather than by the client.

### `profiles`
| column | type | notes |
| --- | --- | --- |
| `id` | uuid PK | FK → `auth.users(id)`, cascade delete |
| `display_name` | text | |
| `avatar_url` | text | |

### `user_settings`
| column | type | notes |
| --- | --- | --- |
| `user_id` | uuid PK | FK → `auth.users(id)` |
| `theme` | text | default `'default'` |
| `translation` | text | default `'KJV'` |
| `canon` | text | default `'protestant'` |
| `preferences` | jsonb | default `{}` — anything without its own column yet |

### `reading_plans`
A user's plan subscription/configuration, mirroring the plan panel.

| column | type | notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users(id)` |
| `name` | text | |
| `start_date` | date | |
| `days` | int | 1–730 |
| `weekdays` | smallint[] | 0 = Sunday |
| `book_groups` | text[] | `ot` / `dc` / `nt` |
| `order_mode` | text | `inorder` or `overlap` |
| `wise_words` | text[] | `psalms` / `proverbs` |
| `is_active` | bool | a partial unique index allows one active plan per user |

### `reading_schedule`
One row per chapter scheduled on a day — the normalised form of the calendar,
carrying progress.

| column | type | notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users(id)` |
| `plan_id` | uuid | FK → `reading_plans(id)` |
| `day_index` | int | day number within the plan |
| `date` | date | calendar date the day landed on |
| `book` | text | abbreviation as the app uses it |
| `book_name` | text | full name |
| `chapter` | int | |
| `category` | text | `ot` / `dc` / `nt` |
| `position` | int | order within the day |
| `completed` | bool | |
| `completed_at` | timestamptz | |

Unique on `(user_id, plan_id, day_index, position)` rather than on
book + chapter: a day can legitimately schedule the same chapter twice — Psalm
1 as part of the Old Testament run and again as that day's Daily Psalm.

### `verse_collections`
| column | type | notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users(id)` |
| `name` | text | unique per user |

### `saved_verses`
| column | type | notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid | FK → `auth.users(id)` |
| `translation` | text | default `'KJV'` |
| `book` | text | |
| `chapter` | int | |
| `verse` | int | nullable — a whole chapter can be saved |
| `note` | text | the user's private note |
| `collection_id` | uuid | FK → `verse_collections(id)`, null on delete |

## Security

RLS is enabled on all six tables. Each has four policies — select, insert,
update, delete — granted **only to the `authenticated` role**, keyed on
`auth.uid() = user_id` (`= id` for `profiles`). The `anon` role has no policy
and no grant, so an unauthenticated request reads and writes nothing.

`auth.uid()` is wrapped as `(select auth.uid())` so Postgres evaluates it once
per statement rather than once per row.

Two tables carry an extra check on writes, to stop a row being attached to
someone else's parent even though the row itself is correctly owned:

- `reading_schedule` inserts/updates verify `plan_id` belongs to the caller.
- `saved_verses` inserts/updates verify `collection_id` belongs to the caller.

The practical effect: no user can read or modify another user's saved verses,
notes, settings, calendar or reading progress. There is no policy anywhere
that grants cross-user access.

A trigger on `auth.users` creates the `profiles` and `user_settings` rows at
sign-up, so the client never has to handle "no row yet".

### Checking it yourself

In the SQL Editor, with two test accounts:

```sql
-- every table reports rowsecurity = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
order by tablename;

-- every policy is scoped to `authenticated`
select tablename, policyname, roles, cmd from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

Then, signed in as user A in the app, try to read user B's row through the
client — it comes back empty rather than forbidden, which is how RLS filters.

### Service-role key

Nothing in this repository uses it, and nothing in the browser ever should: it
bypasses RLS completely. It is named in `.env.example` only as a warning. If a
future server-side job needs one, keep it in server environment variables and
out of `api/config.js`.
