# Build prompt: "Additional Books" toggles for my Bible reader

You are working inside my existing Bible reading app (mobile-first web/app). First read the codebase: find the Books picker sheet, the reader screen, the translation picker, the data layer that calls API.Bible and HelloAO (Free Use Bible API), and the router/state. **Keep my existing stack, styling tokens, and code conventions.** Do not introduce a new framework or UI library.

## 1. Goal

Today the app shows the 66-book Protestant canon. Add **five optional book collections** that I can switch on and off. When a collection is on, its books appear **inside the normal book list at their traditional canonical position** (for example Tobit sits between Nehemiah and Esther), not dumped after Revelation. When all five are off, the app must behave exactly as it does today.

The five collections:

| Toggle | Short label | Meaning |
|---|---|---|
| Deuterocanonical | DC | Books in Catholic Bibles that Protestants call Apocrypha |
| Orthodox | ORT | Extra books in Greek/Slavonic Orthodox Bibles |
| Ethiopian Orthodox | ETH | Books in the Ethiopian Tewahedo canon (81 books) |
| OT Pseudepigrapha | PSE | Ancient Jewish writings outside every major canon |
| NT Apocrypha | NTA | Early Christian writings outside the NT canon |

## 2. Non-negotiables

- Defaults: all five toggles **off**. Persist the toggle state locally (same storage the app already uses for settings).
- Never scrape the API chapter by chapter to build lists. Use `books.json` or `complete.json` once, cache it, and load chapters on demand.
- API keys (API.Bible) stay server-side or in env vars, never in client code or in this repo.
- Respect licenses. Only ship text that is public domain or explicitly free to use (see section 5).
- Every extra book must look and behave like a normal book: chapters, verse numbers, prev/next, history, search, bookmarks.

## 3. UI (match the existing Books sheet exactly)

The existing Books sheet is a cream bottom sheet with a drag handle, a white circular **X** at top-left, a centered bold **"Books"** title, and a white circular **history (clock)** button at top-right. Below are a white pill search field, a list of bold book names in white rows with thin dividers (current book has a soft blush-pink highlight plus a beige "Ch. N" chip), and a bottom segmented control **Traditional / Alphabetical**.

### 3.1 Header change
Keep X on the left and the title in the center. On the right put **two white circular buttons side by side: history first, then settings (gear icon) immediately to its right** (same size, same thin icon style, about 8-12px gap). Keep the title visually centered (use a fixed-width left and right slot).

### 3.2 Settings overlay: "Additional Books"
Tapping the settings button opens a **second overlay sheet on top of the Books sheet**. Use the same sheet pattern as the Translation picker: dimmed backdrop, cream background, rounded top corners, beige drag handle, swipe-down or tap-outside to close.

- Title: large bold **"Additional Books"** at left. Right side gray label: **"Optional"**.
- Helper line under the title (gray, small): "Turn on extra books. They appear in the book list where they traditionally belong."
- One white rounded card with a soft shadow containing **five rows**, thin dividers between them, same row style as the translation rows:
  - Left: beige rounded label chip (DC, ORT, ETH, PSE, NTA) in bold dark text.
  - Middle: bold name, gray subtitle on the next line.
  - Right: a **toggle switch**. ON = solid black track with white knob (same black as the selected-translation checkmark). OFF = light outlined track with white knob.
  - Below the subtitle, a small gray text button **"Where they go"** with a chevron. Tapping it expands the row to show the placement preview (see 3.4). Expanding must not toggle the switch.
- Rows, subtitles, and what each switch means:
  1. **Deuterocanonical** (DC). Subtitle: "Catholic canon, 7 books plus additions". Adds Tobit, Judith, Additions to Esther, 1 and 2 Maccabees, Wisdom, Sirach, Baruch, Letter of Jeremiah, Prayer of Azariah and Song of the Three, Susanna, Bel and the Dragon.
  2. **Orthodox** (ORT). Subtitle: "Greek and Slavonic Orthodox additions". Adds everything in DC plus 1 Esdras, Prayer of Manasseh, Psalm 151, Odes, 3 Maccabees, 4 Maccabees, 2 Esdras (Latin 4 Ezra).
  3. **Ethiopian Orthodox** (ETH). Subtitle: "The 81-book Tewahedo canon". Adds Jubilees, 1 Enoch, 1-3 Meqabyan, 4 Baruch, Ezra Sutuel (4 Ezra), 1 Esdras, plus the shared DC books Ethiopia uses (Tobit, Judith, Wisdom, Sirach, Baruch, Letter of Jeremiah, Psalm 151, additions to Esther and Daniel), plus the church-order books (Sinodos, Book of the Covenant, Ethiopic Clement, Ethiopic Didascalia). Note: Ethiopia does **not** use 1-2 Maccabees; it uses Meqabyan instead.
  4. **OT Pseudepigrapha** (PSE). Subtitle: "Ancient Jewish writings, not in any canon". Adds 1, 2, 3 Enoch, Jubilees, Life of Adam and Eve, Apocalypse of Abraham, Testament of Abraham, Joseph and Aseneth, Testaments of the Twelve Patriarchs, Letter of Aristeas, Testament of Job, Psalms of Solomon, Ascension of Isaiah, 2 Baruch, 3 Baruch, 4 Baruch, 4 Ezra, Sibylline Oracles.
  5. **NT Apocrypha** (NTA). Subtitle: "Early Christian writings outside the NT". Adds Protevangelium of James, Infancy Gospel of Thomas, Gospels of Thomas, Peter, Mary, Philip, Judas, Acts of Paul, Peter, John, Thomas, 3 Corinthians, Laodiceans, Epistle of Barnabas, 1 and 2 Clement, Didache, Shepherd of Hermas, Apocalypse of Peter.
