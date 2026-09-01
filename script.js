/*
===============================================================================
Bible Plan - script.js
-------------------------------------------------------------------------------
Uses:
  - readings-data.js -> READINGS
  - quotes-data.js   -> QUOTES

Main features:
  - Real monthly calendar
  - Separate Bible books inside every day
  - Separate chapters inside every book
  - Chapter-level completion
  - Book-level checkbox with indeterminate state
  - Drag books between dates
  - Drag chapters between dates
  - Drag chapters between books
  - Reorder books inside a day
  - Reorder chapters inside a book
  - Mobile-friendly move buttons
  - Missed days automatically turn gray
  - No automatic shifting
  - Late completion is supported
  - Persistent localStorage state
  - Live clock
  - Rotating quotes from quotes-data.js
  - Previous / next month navigation
  - Jump to today
===============================================================================
*/

(() => {
  "use strict";

  /* ==========================================================================
     CONFIG
     ========================================================================== */

  const STORAGE_KEY = "biblePlan.calendar.v4";

  /*
    This is only used when the old app has never been initialized.
    Your actual dates come from READINGS.
  */
  const FALLBACK_START_DATE = "2026-09-01";


  /* ==========================================================================
     DOM
     ========================================================================== */

  const grid = document.getElementById("calendarGrid");
  const monthTitle = document.getElementById("monthTitle");

  const quoteText = document.getElementById("quoteText");
  const quoteSource = document.getElementById("quoteSource");

  const clockDate = document.getElementById("clockDate");
  const clockTime = document.getElementById("clockTime");

  const progressCount = document.getElementById("progressCount");
  const progressVerses = document.getElementById("progressVerses");
  const progressFill = document.getElementById("progressFill");

  const planStartInput = document.getElementById("planStart");
  const csvInput = document.getElementById("csvInput");

  const toast = document.getElementById("toast");

  const moveDialog = document.getElementById("moveDialog");
  const moveDialogTitle = document.getElementById("moveDialogTitle");
  const moveDialogDescription =
    document.getElementById("moveDialogDescription");
  const moveDateInput = document.getElementById("moveDateInput");


  /* ==========================================================================
     SAFETY
     ========================================================================== */

  if (!grid) {
    console.error(
      "Bible Plan: #calendarGrid was not found."
    );
    return;
  }

  if (
    typeof READINGS === "undefined" ||
    !Array.isArray(READINGS)
  ) {
    console.error(
      "Bible Plan: readings-data.js did not load READINGS."
    );
    return;
  }

  if (
    typeof QUOTES === "undefined" ||
    !Array.isArray(QUOTES)
  ) {
    console.error(
      "Bible Plan: quotes-data.js did not load QUOTES."
    );
    return;
  }


  /* ==========================================================================
     BIBLE BOOK NAME NORMALIZATION
     ========================================================================== */

  /*
    Your readings-data.js contains abbreviations such as:

      Gen
      Mat
      Ps
      Pro
      Josh
      Jdg
      Rut
      1 Sa
      1 Kgs
      John
      Luk
      Phil
      Sos
      Joe
      Amo
      Oba

    This map deliberately supports both your existing abbreviations and
    common alternatives.
  */

  const BOOK_ALIASES = {
    "gen": "Genesis",
    "genesis": "Genesis",

    "ex": "Exodus",
    "exod": "Exodus",
    "exodus": "Exodus",

    "lev": "Leviticus",
    "leviticus": "Leviticus",

    "num": "Numbers",
    "numbers": "Numbers",

    "deut": "Deuteronomy",
    "deuteronomy": "Deuteronomy",

    "jos": "Joshua",
    "josh": "Joshua",
    "joshua": "Joshua",

    "judg": "Judges",
    "jdg": "Judges",
    "judges": "Judges",

    "ruth": "Ruth",
    "rut": "Ruth",

    "1 sa": "1 Samuel",
    "1 sam": "1 Samuel",
    "1 samuel": "1 Samuel",

    "2 sa": "2 Samuel",
    "2 sam": "2 Samuel",
    "2 samuel": "2 Samuel",

    "1 ki": "1 Kings",
    "1 kgs": "1 Kings",
    "1 kings": "1 Kings",

    "2 ki": "2 Kings",
    "2 kgs": "2 Kings",
    "2 kings": "2 Kings",

    "1 ch": "1 Chronicles",
    "1 chr": "1 Chronicles",
    "1 chronicles": "1 Chronicles",

    "2 ch": "2 Chronicles",
    "2 chr": "2 Chronicles",
    "2 chronicles": "2 Chronicles",

    "ezr": "Ezra",
    "ezra": "Ezra",

    "neh": "Nehemiah",
    "nehemiah": "Nehemiah",

    "est": "Esther",
    "esther": "Esther",

    "job": "Job",

    "ps": "Psalms",
    "psalm": "Psalms",
    "psalms": "Psalms",

    "pro": "Proverbs",
    "prov": "Proverbs",
    "proverbs": "Proverbs",

    "ecc": "Ecclesiastes",
    "eccl": "Ecclesiastes",
    "ecclesiastes": "Ecclesiastes",

    "song": "Song of Solomon",
    "sos": "Song of Solomon",
    "song of solomon": "Song of Solomon",

    "isa": "Isaiah",
    "isaiah": "Isaiah",

    "jer": "Jeremiah",
    "jeremiah": "Jeremiah",

    "lam": "Lamentations",
    "lamentations": "Lamentations",

    "eze": "Ezekiel",
    "ezek": "Ezekiel",
    "ezekiel": "Ezekiel",

    "dan": "Daniel",
    "daniel": "Daniel",

    "hos": "Hosea",
    "hosea": "Hosea",

    "joe": "Joel",
    "joel": "Joel",

    "amo": "Amos",
    "amos": "Amos",

    "ob": "Obadiah",
    "oba": "Obadiah",
    "obadiah": "Obadiah",

    "jon": "Jonah",
    "jonah": "Jonah",

    "mic": "Micah",
    "micah": "Micah",

    "nah": "Nahum",
    "nahum": "Nahum",

    "hab": "Habakkuk",
    "habakkuk": "Habakkuk",

    "zep": "Zephaniah",
    "zeph": "Zephaniah",
    "zephaniah": "Zephaniah",

    "hag": "Haggai",
    "haggai": "Haggai",

    "zec": "Zechariah",
    "zech": "Zechariah",
    "zechariah": "Zechariah",

    "mal": "Malachi",
    "malachi": "Malachi",

    "mat": "Matthew",
    "matt": "Matthew",
    "matthew": "Matthew",

    "mk": "Mark",
    "mar": "Mark",
    "mark": "Mark",

    "lk": "Luke",
    "luk": "Luke",
    "luke": "Luke",

    "jn": "John",
    "john": "John",

    "act": "Acts",
    "acts": "Acts",

    "rom": "Romans",
    "romans": "Romans",

    "1 co": "1 Corinthians",
    "1 cor": "1 Corinthians",
    "1 corinthians": "1 Corinthians",

    "2 co": "2 Corinthians",
    "2 cor": "2 Corinthians",
    "2 corinthians": "2 Corinthians",

    "gal": "Galatians",
    "galatians": "Galatians",

    "eph": "Ephesians",
    "ephesians": "Ephesians",

    "php": "Philippians",
    "phil": "Philippians",
    "philippians": "Philippians",

    "col": "Colossians",
    "colossians": "Colossians",

    "1 th": "1 Thessalonians",
    "1 thes": "1 Thessalonians",
    "1 thessalonians": "1 Thessalonians",

    "2 th": "2 Thessalonians",
    "2 thes": "2 Thessalonians",
    "2 thessalonians": "2 Thessalonians",

    "1 ti": "1 Timothy",
    "1 tim": "1 Timothy",
    "1 timothy": "1 Timothy",

    "2 ti": "2 Timothy",
    "2 tim": "2 Timothy",
    "2 timothy": "2 Timothy",

    "tit": "Titus",
    "titus": "Titus",

    "phm": "Philemon",
    "philemon": "Philemon",

    "heb": "Hebrews",
    "hebrews": "Hebrews",

    "jam": "James",
    "jas": "James",
    "james": "James",

    "1 pe": "1 Peter",
    "1 pet": "1 Peter",
    "1 peter": "1 Peter",

    "2 pe": "2 Peter",
    "2 pet": "2 Peter",
    "2 peter": "2 Peter",

    "1 jn": "1 John",
    "1 john": "1 John",

    "2 jn": "2 John",
    "2 john": "2 John",

    "3 jn": "3 John",
    "3 john": "3 John",

    "jude": "Jude",

    "rev": "Revelation",
    "revelation": "Revelation"
  };


  /* ==========================================================================
     HELPERS
     ========================================================================== */

  function uid(prefix) {
    return (
      prefix +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }


  function escapeHTML(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
  }


  function localDateFromISO(iso) {
    const parts =
      String(iso)
        .split("-")
        .map(Number);

    if (
      parts.length !== 3 ||
      parts.some(
        number => Number.isNaN(number)
      )
    ) {
      return new Date();
    }

    return new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    );
  }


  function isoFromDate(date) {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function firstOfMonth(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );
  }


  function lastOfMonth(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    );
  }


  function addDays(date, amount) {
    const result =
      new Date(
        date.getTime()
      );

    result.setDate(
      result.getDate() + amount
    );

    return result;
  }


  function startOfToday() {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }


  function isSameDate(a, b) {
    return (
      isoFromDate(a) ===
      isoFromDate(b)
    );
  }


  function isValidISODate(value) {
    const parts =
      String(value)
        .split("-")
        .map(Number);

    if (
      parts.length !== 3 ||
      parts.some(
        value => Number.isNaN(value)
      )
    ) {
      return false;
    }

    const date =
      new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
      );

    return (
      date.getFullYear() === parts[0] &&
      date.getMonth() === parts[1] - 1 &&
      date.getDate() === parts[2]
    );
  }


  function canonicalDate(value) {
    return isValidISODate(value)
      ? isoFromDate(
          localDateFromISO(value)
        )
      : "";
  }


  function normalizeBookName(value) {
    const original =
      String(value).trim();

    const normalized =
      original.toLowerCase();

    return (
      BOOK_ALIASES[normalized] ||
      original
    );
  }


  /* ==========================================================================
     READING PARSER
     ========================================================================== */

  function parsePassageParts(passage) {

    return String(passage)
      .split(";")
      .map(
        item => item.trim()
      )
      .filter(Boolean);
  }


  function parseBookAndRange(part) {

    /*
      Examples:

        Gen 1-7
        Mat 1-2
        Ps 1
        Pro 1
        1 Sa 1-2
        1 Kgs 1-8
        Phlm
        2 Jn
        Jude
    */

    const text =
      String(part).trim();


    const match =
      text.match(
        /^(.*?)\s+(\d+)(?:\s*[-–]\s*(\d+))?$/
      );


    if (!match) {

      /*
        Some books may appear without an explicit
        chapter because there is only one chapter.

        Example:
          Oba
          Phlm
          Jude
          3 Jn

        For those, treat them as chapter 1.
      */

      const book =
        normalizeBookName(text);

      if (!book) {
        return null;
      }

      return {
        book,
        start: 1,
        end: 1
      };
    }


    const book =
      normalizeBookName(
        match[1]
      );


    let start =
      Number(match[2]);

    let end =
      match[3]
        ? Number(match[3])
        : start;


    if (
      !book ||
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      return null;
    }


    if (end < start) {
      [start, end] =
        [end, start];
    }


    return {
      book,
      start,
      end
    };
  }


  /* ==========================================================================
     CREATE STRUCTURED DAY
     ========================================================================== */

  function buildDayFromReading(reading) {

    const day = {
      date: reading.date,
      metadata:
        reading.verses ??
        "",
      books: []
    };


    const groups =
      new Map();


    for (
      const part
      of parsePassageParts(
        reading.passage
      )
    ) {

      const parsed =
        parseBookAndRange(
          part
        );


      if (!parsed) {
        continue;
      }


      if (
        !groups.has(
          parsed.book
        )
      ) {
        groups.set(
          parsed.book,
          []
        );
      }


      const chapters =
        groups.get(
          parsed.book
        );


      for (
        let number =
          parsed.start;
        number <=
          parsed.end;
        number++
      ) {

        if (
          !chapters.includes(
            number
          )
        ) {
          chapters.push(
            number
          );
        }
      }
    }


    for (
      const [
        bookName,
        chapterNumbers
      ]
      of groups.entries()
    ) {

      day.books.push({
        id:
          uid("book"),
        book:
          bookName,
        expanded:
          false,

        chapters:
          chapterNumbers.map(
            number => ({
              id:
                uid("chapter"),
              number,
              completed:
                false
            })
          )
      });
    }


    return day;
  }


  /* ==========================================================================
     DEFAULT STATE
     ========================================================================== */

  function createDefaultState() {

    const days = {};

    for (
      const reading
      of READINGS
    ) {

      if (
        !reading ||
        !reading.date ||
        !reading.passage
      ) {
        continue;
      }


      const date =
        canonicalDate(
          reading.date
        );


      if (!date) {
        continue;
      }


      days[date] =
        buildDayFromReading(
          reading
        );
    }


    return {
      version: 4,

      days,

      quoteIndex:
        Math.floor(
          Math.random() *
          Math.max(
            1,
            QUOTES.length
          )
        ),

      imported: false
    };
  }


  /* ==========================================================================
     LOAD STATE
     ========================================================================== */

  let state =
    loadState();


  function loadState() {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (!saved) {
        return createDefaultState();
      }


      const parsed =
        JSON.parse(
          saved
        );


      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.days
      ) {
        return createDefaultState();
      }


      repairState(
        parsed
      );


      return parsed;

    } catch (error) {

      console.warn(
        "Bible Plan: could not load saved state.",
        error
      );

      return createDefaultState();
    }
  }


  /* ==========================================================================
     REPAIR SAVED STATE
     ========================================================================== */

  function repairState(saved) {

    saved.version = 4;


    if (
      typeof saved.days !== "object" ||
      saved.days === null
    ) {
      saved.days = {};
    }


    for (
      const [
        date,
        day
      ]
      of Object.entries(
        saved.days
      )
    ) {

      if (
        !day ||
        typeof day !== "object"
      ) {
        delete saved.days[date];
        continue;
      }


      day.date =
        date;


      if (
        !Array.isArray(
          day.books
        )
      ) {
        day.books = [];
      }


      day.books =
        day.books.filter(
          book =>
            book &&
            typeof book === "object"
        );


      for (
        const book
        of day.books
      ) {

        if (!book.id) {
          book.id =
            uid("book");
        }


        if (
          typeof book.book !== "string"
        ) {
          book.book =
            "Unknown";
        }


        book.book =
          normalizeBookName(
            book.book
          );


        book.expanded =
          Boolean(
            book.expanded
          );


        if (
          !Array.isArray(
            book.chapters
          )
        ) {
          book.chapters = [];
        }


        for (
          const chapter
          of book.chapters
        ) {

          if (!chapter.id) {
            chapter.id =
              uid("chapter");
          }


          chapter.number =
            Number(
              chapter.number
            ) || 1;


          chapter.completed =
            Boolean(
              chapter.completed
            );
        }
      }
    }


    if (
      !Number.isInteger(
        saved.quoteIndex
      )
    ) {
      saved.quoteIndex = 0;
    }
  }


  /* ==========================================================================
     SAVE
     ========================================================================== */

  function saveState() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          state
        )
      );

    } catch (error) {

      console.error(
        "Bible Plan: failed to save state.",
        error
      );

      showToast(
        "Could not save changes."
      );
    }
  }


  /* ==========================================================================
     DAY / BOOK / CHAPTER LOOKUPS
     ========================================================================== */

  function getDay(date) {
    return state.days[date] || null;
  }


  function getBook(
    date,
    bookId
  ) {

    const day =
      getDay(date);

    if (!day) {
      return null;
    }


    return (
      day.books.find(
        book =>
          book.id ===
          bookId
      ) || null
    );
  }


  function getChapter(
    date,
    bookId,
    chapterId
  ) {

    const book =
      getBook(
        date,
        bookId
      );


    if (!book) {
      return null;
    }


    return (
      book.chapters.find(
        chapter =>
          chapter.id ===
          chapterId
      ) || null
    );
  }


  /* ==========================================================================
     BOOK STATES
     ========================================================================== */

  function isBookComplete(book) {

    return (
      book.chapters.length > 0 &&
      book.chapters.every(
        chapter =>
          chapter.completed
      )
    );
  }


  function isBookPartial(book) {

    let completed = 0;


    for (
      const chapter
      of book.chapters
    ) {

      if (
        chapter.completed
      ) {
        completed++;
      }
    }


    return (
      completed > 0 &&
      completed <
        book.chapters.length
    );
  }


  function isDayComplete(day) {

    if (
      !day ||
      !day.books.length
    ) {
      return false;
    }


    return day.books.every(
      book =>
        isBookComplete(
          book
        )
    );
  }


  function isDayMissed(
    date,
    day
  ) {

    if (
      !day ||
      !day.books.length
    ) {
      return false;
    }


    const dayDate =
      localDateFromISO(
        date
      );


    const today =
      startOfToday();


    if (
      dayDate >= today
    ) {
      return false;
    }


    return !isDayComplete(
      day
    );
  }


  /* ==========================================================================
     TOGGLE CHAPTER
     ========================================================================== */

  function toggleChapter(
    date,
    bookId,
    chapterId
  ) {

    const chapter =
      getChapter(
        date,
        bookId,
        chapterId
      );


    if (!chapter) {
      return;
    }


    chapter.completed =
      !chapter.completed;


    saveState();

    render();
  }


  /* ==========================================================================
     TOGGLE WHOLE BOOK
     ========================================================================== */

  function toggleBook(
    date,
    bookId
  ) {

    const book =
      getBook(
        date,
        bookId
      );


    if (!book) {
      return;
    }


    const shouldComplete =
      !isBookComplete(
        book
      );


    for (
      const chapter
      of book.chapters
    ) {

      chapter.completed =
        shouldComplete;
    }


    saveState();

    render();
  }


  /* ==========================================================================
     EXPAND / COLLAPSE BOOK
     ========================================================================== */

  function toggleBookExpanded(
    date,
    bookId
  ) {

    const book =
      getBook(
        date,
        bookId
      );


    if (!book) {
      return;
    }


    book.expanded =
      !book.expanded;


    saveState();

    render();
  }


  /* ==========================================================================
     MOVE BOOK
     ========================================================================== */

  function moveBook(
    sourceDate,
    bookId,
    targetDate,
    targetBookId = null
  ) {

    const sourceDay =
      getDay(
        sourceDate
      );


    if (!sourceDay) {
      return;
    }


    const sourceIndex =
      sourceDay.books.findIndex(
        book =>
          book.id ===
          bookId
      );


    if (
      sourceIndex === -1
    ) {
      return;
    }


    const [
      movedBook
    ] =
      sourceDay.books.splice(
        sourceIndex,
        1
      );


    const targetDay =
      ensureDay(
        targetDate
      );


    /*
      If the user dropped a book on another book,
      put it immediately after that book.
    */

    if (targetBookId) {

      const targetIndex =
        targetDay.books.findIndex(
          book =>
            book.id ===
            targetBookId
        );


      if (
        targetIndex >= 0 &&
        targetDay !== sourceDay
      ) {

        targetDay.books.splice(
          targetIndex + 1,
          0,
          movedBook
        );

      } else if (
        targetIndex >= 0
      ) {

        /*
          Same-day reorder.
        */

        targetDay.books.splice(
          targetIndex,
          0,
          movedBook
        );

      } else {

        targetDay.books.push(
          movedBook
        );
      }

    } else {

      /*
        If another copy of this Bible book already exists on the target day,
        merge chapters instead of creating duplicate book cards.
      */

      const existingBook =
        targetDay.books.find(
          book =>
            book.book ===
            movedBook.book
        );


      if (
        existingBook &&
        existingBook.id !==
          movedBook.id
      ) {

        for (
          const chapter
          of movedBook.chapters
        ) {

          const alreadyThere =
            existingBook.chapters.some(
              existing =>
                Number(
                  existing.number
                ) ===
                Number(
                  chapter.number
                )
            );


          if (!alreadyThere) {

            existingBook.chapters.push(
              chapter
            );
          }
        }


        existingBook.expanded =
          existingBook.expanded ||
          movedBook.expanded;

      } else {

        targetDay.books.push(
          movedBook
        );
      }
    }


    cleanupEmptyDays();

    saveState();

    render();

    showToast(
      `${movedBook.book} moved to ${formatPrettyDate(targetDate)}.`
    );
  }


  /* ==========================================================================
     MOVE CHAPTER
     ========================================================================== */

  function moveChapter(
    sourceDate,
    sourceBookId,
    chapterId,
    targetDate,
    targetBookId = null,
    targetChapterId = null
  ) {

    const sourceDay =
      getDay(
        sourceDate
      );


    const sourceBook =
      getBook(
        sourceDate,
        sourceBookId
      );


    if (
      !sourceDay ||
      !sourceBook
    ) {
      return;
    }


    const chapterIndex =
      sourceBook.chapters.findIndex(
        chapter =>
          chapter.id ===
          chapterId
      );


    if (
      chapterIndex === -1
    ) {
      return;
    }


    const [
      movedChapter
    ] =
      sourceBook.chapters.splice(
        chapterIndex,
        1
      );


    const targetDay =
      ensureDay(
        targetDate
      );


    /*
      No target book selected:
      find the same Bible book on the destination day,
      otherwise create it.
    */

    let targetBook =
      targetBookId
        ? targetDay.books.find(
            book =>
              book.id ===
              targetBookId
          )
        : targetDay.books.find(
            book =>
              book.book ===
              sourceBook.book
          );


    if (!targetBook) {

      targetBook = {
        id:
          uid("book"),

        book:
          sourceBook.book,

        expanded:
          true,

        chapters: []
      };


      targetDay.books.push(
        targetBook
      );
    }


    /*
      Prevent duplicate chapter numbers.
    */

    const duplicate =
      targetBook.chapters.some(
        chapter =>
          Number(
            chapter.number
          ) ===
          Number(
            movedChapter.number
          )
      );


    if (duplicate) {

      /*
        Put the chapter back.
      */

      sourceBook.chapters.splice(
        chapterIndex,
        0,
        movedChapter
      );


      showToast(
        `${sourceBook.book} ${movedChapter.number} is already there.`
      );


      return;
    }


    /*
      Drop on a specific chapter:
      insert immediately after it.
    */

    if (
      targetChapterId
    ) {

      const targetIndex =
        targetBook.chapters.findIndex(
          chapter =>
            chapter.id ===
            targetChapterId
        );


      if (
        targetIndex >= 0
      ) {

        targetBook.chapters.splice(
          targetIndex + 1,
          0,
          movedChapter
        );

      } else {

        targetBook.chapters.push(
          movedChapter
        );
      }

    } else {

      targetBook.chapters.push(
        movedChapter
      );
    }


    targetBook.expanded =
      true;


    /*
      If the source book became empty,
      remove the empty book card.
    */

    if (
      sourceBook.chapters.length === 0
    ) {

      sourceDay.books =
        sourceDay.books.filter(
          book =>
            book.id !==
            sourceBook.id
        );
    }


    cleanupEmptyDays();

    saveState();

    render();

    showToast(
      `${sourceBook.book} ${movedChapter.number} moved.`
    );
  }


  /* ==========================================================================
     CLEANUP
     ========================================================================== */

  function cleanupEmptyDays() {

    for (
      const [
        date,
        day
      ]
      of Object.entries(
        state.days
      )
    ) {

      if (
        !day.books ||
        day.books.length === 0
      ) {

        delete state.days[
          date
        ];
      }
    }
  }


  /* ==========================================================================
     DRAG STATE
     ========================================================================== */

  let draggedItem = null;


  function setDragData(
    event,
    data
  ) {

    draggedItem =
      data;


    try {

      event.dataTransfer.effectAllowed =
        "move";

      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify(
          data
        )
      );

    } catch (error) {

      console.warn(
        "Bible Plan: drag data unavailable.",
        error
      );
    }
  }


  function clearDrag() {

    draggedItem =
      null;


    document
      .querySelectorAll(
        ".drop-target"
      )
      .forEach(
        element =>
          element.classList.remove(
            "drop-target"
          )
      );


    document
      .querySelectorAll(
        ".dragging"
      )
      .forEach(
        element =>
          element.classList.remove(
            "dragging"
          )
      );
  }


  function canDrop(
    source,
    target
  ) {

    if (!source) {
      return false;
    }


    if (
      source.kind === "book"
    ) {

      if (
        target.kind === "day"
      ) {

        return (
          source.date !==
          target.date
        );
      }


      if (
        target.kind === "book"
      ) {

        return (
          source.bookId !==
          target.bookId ||
          source.date !==
          target.date
        );
      }


      return false;
    }


    if (
      source.kind === "chapter"
    ) {

      if (
        target.kind === "day"
      ) {

        return (
          source.date !==
          target.date
        );
      }


      if (
        target.kind === "book"
      ) {

        return (
          source.bookId !==
          target.bookId ||
          source.date !==
          target.date
        );
      }


      if (
        target.kind === "chapter"
      ) {

        return (
          source.chapterId !==
            target.chapterId
        );
      }
    }


    return false;
  }


  /* ==========================================================================
     DROP HANDLERS
     ========================================================================== */

  function handleDragOver(
    event,
    target,
    element
  ) {

    if (
      !canDrop(
        draggedItem,
        target
      )
    ) {
      return;
    }


    event.preventDefault();


    try {
      event.dataTransfer.dropEffect =
        "move";
    } catch (_) {}


    clearDropTargetsOnly();


    element.classList.add(
      "drop-target"
    );
  }


  function clearDropTargetsOnly() {

    document
      .querySelectorAll(
        ".drop-target"
      )
      .forEach(
        element =>
          element.classList.remove(
            "drop-target"
          )
      );
  }


  function handleDrop(
    event,
    target
  ) {

    event.preventDefault();

    event.stopPropagation();


    if (
      !canDrop(
        draggedItem,
        target
      )
    ) {
      clearDrag();
      return;
    }


    const source =
      draggedItem;


    /*
      BOOK
    */

    if (
      source.kind === "book"
    ) {

      moveBook(
        source.date,
        source.bookId,
        target.date,
        target.kind === "book"
          ? target.bookId
          : null
      );
    }


    /*
      CHAPTER
    */

    else if (
      source.kind ===
      "chapter"
    ) {

      moveChapter(
        source.date,
        source.bookId,
        source.chapterId,
        target.date,
        target.kind === "book"
          ? target.bookId
          : target.kind ===
            "chapter"
            ? target.bookId
            : null,
        target.kind ===
        "chapter"
          ? target.chapterId
          : null
      );
    }


    clearDrag();
  }


  /* ==========================================================================
     RENDER BOOK
     ========================================================================== */

  function renderBook(
    date,
    book
  ) {

    const card =
      document.createElement(
        "section"
      );


    card.className =
      "book-card";


    if (
      book.expanded
    ) {
      card.classList.add(
        "expanded"
      );
    }


    card.dataset.bookId =
      book.id;


    /*
      BOOK HEADER
    */

    const header =
      document.createElement(
        "div"
      );


    header.className =
      "book-header";


    header.draggable =
      true;


    header.title =
      `Drag ${book.book}`;


    /*
      Expand button
    */

    const expand =
      document.createElement(
        "button"
      );


    expand.type =
      "button";


    expand.className =
      "book-chevron";


    expand.setAttribute(
      "aria-expanded",
      book.expanded
        ? "true"
        : "false"
    );


    expand.setAttribute(
      "aria-label",
      book.expanded
        ? `Collapse ${book.book}`
        : `Expand ${book.book}`
    );


    expand.addEventListener(
      "click",
      event => {

        event.stopPropagation();


        toggleBookExpanded(
          date,
          book.id
        );
      }
    );


    /*
      Book checkbox
    */

    const checkbox =
      document.createElement(
        "input"
      );


    checkbox.type =
      "checkbox";


    checkbox.className =
      "book-check";


    checkbox.checked =
      isBookComplete(
        book
      );


    checkbox.indeterminate =
      isBookPartial(
        book
      );


    checkbox.setAttribute(
      "aria-label",
      `Mark all ${book.book} chapters`
    );


    checkbox.addEventListener(
      "click",
      event =>
        event.stopPropagation()
    );


    checkbox.addEventListener(
      "change",
      () => {

        toggleBook(
          date,
          book.id
        );
      }
    );


    /*
      Book title
    */

    const title =
      document.createElement(
        "div"
      );


    title.className =
      "book-title";


    title.textContent =
      book.book;


    /*
      Progress count
    */

    const progress =
      document.createElement(
        "div"
      );


    progress.className =
      "book-progress";


    const completed =
      book.chapters.filter(
        chapter =>
          chapter.completed
      ).length;


    progress.textContent =
      `${completed}/${book.chapters.length}`;


    /*
      Move button
    */

    const move =
      document.createElement(
        "button"
      );


    move.type =
      "button";


    move.className =
      "book-move";


    move.textContent =
      "↗";


    move.title =
      "Move book";


    move.setAttribute(
      "aria-label",
      `Move ${book.book}`
    );


    move.addEventListener(
      "click",
      event => {

        event.stopPropagation();


        openMoveDialog({
          kind: "book",
          date,
          bookId:
            book.id
        });
      }
    );


    header.append(
      expand,
      checkbox,
      title,
      progress,
      move
    );


    card.appendChild(
      header
    );


    /*
      DRAGGING BOOK
    */

    header.addEventListener(
      "dragstart",
      event => {

        /*
          Don't start dragging when the user is
          interacting with a control.
        */

        if (
          event.target.closest(
            "button"
          ) ||
          event.target.closest(
            "input"
          )
        ) {

          event.preventDefault();

          return;
        }


        card.classList.add(
          "dragging"
        );


        setDragData(
          event,
          {
            kind:
              "book",

            date,

            bookId:
              book.id
          }
        );
      }
    );


    header.addEventListener(
      "dragend",
      clearDrag
    );


    /*
      The book itself is also a destination.
    */

    card.addEventListener(
      "dragover",
      event =>
        handleDragOver(
          event,
          {
            kind:
              "book",

            date,

            bookId:
              book.id
          },
          card
        )
    );


    card.addEventListener(
      "dragleave",
      event => {

        if (
          !card.contains(
            event.relatedTarget
          )
        ) {

          card.classList.remove(
            "drop-target"
          );
        }
      }
    );


    card.addEventListener(
      "drop",
      event =>
        handleDrop(
          event,
          {
            kind:
              "book",

            date,

            bookId:
              book.id
          }
        )
    );


    /*
      CHAPTERS
    */

    const chapterContainer =
      document.createElement(
        "div"
      );


    chapterContainer.className =
      "chapters";


    for (
      const chapter
      of book.chapters
    ) {

      chapterContainer.appendChild(
        renderChapter(
          date,
          book,
          chapter
        )
      );
    }


    card.appendChild(
      chapterContainer
    );


    return card;
  }


  /* ==========================================================================
     RENDER CHAPTER
     ========================================================================== */

  function renderChapter(
    date,
    book,
    chapter
  ) {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "chapter-row";


    row.draggable =
      true;


    row.dataset.chapterId =
      chapter.id;


    /*
      LABEL
    */

    const label =
      document.createElement(
        "label"
      );


    label.className =
      "chapter-check";


    const checkbox =
      document.createElement(
        "input"
      );


    checkbox.type =
      "checkbox";


    checkbox.checked =
      Boolean(
        chapter.completed
      );


    const custom =
      document.createElement(
        "span"
      );


    custom.className =
      "custom-check";


    const text =
      document.createElement(
        "span"
      );


    text.className =
      "chapter-label";


    text.textContent =
      `${book.book} ${chapter.number}`;


    label.append(
      checkbox,
      custom,
      text
    );


    checkbox.addEventListener(
      "click",
      event =>
        event.stopPropagation()
    );


    checkbox.addEventListener(
      "change",
      () => {

        toggleChapter(
          date,
          book.id,
          chapter.id
        );
      }
    );


    /*
      MOVE BUTTON
    */

    const move =
      document.createElement(
        "button"
      );


    move.type =
      "button";


    move.className =
      "mini-move";


    move.textContent =
      "↗";


    move.title =
      "Move chapter";


    move.setAttribute(
      "aria-label",
      `Move ${book.book} ${chapter.number}`
    );


    move.addEventListener(
      "click",
      event => {

        event.stopPropagation();


        openMoveDialog({
          kind:
            "chapter",

          date,

          bookId:
            book.id,

          chapterId:
            chapter.id
        });
      }
    );


    row.append(
      label,
      move
    );


    /*
      CHAPTER DRAG START
    */

    row.addEventListener(
      "dragstart",
      event => {

        if (
          event.target.closest(
            "button"
          ) ||
          event.target.closest(
            "input"
          )
        ) {

          event.preventDefault();

          return;
        }


        row.classList.add(
          "dragging"
        );


        setDragData(
          event,
          {
            kind:
              "chapter",

            date,

            bookId:
              book.id,

            chapterId:
              chapter.id
          }
        );
      }
    );


    row.addEventListener(
      "dragend",
      clearDrag
    );


    /*
      DROP ON CHAPTER
    */

    row.addEventListener(
      "dragover",
      event =>
        handleDragOver(
          event,
          {
            kind:
              "chapter",

            date,

            bookId:
              book.id,

            chapterId:
              chapter.id
          },
          row
        )
    );


    row.addEventListener(
      "dragleave",
      event => {

        if (
          !row.contains(
            event.relatedTarget
          )
        ) {

          row.classList.remove(
            "drop-target"
          );
        }
      }
    );


    row.addEventListener(
      "drop",
      event =>
        handleDrop(
          event,
          {
            kind:
              "chapter",

            date,

            bookId:
              book.id,

            chapterId:
              chapter.id
          }
        )
    );


    return row;
  }


  /* ==========================================================================
     RENDER DAY
     ========================================================================== */

  function renderDay(
    date
  ) {

    const iso =
      isoFromDate(
        date
      );


    const day =
      getDay(
        iso
      );


    const cell =
      document.createElement(
        "article"
      );


    cell.className =
      "day-cell";


    if (
      isSameDate(
        date,
        startOfToday()
      )
    ) {

      cell.classList.add(
        "today"
      );


      cell.id =
        "calendar-today";
    }


    if (
      day &&
      isDayMissed(
        iso,
        day
      )
    ) {

      cell.classList.add(
        "missed"
      );
    }


    if (
      day &&
      isDayComplete(
        day
      )
    ) {

      cell.classList.add(
        "all-complete"
      );
    }


    cell.dataset.date =
      iso;


    /*
      DATE HEADER
    */

    const dateRow =
      document.createElement(
        "div"
      );


    dateRow.className =
      "date-row";


    const dateInfo =
      document.createElement(
        "div"
      );


    dateInfo.innerHTML =
      `
        <div class="date-meta">
          ${escapeHTML(
            date.toLocaleDateString(
              undefined,
              {
                weekday:
                  "short"
              }
            )
          )}
        </div>

        <div class="date-number">
          ${date.getDate()}
        </div>
      `;


    const dateRight =
      document.createElement(
        "div"
      );


    if (
      isSameDate(
        date,
        startOfToday()
      )
    ) {

      dateRight.innerHTML =
        `
          <span class="today-pill">
            Today
          </span>
        `;
    }


    dateRow.append(
      dateInfo,
      dateRight
    );


    cell.appendChild(
      dateRow
    );


    /*
      READINGS
    */

    const readingsContainer =
      document.createElement(
        "div"
      );


    readingsContainer.className =
      "day-readings";


    if (
      !day ||
      !day.books.length
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "empty-reading-state";


      empty.textContent =
        day &&
        isDayMissed(
          iso,
          day
        )
          ? "Missed day"
          : "No reading scheduled";


      readingsContainer.appendChild(
        empty
      );

    } else {

      for (
        const book
        of day.books
      ) {

        readingsContainer.appendChild(
          renderBook(
            iso,
            book
          )
        );
      }
    }


    cell.appendChild(
      readingsContainer
    );


    /*
      PRESERVED SECOND CSV FIELD / VERSES
    */

    if (
      day &&
      day.metadata !==
        "" &&
      day.metadata !==
        null &&
      day.metadata !==
        undefined
    ) {

      const footer =
        document.createElement(
          "div"
        );


      footer.className =
        "cell-footer";


      footer.innerHTML =
        `
          <span class="cell-extra">
            ${escapeHTML(
              day.metadata
            )}
          </span>
        `;


      cell.appendChild(
        footer
      );
    }


    /*
      DAY DROP TARGET
    */

    cell.addEventListener(
      "dragover",
      event =>
        handleDragOver(
          event,
          {
            kind:
              "day",

            date:
              iso
          },
          cell
        )
    );


    cell.addEventListener(
      "dragleave",
      event => {

        if (
          !cell.contains(
            event.relatedTarget
          )
        ) {

          cell.classList.remove(
            "drop-target"
          );
        }
      }
    );


    cell.addEventListener(
      "drop",
      event =>
        handleDrop(
          event,
          {
            kind:
              "day",

            date:
              iso
          }
        )
    );


    return cell;
  }


  /* ==========================================================================
     RENDER CALENDAR
     ========================================================================== */

  function renderCalendar() {

    grid.innerHTML =
      "";


    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();


    monthTitle.textContent =
      currentMonth.toLocaleDateString(
        undefined,
        {
          month:
            "long",

          year:
            "numeric"
        }
      );


    const firstDay =
      new Date(
        year,
        month,
        1
      ).getDay();


    const daysInMonth =
      lastOfMonth(
        currentMonth
      ).getDate();


    const totalCells =
      Math.ceil(
        (
          firstDay +
          daysInMonth
        ) / 7
      ) * 7;


    for (
      let index = 0;
      index < totalCells;
      index++
    ) {

      const dayNumber =
        index -
        firstDay +
        1;


      if (
        dayNumber < 1 ||
        dayNumber >
          daysInMonth
      ) {

        const empty =
          document.createElement(
            "div"
          );


        empty.className =
          "day-cell empty";


        grid.appendChild(
          empty
        );


        continue;
      }


      const date =
        new Date(
          year,
          month,
          dayNumber
        );


      grid.appendChild(
        renderDay(
          date
        )
      );
    }
  }


  /* ==========================================================================
     PROGRESS
     ========================================================================== */

  function getProgress() {

    let totalChapters =
      0;

    let completedChapters =
      0;

    let totalVerses =
      0;

    let completedVerses =
      0;


    for (
      const day
      of Object.values(
        state.days
      )
    ) {

      for (
        const book
        of day.books
      ) {

        for (
          const chapter
          of book.chapters
        ) {

          totalChapters++;


          /*
            The original readings-data.js stores the day's
            verse total, not individual per-chapter verse totals.

            Therefore the progress bar counts chapters exactly,
            while the displayed verse total uses the daily source
            metadata proportionally.
          */

          if (
            chapter.completed
          ) {

            completedChapters++;
          }
        }
      }
    }


    /*
      Sum the verse totals supplied by READINGS.

      This keeps your original CSV data intact.
    */

    for (
      const reading
      of READINGS
    ) {

      const verseCount =
        Number(
          reading.verses
        );


      if (
        Number.isFinite(
          verseCount
        )
      ) {

        totalVerses +=
          verseCount;


        const day =
          state.days[
            canonicalDate(
              reading.date
            )
          ];


        if (
          day &&
          isDayComplete(
            day
          )
        ) {

          completedVerses +=
            verseCount;
        }
      }
    }


    return {
      totalChapters,
      completedChapters,
      totalVerses,
      completedVerses
    };
  }


  function renderProgress() {

    const progress =
      getProgress();


    progressCount.textContent =
      `${progress.completedChapters.toLocaleString()} / ${progress.totalChapters.toLocaleString()} chapters read`;


    progressVerses.textContent =
      `${progress.completedVerses.toLocaleString()} / ${progress.totalVerses.toLocaleString()} verses read`;


    const percent =
      progress.totalChapters
        ? (
            progress.completedChapters /
            progress.totalChapters
          ) * 100
        : 0;


    progressFill.style.width =
      `${percent}%`;
  }


  /* ==========================================================================
     QUOTE
     ========================================================================== */

  function renderQuote() {

    if (
      !QUOTES.length
    ) {
      quoteText.textContent =
        "";

      quoteSource.textContent =
        "";

      return;
    }


    /*
      QUOTES can be:
        { text, source }

      exactly as your quotes-data.js provides.
    */

    const quote =
      QUOTES[
        Math.max(
          0,
          Math.min(
            state.quoteIndex,
            QUOTES.length - 1
          )
        )
      ];


    quoteText.textContent =
      `“${quote.text || ""}”`;


    quoteSource.textContent =
      quote.source
        ? `— ${quote.source}`
        : "";
  }


  /* ==========================================================================
     CLOCK
     ========================================================================== */

  function updateClock() {

    const now =
      new Date();


    clockDate.textContent =
      now.toLocaleDateString(
        undefined,
        {
          weekday:
            "long",

          month:
            "long",

          day:
            "numeric",

          year:
            "numeric"
        }
      );


    clockTime.textContent =
      now.toLocaleTimeString(
        undefined,
        {
          hour:
            "numeric",

          minute:
            "2-digit",

          second:
            "2-digit"
        }
      );
  }


  /* ==========================================================================
     PRETTY DATE
     ========================================================================== */

  function formatPrettyDate(
    iso
  ) {

    return localDateFromISO(
      iso
    ).toLocaleDateString(
      undefined,
      {
        month:
          "long",

        day:
          "numeric",

        year:
          "numeric"
      }
    );
  }


  /* ==========================================================================
     TOAST
     ========================================================================== */

  function showToast(
    message
  ) {

    if (!toast) {
      return;
    }


    clearTimeout(
      toastTimer
    );


    toast.textContent =
      message;


    toast.classList.add(
      "show"
    );


    toastTimer =
      setTimeout(
        () => {

          toast.classList.remove(
            "show"
          );

        },
        2400
      );
  }


  /* ==========================================================================
     MOVE DIALOG
     ========================================================================== */

  let moveTarget =
    null;

  let toastTimer =
    null;


  function openMoveDialog(
    target
  ) {

    moveTarget =
      target;


    if (
      target.kind ===
      "book"
    ) {

      const book =
        getBook(
          target.date,
          target.bookId
        );


      moveDialogTitle.textContent =
        "Move book";


      moveDialogDescription.textContent =
        `Move ${book?.book || "this reading"} to another calendar day.`;
    }


    else {

      const book =
        getBook(
          target.date,
          target.bookId
        );


      const chapter =
        getChapter(
          target.date,
          target.bookId,
          target.chapterId
        );


      moveDialogTitle.textContent =
        "Move chapter";


      moveDialogDescription.textContent =
        `Move ${book?.book || "Bible"} ${chapter?.number || ""} to another calendar day.`;
    }


    moveDateInput.value =
      target.date;


    moveDialog.hidden =
      false;


    requestAnimationFrame(
      () =>
        moveDateInput.focus()
    );
  }


  function closeMoveDialog() {

    moveDialog.hidden =
      true;


    moveTarget =
      null;
  }


  function confirmMoveDialog() {

    if (!moveTarget) {
      return;
    }


    const targetDate =
      canonicalDate(
        moveDateInput.value
      );


    if (!targetDate) {

      showToast(
        "Please choose a valid date."
      );


      return;
    }


    if (
      moveTarget.kind ===
      "book"
    ) {

      moveBook(
        moveTarget.date,
        moveTarget.bookId,
        targetDate
      );

    } else {

      moveChapter(
        moveTarget.date,
        moveTarget.bookId,
        moveTarget.chapterId,
        targetDate
      );
    }


    closeMoveDialog();
  }


  /* ==========================================================================
     NAVIGATION
     ========================================================================== */

  document
    .getElementById(
      "prevMonth"
    )
    ?.addEventListener(
      "click",
      () => {

        currentMonth =
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() - 1,
            1
          );


        renderCalendar();
      }
    );


  document
    .getElementById(
      "nextMonth"
    )
    ?.addEventListener(
      "click",
      () => {

        currentMonth =
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            1
          );


        renderCalendar();
      }
    );


  document
    .getElementById(
      "todayButton"
    )
    ?.addEventListener(
      "click",
      () => {

        currentMonth =
          firstOfMonth(
            new Date()
          );


        renderCalendar();


        requestAnimationFrame(
          () => {

            document
              .getElementById(
                "calendar-today"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "center"
              });
          }
        );
      }
    );


  /* ==========================================================================
     IMPORT CSV
     ========================================================================== */

  function importCSVFile(
    file
  ) {

    if (!file) {
      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      event => {

        try {

          const imported =
            parseImportedCSV(
              event.target.result
            );


          state.days =
            imported;


          state.imported =
            true;


          const firstDate =
            Object.keys(
              imported
            ).sort()[0];


          if (firstDate) {

            currentMonth =
              firstOfMonth(
                localDateFromISO(
                  firstDate
                )
              );
          }


          saveState();

          render();

          showToast(
            `Imported ${Object.keys(imported).length} reading days.`
          );

        } catch (error) {

          console.error(
            "Bible Plan CSV import error:",
            error
          );


          showToast(
            error.message ||
            "Could not import CSV."
          );

        } finally {

          csvInput.value =
            "";
        }
      };


    reader.onerror =
      () => {

        showToast(
          "Could not read that file."
        );


        csvInput.value =
          "";
      };


    reader.readAsText(
      file
    );
  }


  function parseCSVLine(
    line
  ) {

    const cells = [];

    let current =
      "";

    let quoted =
      false;


    for (
      let i = 0;
      i < line.length;
      i++
    ) {

      const char =
        line[i];


      if (
        char ===
        '"'
      ) {

        if (
          quoted &&
          line[i + 1] ===
            '"'
        ) {

          current +=
            '"';

          i++;

        } else {

          quoted =
            !quoted;
        }


        continue;
      }


      if (
        char === "," &&
        !quoted
      ) {

        cells.push(
          current.trim()
        );

        current =
          "";

        continue;
      }


      current +=
        char;
    }


    cells.push(
      current.trim()
    );


    return cells;
  }


  function parseImportedCSV(
    text
  ) {

    const lines =
      String(text)
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .filter(
          line =>
            line.trim() !== ""
        );


    if (!lines.length) {

      throw new Error(
        "The CSV file is empty."
      );
    }


    const rows =
      lines.map(
        parseCSVLine
      );


    /*
      Two common formats:

      1.
        "Gen 1-7; Mat 1-2; Ps 1; Pro 1","232"

        Uses the Start date from the interface.

      2.
        "2026-09-01","Gen 1-7; Mat 1-2; Ps 1; Pro 1","232"

        Uses explicit dates.
    */


    const firstRow =
      rows[0].map(
        cell =>
          cell.toLowerCase()
      );


    const hasHeader =
      firstRow.some(
        value =>
          /date|passage|reading|verses|plan|metadata/
            .test(value)
      );


    const firstDataRow =
      hasHeader
        ? 1
        : 0;


    const imported = {};


    let sequentialDate =
      localDateFromISO(
        canonicalDate(
          planStartInput?.value ||
          FALLBACK_START
        ) ||
        FALLBACK_START
      );


    let validRows =
      0;


    for (
      let i =
        firstDataRow;
      i <
        rows.length;
      i++
    ) {

      const row =
        rows[i];


      if (
        row.length < 2
      ) {
        continue;
      }


      let date =
        "";

      let passage =
        "";

      let metadata =
        "";


      const firstDate =
        canonicalDate(
          row[0]
        );


      const secondDate =
        canonicalDate(
          row[1]
        );


      if (firstDate) {

        /*
          date, passage, metadata
        */

        date =
          firstDate;

        passage =
          row[1];

        metadata =
          row[2] ??
          "";

      }

      else if (secondDate) {

        /*
          passage, date, metadata
        */

        date =
          secondDate;

        passage =
          row[0];

        metadata =
          row[2] ??
          "";

      }

      else {

        /*
          passage, metadata
          sequential dates
        */

        date =
          isoFromDate(
            sequentialDate
          );


        sequentialDate =
          addDays(
            sequentialDate,
            1
          );


        passage =
          row[0];

        metadata =
          row[1] ??
          "";
      }


      if (
        !date ||
        !passage.trim()
      ) {

        continue;
      }


      const fakeReading = {
        date,

        passage:
          passage.trim(),

        verses:
          metadata.trim()
      };


      if (
        !imported[date]
      ) {

        imported[date] =
          buildDayFromReading(
            fakeReading
          );

      } else {

        /*
          Merge duplicate date rows.
        */

        const newDay =
          buildDayFromReading(
            fakeReading
          );


        imported[date].books.push(
          ...newDay.books
        );
      }


      imported[date].metadata =
        metadata;


      validRows++;
    }


    if (
      !validRows
    ) {

      throw new Error(
        'No valid reading rows were found. Example: "Gen 1-7; Mat 1-2; Ps 1; Pro 1","232"'
      );
    }


    return imported;
  }


  csvInput?.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];


      if (file) {
        importCSVFile(
          file
        );
      }
    }
  );


  /* ==========================================================================
     EXPORT
     ========================================================================== */

  document
    .getElementById(
      "exportButton"
    )
    ?.addEventListener(
      "click",
      () => {

        const blob =
          new Blob(
            [
              JSON.stringify(
                state,
                null,
                2
              )
            ],
            {
              type:
                "application/json"
            }
          );


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;


        link.download =
          "bible-plan-backup.json";


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
          url
        );


        showToast(
          "Bible plan backup exported."
        );
      }
    );


  /* ==========================================================================
     RESET
     ========================================================================== */

  document
    .getElementById(
      "resetButton"
    )
    ?.addEventListener(
      "click",
      () => {

        const confirmed =
          window.confirm(
            "Reset your saved Bible Plan progress and all custom moves?"
          );


        if (!confirmed) {
          return;
        }


        localStorage.removeItem(
          STORAGE_KEY
        );


        state.version =
          4;

        state.days =
          createDefaultState().days;

        state.quoteIndex =
          Math.floor(
            Math.random() *
            Math.max(
              1,
              QUOTES.length
            )
          );

        state.imported =
          false;


        currentMonth =
          firstOfMonth(
            localDateFromISO(
              READINGS[0]?.date ||
              FALLBACK_START
            )
          );


        if (
          planStartInput
        ) {

          planStartInput.value =
            READINGS[0]?.date ||
            FALLBACK_START;
        }


        saveState();

        render();

        showToast(
          "Bible Plan reset."
        );
      }
    );


  /* ==========================================================================
     MOVE DIALOG CONTROLS
     ========================================================================== */

  document
    .getElementById(
      "closeMoveDialog"
    )
    ?.addEventListener(
      "click",
      closeMoveDialog
    );


  document
    .getElementById(
      "cancelMove"
    )
    ?.addEventListener(
      "click",
      closeMoveDialog
    );


  document
    .getElementById(
      "confirmMove"
    )
    ?.addEventListener(
      "click",
      confirmMoveDialog
    );


  moveDialog?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        moveDialog
      ) {

        closeMoveDialog();
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
          "Escape" &&
        moveDialog &&
        !moveDialog.hidden
      ) {

        closeMoveDialog();
      }
    }
  );


  /* ==========================================================================
     JUMP TO TODAY
     ========================================================================== */

  document
    .getElementById(
      "jumpToday"
    )
    ?.addEventListener(
      "click",
      () => {

        currentMonth =
          firstOfMonth(
            new Date()
          );


        renderCalendar();


        requestAnimationFrame(
          () => {

            document
              .getElementById(
                "calendar-today"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "center"
              });
          }
        );
      }
    );


  /* ==========================================================================
     PLAN START DATE
     ========================================================================== */

  planStartInput?.addEventListener(
    "change",
    () => {

      const date =
        canonicalDate(
          planStartInput.value
        );


      if (!date) {

        planStartInput.value =
          FALLBACK_START;


        showToast(
          "Invalid start date."
        );


        return;
      }
    }
  );


  /* ==========================================================================
     STORAGE SYNCHRONIZATION
     ========================================================================== */

  window.addEventListener(
    "storage",
    event => {

      if (
        event.key !==
        STORAGE_KEY
      ) {
        return;
      }


      const fresh =
        loadState();


      state.version =
        fresh.version;

      state.days =
        fresh.days;

      state.quoteIndex =
        fresh.quoteIndex;

      state.imported =
        fresh.imported;


      render();
    }
  );


  window.addEventListener(
    "beforeunload",
    saveState
  );


  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */

  /*
    Your existing readings-data.js is dated from September 1, 2026 onward,
    so open on the first actual plan date rather than today's date if the
    calendar has not been customized.
  */

  const firstReadingDate =
    READINGS[0]?.date;


  if (
    firstReadingDate &&
    !state.imported &&
    Object.keys(
      state.days
    ).length
  ) {

    currentMonth =
      firstOfMonth(
        localDateFromISO(
          firstReadingDate
        )
      );


    if (
      planStartInput
    ) {

      planStartInput.value =
        firstReadingDate;
    }
  }


  /*
    Pick a new quote on every fresh page load.
    The saved quoteIndex still exists so the state remains serializable.
  */

  if (
    QUOTES.length
  ) {

    state.quoteIndex =
      Math.floor(
        Math.random() *
        QUOTES.length
      );
  }


  saveState();

  updateClock();

  setInterval(
    updateClock,
    1000
  );

  render();
})();