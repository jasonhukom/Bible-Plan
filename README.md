# Bible Plan

A personal, offline-friendly daily Bible reading calendar. Built as plain
HTML/CSS/JS (no build step, no framework) so it can be opened directly or
hosted for free on GitHub Pages.

## Features

- **121-day reading calendar** (Sep 1 – Dec 30, 2026), generated from
  `bibleplan.csv` — one card per day with that day's passages and an
  approximate verse count.
- **Check / skip on every day.** ✓ marks a day as read (even
  retroactively, if you forget to check it off on the actual day). ✕
  opens a small "push forward" choice — pick 1, 2, or 4 days and that
  reading, plus everything scheduled after it, moves later to make room.
  The day you skipped just becomes a quiet rest day on the calendar.
- **Drag to reorder.** Grab the handle on the left of any day and drop
  it somewhere else if you'd rather read a different day's passages
  today.
- **Days you didn't respond to turn gray automatically** once they're in
  the past, so it's obvious what needs a decision — but the ✓ / ✕
  buttons stay right there so you can resolve it.
- **Saved automatically in your browser** (`localStorage`), so closing
  the tab or restarting your phone doesn't lose your progress. Nothing
  is sent to a server — it's just you and your browser.
- **A live clock**, a progress bar (days and verses read), and a short
  quote shown one at a time, in order, every time you open the page —
  100 in total, half short KJV verses about Scripture and half original
  one-line encouragement.

## Using it

Just open `index.html` in a browser — everything works from the file
directly, no server needed. Or turn on **GitHub Pages** for this repo
(Settings → Pages → Deploy from branch → `main` → `/ (root)`) to get a
shareable URL you can add to your phone's home screen.

## Extending the plan

The reading data lives in `readings-data.js` as the original CSV text
(see `bibleplan.csv` for the source). Once you have the next stretch of
the year, add the new rows to the end of that CSV-formatted string —
same three-column `"Date","Passage","Verses"` format, staying in
consecutive-day order — and reload the page. No other file needs to
change; the calendar length and the "today" position are both worked
out automatically from the data.

## Files

| File                | What it is |
|---------------------|------------|
| `index.html`        | Page structure |
| `style.css`         | All styling |
| `script.js`         | App logic: state, rendering, drag-and-drop, clock, quotes |
| `readings-data.js`  | The reading plan (generated from `bibleplan.csv`) |
| `quotes-data.js`    | The 100 quotes |
| `bibleplan.csv`     | Original source data, kept for reference/editing |

Drag-and-drop is powered by the small [SortableJS](https://github.com/SortableJS/Sortable)
library, loaded from a CDN. Everything else is dependency-free.