- Toggles are **independent**. A book may belong to several collections (see the registry). The visible set is the **union** of all ON collections, de-duplicated by book ID. Turning one collection off must not hide a book that another ON collection still includes.
- A collection whose text is not available yet (see section 5) still shows its row, but with that book list marked "Coming soon" in faded gray, same style as the disabled ESV/NIV rows. If a whole collection has no available books, disable the switch and show "We're working on this right now!".
- Footer inside the sheet: small gray note "Extra books may use a different translation than the one you selected. The source is shown above each chapter."
- Haptic tap (if the platform supports it) and a 150ms switch animation. No page reload when toggling; the Books list behind updates live.

### 3.3 Books list with extra books
- Extra books appear inline in **Traditional** order at the anchors in section 4, and inline alphabetically in **Alphabetical** order.
- Mark each extra book with a small beige chip right-aligned before the chapter chip, showing its collection label (use the first matching ON collection by priority DC, ORT, ETH, PSE, NTA). Normal 66 books show no chip.
- If the app has OT / NT section headers, extras stay under the section of their anchor. If there are no headers, add none.
- Search must find extra books by name and common aliases (for example "Ecclesiasticus" for Sirach, "Wisdom of Solomon" for Wisdom, "Henoch" for Enoch, "Kufale" for Jubilees).
- Prev/next chapter arrows in the reader must walk the **merged order**, so the last chapter of Nehemiah goes to Tobit 1 when DC is on.

### 3.4 "Where they go" preview (inside each toggle row)
When expanded, show a compact list: "After Nehemiah: Tobit, Judith" and so on, generated from the registry (not hard-coded text), only for that collection's books.

### 3.5 Reader behavior
- If the chapter text comes from a different source than the selected translation, show a small gray italic line at the top (same style as "A Psalm of David."), for example "Source: World English Bible". 
- If the user turns off a collection while reading one of its books, show a small confirm: "This book will be hidden from the list." On confirm, move to the nearest anchor book's chapter 1 and keep the history entry (history can still open it, with a prompt to turn the collection back on).
- Loading state: skeleton lines in the same serif block layout. Error state: short message plus Retry. Offline: use the cache if present.

## 4. Book registry and placement

Create one data file, for example `extraBooksRegistry` (typed). Each entry:

```
{ id, name, aliases[], collections[], anchorAfter, seq, source, status }
```

- `anchorAfter` is always one of the **66 canonical book IDs** (USFM codes). `seq` orders books that share the same anchor.
- `collections` lists every toggle that includes the book.
- `anchorOverrides` (optional): `[{ whenOn: 'ETH', anchorAfter: '2CH', seq: n }]`. Used so Enoch and Jubilees take the Ethiopian position when ETH is on, and the thematic position otherwise.
- **Merge algorithm:** start with the 66 books in my current order, collect enabled extras, resolve each extra's anchor (apply overrides), group by anchor, sort by `seq`, and insert each group directly after its anchor. Write unit tests for this function.

### Placement table (Old Testament)

