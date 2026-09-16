# Authentication & data access — integration guide

Everything you need to read the current user and their data. You should not
need to touch `auth.js`, `data.js` or the Supabase SDK directly.

## The five things you'll want

```js
await window.BiblePlanAuth.ready();      // wait for the stored session
const user    = window.BiblePlanAuth.getUser();       // user object or null
const userId  = window.BiblePlanAuth.getUserId();     // uuid string or null
const session = window.BiblePlanAuth.getSession();    // { access_token, ... } or null
const client  = window.BiblePlanAuth.getClient();     // Supabase client or null
```

`ready()` resolves once the session persisted in this browser has been
restored, so call it before you read `getUser()` on page load. Afterwards the
getters are synchronous and always current.

## Reacting to sign in / sign out

```js
const unsubscribe = window.BiblePlanAuth.onChange((state) => {
  if (!state.isSignedIn) return renderSignedOut();
  renderFor(state.userId, state.profile);
});
```

The handler fires immediately with the current state and again on every
change. `state` is:

| field           | meaning                                              |
| --------------- | ---------------------------------------------------- |
| `isConfigured`  | this deployment has a Supabase project                |
| `isSignedIn`    | there is a live session                               |
| `user`          | Supabase user (`email`, `id`, `user_metadata`, …)     |
| `userId`        | the uuid to use as `user_id` on writes                |
| `session`       | access token and expiry                              |
| `profile`       | row from `profiles` (`display_name`, `avatar_url`)    |
| `recoveryMode`  | user arrived via a password-reset link                |

Keep the returned function and call it when your view is torn down.

## Reading and writing user data

Use `window.BiblePlanData`. Every method waits for auth, refuses to run when
signed out, stamps `user_id` from the session, and resolves to
`{ data, error }` — it never throws.

```js
// Saved verses
const { data, error } = await window.BiblePlanData.listSavedVerses();
await window.BiblePlanData.saveVerse({
  book: "John", chapter: 3, verse: 16,
  note: "memorise", translation: "KJV"
});
await window.BiblePlanData.updateSavedVerse(id, { note: "done" });
await window.BiblePlanData.deleteSavedVerse(id);

// Collections
await window.BiblePlanData.createCollection("Comfort");
const { data: collections } = await window.BiblePlanData.listCollections();

// Settings
const { data: settings } = await window.BiblePlanData.getSettings();
await window.BiblePlanData.saveSettings({ translation: "ESV" });
await window.BiblePlanData.mergePreferences({ fontSize: "large" });

// Plans and schedule
const { data: plan } = await window.BiblePlanData.getActivePlan();
const { data: rows } = await window.BiblePlanData.getSchedule(plan.id);
await window.BiblePlanData.setEntryCompleted({
  planId: plan.id, dayIndex: 3, book: "Genesis", chapter: 7, completed: true
});
```

Always branch on `error`:

```js
const { data, error } = await window.BiblePlanData.listSavedVerses();
if (error) return showMessage(error.message);
render(data);
```

Common `error.message` values worth handling by name:
`"Not signed in."` and `"Supabase is not configured for this deployment."`

## If you need a raw query

`window.BiblePlanAuth.getClient()` returns the shared Supabase client. If you
use it, filter by the user yourself as well — RLS will stop a cross-user read
regardless, but an explicit filter keeps the intent obvious:

```js
const client = window.BiblePlanAuth.getClient();
const userId = window.BiblePlanAuth.getUserId();
const { data } = await client
  .from("saved_verses").select("*").eq("user_id", userId);
```

Never create a second Supabase client. One client per page keeps a single
session and one token-refresh timer.

## The app bridge

`script.js` exposes a deliberately narrow bridge, used by the sync layer:

```js
window.BiblePlanApp.getState();           // deep copy of { calendarDays, settings }
window.BiblePlanApp.replaceState(next);   // adopt a plan wholesale
window.BiblePlanApp.onStateChange(fn);    // fires after every save; returns unsubscribe
window.BiblePlanApp.getBookCategory(name);// "ot" | "dc" | "nt" | null
window.BiblePlanApp.showPage("account");  // "calendar" | "bible" | "save" | "account"
window.BiblePlanApp.storageKey;           // localStorage key for the offline copy
```

`getState()` hands back a copy. To change the plan, change it through the app's
own UI or `replaceState` — do not mutate the copy and expect it to stick.

## Sync status

`window.BiblePlanSync` reports what the cross-device sync is doing:

```js
window.BiblePlanSync.onStatus(({ state, message }) => { /* idle|syncing|synced|error */ });
window.BiblePlanSync.getActivePlanId();
await window.BiblePlanSync.pushNow();   // upload this browser's plan
await window.BiblePlanSync.pullNow();   // adopt the account's plan
```

## Signed-out behaviour

The app works fully signed out — the plan lives in `localStorage`, exactly as
before. Anything you build should degrade the same way: check `isSignedIn`
and fall back rather than blocking the UI behind an account.

When someone signs in, sync pulls the account's plan if there is one, and
otherwise pushes whatever is in this browser. Remote wins on sign-in.

## Types

`types/bible-plan.d.ts` declares all of the above. Editors pick it up with no
imports, so `BiblePlanData.` autocompletes. New files should start with
`// @ts-check` so `npm run typecheck` covers them.