| Insert after | In this order (seq 1..n) | Collections |
|---|---|---|
| Genesis (GEN) | Life of Adam and Eve; 1 Enoch; 2 Enoch; 3 Enoch; Jubilees; Apocalypse of Abraham; Testament of Abraham; Joseph and Aseneth; Testaments of the Twelve Patriarchs | PSE (Enoch and Jubilees also ETH, see override) |
| Deuteronomy (DEU) | Letter of Aristeas | PSE |
| 2 Chronicles (2CH) | Prayer of Manasseh; 1 Esdras; Jubilees (ETH override); 1 Enoch (ETH override) | ORT; ORT and ETH; ETH |
| Nehemiah (NEH) | 4 Ezra (2 Esdras); Tobit; Judith | ORT, ETH, PSE; DC, ORT, ETH |
| Esther (EST) | Additions to Esther; 1 Maccabees; 2 Maccabees; 3 Maccabees; 4 Maccabees; 1 Meqabyan; 2 Meqabyan; 3 Meqabyan | DC, ORT, ETH; 1-2 Macc: DC, ORT; 3-4 Macc: ORT; Meqabyan: ETH |
| Job (JOB) | Testament of Job | PSE |
| Psalms (PSA) | Psalm 151; Odes; Psalms of Solomon | 151: ORT, ETH; Odes: ORT; PsSol: PSE |
| Song of Solomon (SNG) | Wisdom of Solomon; Sirach | DC, ORT, ETH |
| Isaiah (ISA) | Ascension of Isaiah | PSE |
| Lamentations (LAM) | Baruch; Letter of Jeremiah; 4 Baruch; 2 Baruch; 3 Baruch | Baruch and Letter: DC, ORT, ETH; 4 Baruch: ETH, PSE; 2-3 Baruch: PSE |
| Daniel (DAN) | Prayer of Azariah and Song of the Three; Susanna; Bel and the Dragon | DC, ORT, ETH |
| Malachi (MAL) | Sibylline Oracles | PSE |

Notes: Tobit and Judith sit **before** Esther, and the Maccabees **after** it, as in Catholic Bibles. Wisdom and Sirach sit after Song of Solomon. Baruch follows Lamentations. Daniel's additions are separate entries right after Daniel (Susanna and Bel are Daniel 13 and 14 in Catholic Bibles).

### Placement table (New Testament)

| Insert after | In this order | Collection |
|---|---|---|
| John (JHN) | Protevangelium of James; Infancy Gospel of Thomas; Gospel of Thomas; Gospel of Peter; Gospel of Mary; Gospel of Philip; Gospel of Judas | NTA |
| Acts (ACT) | Acts of Paul; Acts of Peter; Acts of John; Acts of Thomas | NTA |
| 2 Corinthians (2CO) | 3 Corinthians | NTA |
| Colossians (COL) | Letter to the Laodiceans (from Colossians 4:16) | NTA |
| Revelation (REV) | Ethiopic church-order books (Sinodos, Book of the Covenant, Ethiopic Clement, Ethiopic Didascalia); Epistle of Barnabas; Shepherd of Hermas; 1 Clement; 2 Clement; Didache; Apocalypse of Peter | Church order: ETH; the rest: NTA |

Reasoning for the end-of-NT group: Codex Sinaiticus and Codex Alexandrinus both carried Barnabas, Hermas and the Clementine letters after Revelation.

If a placement looks wrong against a tradition's own book list, keep the table as the single source of truth and fix it in the registry only.

## 5. Data sources (find, verify, then wire up)

Always **discover at runtime** rather than hard-coding translation IDs, because catalogs change. Verify each endpoint with a real request before relying on it, and record what you found in `docs/extra-books-sources.md`.

### 5.1 Free Use Bible API (HelloAO), no key, already integrated
- Base: `https://bible.helloao.org/api/`
- `available_translations.json` lists translations; each has `numberOfBooks`. **Translations with more than 66 books contain extra books.**
- `{translation}/books.json`: book list. `{translation}/{BOOK}/{chapter}.json`: one chapter. `{translation}/complete.json`: the full translation (about 7 MB for a 66-book Bible, so cache it and prefer it for the first load of extra books).
- The complete-translation book objects carry an optional `isApocryphal` flag, and each book has `id` (USFM), `name`, `commonName`, `order`, `numberOfChapters`.
- Chapter content items are `heading`, `line_break`, `verse` (strings, formatted text with optional `poem` indent, footnote refs `noteId`), and `hebrew_subtitle`. Footnotes live in `chapter.footnotes`. Reuse the renderer you already have.
- Expected USFM IDs for extras (verify against `books.json`): TOB, JDT, ESG, WIS, SIR, BAR, LJE, S3Y, SUS, BEL, 1MA, 2MA, 3MA, 4MA, 1ES, 2ES, MAN, PS2, ODA, PSS, LAO, 4BA, JUB, ENO, 1MQ, 2MQ, 3MQ.
- Look for: a World English Bible edition **with deuterocanon**, and a Septuagint translation (Brenton) for the Orthodox-only books.
- License: HelloAO returns a `licenseUrl` per translation. Show it in an About or Sources screen.

### 5.2 API.Bible (American Bible Society), key required, already integrated
- Base `https://rest.api.bible/v1`, header `api-key`.
- Call `/v1/bibles` and then `/v1/bibles/{bibleId}/books` to find any Bible whose book IDs include Apocrypha codes (TOB, JDT, WIS, SIR, BAR, 1MA, 2MA and similar). Use it as a **fallback** when HelloAO lacks a book, and only for Bibles your key can access and whose license allows it.

### 5.3 eBible.org (public-domain downloads)
- The **World English Bible with Deuterocanon** (and the British Edition) is public domain and downloadable from eBible.org (see each translation's "More formats" page for USFM or other formats). Use it to fill gaps and to build static JSON if HelloAO does not carry it.
- The name "World English Bible" is a trademark: if you change the text, you must not label it as WEB.

### 5.4 No API exists: self-host static JSON
For Ethiopian-only books, the Pseudepigrapha, and the NT Apocrypha, build **static JSON files in the same shape as HelloAO chapters** (`/extra-books/{translationId}/{BOOK}/{chapter}.json` plus a `books.json`). Generate them with a one-off script (`scripts/build-extra-books.*`) from public-domain sources:
- R. H. Charles, *The Apocrypha and Pseudepigrapha of the Old Testament* (1913): Jubilees, Enoch, Testaments of the Twelve Patriarchs, 2 Baruch, 3 Baruch, Psalms of Solomon, Ascension of Isaiah, Letter of Aristeas, Life of Adam and Eve, and others.
- Wikisource and Project Gutenberg, for Enoch, Jubilees, Meqabyan and other public-domain translations. Check the edition's date on each page.
- *Ante-Nicene Fathers* (Roberts-Donaldson translations): Barnabas, 1 and 2 Clement, Hermas, Didache, Apocalypse of Peter, and the apocryphal Gospels and Acts.
- M. R. James, *The Apocryphal New Testament* (1924).
- For each book record: `translation`, `translator`, `year`, `sourceUrl`, `license`. **If a modern translation is under copyright (for example some Gospel of Thomas and Gospel of Judas translations), do not include it.** Set `status: "coming_soon"` and move on.
- Chapter and verse division: keep the source's numbering. If a source has no verses, number paragraphs as verses so the reader works.

### 5.5 Source resolver
For each extra book, try sources in this order and use the first that has it:
1. The translation the user selected, if it contains the book (for example WEB with deuterocanon).
2. The default extras source from the registry (HelloAO WEB-with-deuterocanon, then Brenton LXX).
3. API.Bible apocrypha-capable Bible.
4. Self-hosted static JSON.
Return `{ text, sourceName, licenseUrl }`. The reader shows `sourceName` (3.5).

### 5.6 Caching
Cache `books.json`, `complete.json` (or chapters) in the app's existing cache (IndexedDB or similar). Key by translation and version. Add stale-while-revalidate. A toggle switch should prefetch only that collection's book lists, not whole Bibles, unless using `complete.json` once.

## 6. Edge cases to handle
- A book exists in two sources with different chapter counts (Greek Esther versus Hebrew Esther plus additions): show the additions as the separate "Additions to Esther" entry and keep Esther itself unchanged.
- Psalm 151 and Odes have one chapter or irregular chapters: support single-chapter books and the existing "Ch." chip.
- Duplicate IDs across collections: de-duplicate by `id`.
- History and bookmarks that reference a hidden book: keep them, with a "Turn on [collection]" prompt.
- RTL is not needed for these English texts, but keep `textDirection` support from the API.
- Accessibility: switches have labels ("Deuterocanonical, on"), 44px touch targets, visible focus, dynamic text size works with the existing Aa setting.

## 7. Deliverables
1. The settings button and the "Additional Books" overlay, matching section 3.
2. Registry file, merge function with tests, and the placement table implemented exactly as in section 4.
3. Source resolver, cache layer, and the static-extras build script with a sample output for at least Tobit, 1 Enoch and the Didache.
4. `docs/extra-books-sources.md` listing every verified endpoint, translation ID found, license, and any book marked coming soon.
5. A short summary of what you changed, which toggles are fully populated today, and which are partial.

## 8. Acceptance checklist
- [ ] All toggles off gives the same book list and reader as before.
- [ ] DC on: Tobit and Judith between Nehemiah and Esther; 1-2 Maccabees right after Esther; Wisdom and Sirach after Song of Solomon; Baruch after Lamentations; Daniel additions after Daniel.
- [ ] ETH on without DC: no Maccabees, but Meqabyan after Esther and Jubilees and Enoch after 2 Chronicles.
- [ ] PSE on without ETH: Enoch and Jubilees directly after Genesis.
- [ ] NTA on: Laodiceans after Colossians, 3 Corinthians after 2 Corinthians, Gospels group after John.
- [ ] Next/previous chapter crosses between normal and extra books correctly.
- [ ] Unavailable books show as "Coming soon", never as a broken page.
- [ ] Source line appears when the text differs from the selected translation.
