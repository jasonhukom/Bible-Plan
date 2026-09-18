/* ==========================================================================
   Bible Plan — Complete Application
   Vanilla JS, Calendar-based Bible reading tracker with D&D support
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "biblePlan.state.v1";
  const INDONESIA_TZ = "Asia/Jakarta";

  /* Book name mapping */
  const BOOK_NAMES = {
    "Gen": "Genesis", "Ex": "Exodus", "Lev": "Leviticus", "Num": "Numbers", "Deut": "Deuteronomy",
    "Jos": "Joshua", "Judg": "Judges", "Ruth": "Ruth", "1 Sa": "1 Samuel", "2 Sa": "2 Samuel",
    "1 Ki": "1 Kings", "2 Ki": "2 Kings", "1 Ch": "1 Chronicles", "2 Ch": "2 Chronicles",
    "Ezr": "Ezra", "Neh": "Nehemiah", "Est": "Esther", "Job": "Job", "Ps": "Psalms", "Pro": "Proverbs",
    "Ecc": "Ecclesiastes", "Song": "Song of Solomon", "Isa": "Isaiah", "Jer": "Jeremiah", "Lam": "Lamentations",
    "Eze": "Ezekiel", "Dan": "Daniel", "Hos": "Hosea", "Joel": "Joel", "Am": "Amos", "Ob": "Obadiah",
    "Jon": "Jonah", "Mic": "Micah", "Nah": "Nahum", "Hab": "Habakkuk", "Zep": "Zephaniah",
    "Hag": "Haggai", "Zec": "Zechariah", "Mal": "Malachi", "Mat": "Matthew", "Mk": "Mark",
    "Lk": "Luke", "Jn": "John", "Act": "Acts", "Rom": "Romans", "1 Co": "1 Corinthians",
    "2 Co": "2 Corinthians", "Gal": "Galatians", "Eph": "Ephesians", "Php": "Philippians",
    "Col": "Colossians", "1 Th": "1 Thessalonians", "2 Th": "2 Thessalonians", "1 Ti": "1 Timothy",
    "2 Ti": "2 Timothy", "Tit": "Titus", "Phm": "Philemon", "Heb": "Hebrews", "Jam": "James",
    "1 Pe": "1 Peter", "2 Pe": "2 Peter", "1 Jn": "1 John", "2 Jn": "2 John", "3 Jn": "3 John",
    "Jude": "Jude", "Rev": "Revelation"
  };

  let state = {
    calendarDays: [],
    settings: {
      quoteIndex: -1,
      startDate: dateToISO(new Date(Date.now() + 86400000)),
      days: 121,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      bookGroups: ["ot", "nt"],
      order: "inorder",
      wiseWords: ["psalms", "proverbs"]
    }
  };

  let currentDate = getIndonesiaToday();

  /* ================================================================
     Date Utilities (Indonesia timezone aware)
     ================================================================ */

  function getIndonesiaToday() {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: INDONESIA_TZ }));
    jakartaTime.setHours(0, 0, 0, 0);
    return jakartaTime;
  }

  function dateToISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseISO(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function addMonths(date, count) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + count);
    return result;
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  /* ================================================================
     Data Structure & Initialization
     ================================================================ */

  function parsePassageString(passageStr) {
    if (!passageStr) return [];

    const books = [];
    const bookStrings = passageStr.split(";").map(s => s.trim());

    bookStrings.forEach((bookStr) => {
      const match = bookStr.match(/^([A-Za-z0-9\s]+?)\s+(.+)$/);
      if (!match) return;

      const abbr = match[1].trim();
      const fullName = BOOK_NAMES[abbr] || abbr;
      const chaptersStr = match[2].trim();

      const chapters = [];
      const ranges = chaptersStr.split(",").map(s => s.trim());

      ranges.forEach((range) => {
        if (range.includes("-")) {
          const [start, end] = range.split("-").map(Number);
          for (let i = start; i <= end; i++) {
            chapters.push(i);
          }
        } else {
          chapters.push(Number(range));
        }
      });

      books.push({
        id: `book-${abbr}-${Date.now()}-${Math.random()}`,
        abbreviation: abbr,
        fullName: fullName,
        chapters: chapters.map((num) => ({
          id: `ch-${abbr}-${num}-${Date.now()}-${Math.random()}`,
          number: num,
          completed: false
        }))
      });
    });

    return books;
  }

  function initializeCalendarData() {
    generatePlan();
  }

  function scheduleCalendarDays() {
    const startDate = parseISO(state.settings.startDate || dateToISO(new Date(Date.now() + 86400000)));
    const weekdays = state.settings.weekdays || [0, 1, 2, 3, 4, 5, 6];
    let date = startDate;
    state.calendarDays.forEach((day) => {
      while (!weekdays.includes(date.getDay())) date.setDate(date.getDate() + 1);
      day.date = dateToISO(date);
      date.setDate(date.getDate() + 1);
    });
  }

  /* ================================================================
     State Persistence
     ================================================================ */

  // Anything that wants to know when the plan changed (cloud-sync.js does)
  // registers here rather than polling localStorage.
  const stateChangeListeners = [];

  function notifyStateChanged() {
    stateChangeListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.warn("State change listener failed:", e);
      }
    });
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
    notifyStateChanged();
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.calendarDays && Array.isArray(parsed.calendarDays) && parsed.calendarDays.length > 0) {
          state = parsed;
          // Defaults fill in anything missing (e.g. an older save from before
          // a setting existed); anything already saved is left untouched.
          state.settings = {
            quoteIndex: -1,
            startDate: dateToISO(new Date(Date.now() + 86400000)),
            days: state.calendarDays.length || 121,
            weekdays: [0, 1, 2, 3, 4, 5, 6],
            bookGroups: ["ot", "nt"],
            order: "inorder",
            wiseWords: ["psalms", "proverbs"],
            ...state.settings
          };
          return true;
        }
      }
    } catch (e) {
      console.warn("Failed to load state:", e);
    }
    return false;
  }

  function resetPlan(force = false) {
    if (!force) {
      const dialog = document.getElementById("resetDialog");
      if (dialog) dialog.hidden = false;
      return;
    }
    state = {
      calendarDays: [],
      settings: {
        quoteIndex: -1,
        startDate: dateToISO(new Date(Date.now() + 86400000)),
        days: 121,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        bookGroups: ["ot", "nt"],
        order: "inorder",
        wiseWords: ["psalms", "proverbs"]
      }
    };
    generatePlan();
    saveState();
    render();
  }

  /* ================================================================
     CSV Import
     ================================================================ */

  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function importCSV(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      alert("Empty CSV file");
      return;
    }

    const firstRow = rows[0];
    const isHeader = firstRow[0] && (firstRow[0].toLowerCase().includes("date") || 
                     firstRow[0].toLowerCase().includes("passage") ||
                     firstRow[0].startsWith('"Date'));
    const dataRows = isHeader ? rows.slice(1) : rows;

    state.calendarDays = dataRows
      .map((row, idx) => {
        const dateStr = row[0]?.replace(/"/g, "").trim();
        const passageStr = row[1]?.replace(/"/g, "").trim();
        const metadata = row[2]?.replace(/"/g, "").trim() || "";

        if (!dateStr || !passageStr) return null;

        return {
          id: `day-imported-${idx}-${Date.now()}`,
          date: dateStr,
          dayIndex: idx,
          metadata: metadata,
          books: parsePassageString(passageStr)
        };
      })
      .filter(Boolean);

    saveState();
    render();
    alert(`Imported ${state.calendarDays.length} days of readings`);
  }

  function exportPlan() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bible-plan-${dateToISO(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /* ================================================================
     Completion Logic
     ================================================================ */

  function toggleChapterCompletion(dayId, bookId, chapterId) {
    const day = state.calendarDays.find(d => d.id === dayId);
    if (!day) return;

    const book = day.books.find(b => b.id === bookId);
    if (!book) return;

    const chapter = book.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    chapter.completed = !chapter.completed;
    saveState();
    render();
  }

  function toggleBookCompletion(dayId, bookId) {
    const day = state.calendarDays.find(d => d.id === dayId);
    if (!day) return;

    const book = day.books.find(b => b.id === bookId);
    if (!book) return;

    const allCompleted = book.chapters.every(c => c.completed);
    const newState = !allCompleted;

    book.chapters.forEach(c => {
      c.completed = newState;
    });

    saveState();
    render();
  }

  function getBookCompletionState(book) {
    const total = book.chapters.length;
    const completed = book.chapters.filter(c => c.completed).length;

    if (completed === 0) return "unchecked";
    if (completed === total) return "checked";
    return "indeterminate";
  }

  /* ================================================================
     Drag and Drop
     ================================================================ */

  let draggedElement = null;
  let dragData = null;

  function initDragAndDrop() {
    document.addEventListener("dragstart", (e) => {
      const chapterEl = e.target.closest("[data-chapter-id]");
      const bookEl = e.target.closest("[data-book-id]");
      const dayEl = e.target.closest("[data-day-id]");

      if (chapterEl) {
        draggedElement = chapterEl;
        dragData = {
          type: "chapter",
          dayId: dayEl?.dataset.dayId,
          bookId: bookEl?.dataset.bookId,
          chapterId: chapterEl.dataset.chapterId
        };
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        chapterEl.classList.add("dragging");
      } else if (bookEl) {
        draggedElement = bookEl;
        dragData = {
          type: "book",
          dayId: dayEl?.dataset.dayId,
          bookId: bookEl.dataset.bookId
        };
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        bookEl.classList.add("dragging");
      }
    });

    document.addEventListener("dragend", (e) => {
      if (draggedElement) {
        draggedElement.classList.remove("dragging");
        draggedElement = null;
        dragData = null;
      }
    });

    document.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const dayEl = e.target.closest("[data-day-id]");
      if (dayEl && dragData) {
        dayEl.classList.add("drop-target");
      }
    });

    document.addEventListener("dragleave", (e) => {
      const dayEl = e.target.closest("[data-day-id]");
      if (dayEl) {
        dayEl.classList.remove("drop-target");
      }
    });

    document.addEventListener("drop", (e) => {
      e.preventDefault();
      const dayEl = e.target.closest("[data-day-id]");

      if (!dayEl || !dragData) return;

      const targetDayId = dayEl.dataset.dayId;
      const sourceDayId = dragData.dayId;

      if (dragData.type === "chapter") {
        moveChapter(sourceDayId, dragData.bookId, dragData.chapterId, targetDayId);
      } else if (dragData.type === "book") {
        moveBook(sourceDayId, dragData.bookId, targetDayId);
      }

      dayEl.classList.remove("drop-target");
    });
  }

  function moveChapter(fromDayId, fromBookId, chapterId, toDayId) {
    const fromDay = state.calendarDays.find(d => d.id === fromDayId);
    const toDay = state.calendarDays.find(d => d.id === toDayId);

    if (!fromDay || !toDay) return;

    const fromBook = fromDay.books.find(b => b.id === fromBookId);
    if (!fromBook) return;

    const chapter = fromBook.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    fromBook.chapters = fromBook.chapters.filter(c => c.id !== chapterId);

    if (fromBook.chapters.length === 0) {
      fromDay.books = fromDay.books.filter(b => b.id !== fromBookId);
    }

    let targetBook = toDay.books.find(b => b.abbreviation === fromBook.abbreviation);
    if (!targetBook) {
      targetBook = {
        id: `book-${fromBook.abbreviation}-${Date.now()}-${Math.random()}`,
        abbreviation: fromBook.abbreviation,
        fullName: fromBook.fullName,
        chapters: []
      };
      toDay.books.push(targetBook);
    }

    targetBook.chapters.push(chapter);
    targetBook.chapters.sort((a, b) => a.number - b.number);
    sortDayBooks(toDay);

    saveState();
    render();
  }

  function moveBook(fromDayId, bookId, toDayId) {
    const fromDay = state.calendarDays.find(d => d.id === fromDayId);
    const toDay = state.calendarDays.find(d => d.id === toDayId);

    if (!fromDay || !toDay) return;

    const book = fromDay.books.find(b => b.id === bookId);
    if (!book) return;

    fromDay.books = fromDay.books.filter(b => b.id !== bookId);

    const existingBook = toDay.books.find(b => b.abbreviation === book.abbreviation);
    if (existingBook) {
      const existingIds = new Set(existingBook.chapters.map(c => c.id));
      const newChapters = book.chapters.filter(c => !existingIds.has(c.id));
      existingBook.chapters.push(...newChapters);
      existingBook.chapters.sort((a, b) => a.number - b.number);
    } else {
      toDay.books.push(book);
    }
    sortDayBooks(toDay);

    saveState();
    render();
  }

  /* ================================================================
     Rendering
     ================================================================ */

  function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    const today = getIndonesiaToday();

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const cell = createDayCell(null, date);
      cell.classList.add("other-month");
      grid.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = dateToISO(date);
      const calendarDay = state.calendarDays.find(d => d.date === dateStr);
      const cell = createDayCell(calendarDay, date);

      if (dateToISO(date) === dateToISO(today)) {
        cell.classList.add("today");
      }

      if (date < today && calendarDay) {
        const hasIncomplete = calendarDay.books.some(b =>
          b.chapters.some(c => !c.completed)
        );
        if (hasIncomplete) {
          cell.classList.add("missed");
        }
      }

      grid.appendChild(cell);
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      const cell = createDayCell(null, date);
      cell.classList.add("other-month");
      grid.appendChild(cell);
    }
  }

  function createDayCell(calendarDay, date) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    if (calendarDay) {
      cell.dataset.dayId = calendarDay.id;
    }

    const dateHeader = document.createElement("div");
    dateHeader.className = "date-header";
    const dayName = document.createElement("div");
    dayName.className = "day-name";
    dayName.textContent = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = date.getDate();
    dateHeader.appendChild(dayName);
    dateHeader.appendChild(dayNumber);
    cell.appendChild(dateHeader);

    if (calendarDay && calendarDay.books.length > 0) {
      const booksContainer = document.createElement("div");
      booksContainer.className = "books-container";

      calendarDay.books.forEach((book) => {
        const bookEl = createBookElement(calendarDay.id, book);
        booksContainer.appendChild(bookEl);
      });

      cell.appendChild(booksContainer);
    } else if (!calendarDay) {
      cell.classList.add("empty");
    }

    return cell;
  }

  // Which books are currently expanded, keyed by book id. Kept outside the
  // render cycle so a book stays open across the re-renders that happen
  // every time a chapter is checked off.
  const expandedBookIds = new Set();

  function createBookElement(dayId, book) {
    const bookEl = document.createElement("div");
    bookEl.className = "book";
    bookEl.dataset.dayId = dayId;
    bookEl.dataset.bookId = book.id;
    bookEl.draggable = true;
    bookEl.classList.toggle("expanded", expandedBookIds.has(book.id));

    const header = document.createElement("div");
    header.className = "book-header";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "book-checkbox";
    const compState = getBookCompletionState(book);
    checkbox.checked = compState === "checked";
    checkbox.indeterminate = compState === "indeterminate";
    checkbox.addEventListener("change", () => toggleBookCompletion(dayId, book.id));

    const title = document.createElement("label");
    title.className = "book-title";
    title.textContent = book.fullName;

    const progress = document.createElement("div");
    progress.className = "book-progress";
    const completed = book.chapters.filter(c => c.completed).length;
    progress.textContent = `${completed}/${book.chapters.length}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "book-toggle";
    toggle.setAttribute("aria-label", `Show chapters for ${book.fullName}`);
    toggle.innerHTML = '<svg class="book-toggle-chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // Clicking anywhere on the header (besides the checkbox itself) opens
    // or closes the chapter list -- the chevron is just the visual cue.
    header.addEventListener("click", (e) => {
      if (e.target === checkbox) return;
      const isExpanded = bookEl.classList.toggle("expanded");
      if (isExpanded) expandedBookIds.add(book.id);
      else expandedBookIds.delete(book.id);
    });

    header.appendChild(checkbox);
    header.appendChild(title);
    header.appendChild(progress);
    header.appendChild(toggle);
    bookEl.appendChild(header);

    const chaptersContainer = document.createElement("div");
    chaptersContainer.className = "chapters-container";
    book.chapters.forEach((chapter) => {
      const chapterEl = createChapterElement(dayId, book.id, chapter);
      chaptersContainer.appendChild(chapterEl);
    });
    bookEl.appendChild(chaptersContainer);

    return bookEl;
  }

  function createChapterElement(dayId, bookId, chapter) {
    const chapterEl = document.createElement("div");
    chapterEl.className = "chapter";
    chapterEl.dataset.dayId = dayId;
    chapterEl.dataset.bookId = bookId;
    chapterEl.dataset.chapterId = chapter.id;
    chapterEl.draggable = true;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "chapter-checkbox";
    checkbox.checked = chapter.completed;
    checkbox.addEventListener("change", () => toggleChapterCompletion(dayId, bookId, chapter.id));

    const label = document.createElement("label");
    label.className = "chapter-label";
    label.textContent = `${chapter.number}`;
    if (chapter.completed) label.classList.add("completed");

    chapterEl.appendChild(checkbox);
    chapterEl.appendChild(label);

    return chapterEl;
  }

  function updateMonthLabel() {
    const label = document.getElementById("monthLabel");
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    label.textContent = `${mm}/${dd}/${currentDate.getFullYear()}`;
  }

  function updateClock() {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: INDONESIA_TZ }));

    const dateEl = document.getElementById("clockDate");
    const timeEl = document.getElementById("clockTime");

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    dateEl.textContent = `${dayNames[jakartaTime.getDay()]}, ${monthNames[jakartaTime.getMonth()]} ${jakartaTime.getDate()}`;

    const h = String(jakartaTime.getHours()).padStart(2, "0");
    const m = String(jakartaTime.getMinutes()).padStart(2, "0");
    const s = String(jakartaTime.getSeconds()).padStart(2, "0");
    timeEl.textContent = `${h}:${m}:${s}`;
  }

  // The quote is picked deterministically from the current hour, so it's
  // the same for everyone within that hour and moves on by itself at the
  // top of the next hour -- it no longer changes when the banner is clicked.
  function updateQuote() {
    if (!window.QUOTES || QUOTES.length === 0) return;

    const hourIndex = Math.floor(Date.now() / 3600000) % QUOTES.length;
    const q = QUOTES[hourIndex];
    document.getElementById("quoteText").textContent = q.text;
    document.getElementById("quoteSource").textContent = q.source ? `— ${q.source}` : "";
  }

  /* ================================================================
     Theme (Light / Dark / Device)

     Kept in its own localStorage key rather than in state.settings so
     that Reset Plan (which clears reading progress) never touches the
     person's display preference.
     ================================================================ */

  const THEME_STORAGE_KEY = "biblePlan.themeMode";

  function resolveTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    // "device": follow the OS/browser preference.
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(mode) {
    document.documentElement.setAttribute("data-theme", resolveTheme(mode));
  }

  function getThemeMode() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch (e) {
      return "dark";
    }
  }

  function setThemeMode(mode) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn("Failed to save theme:", e);
    }
    applyTheme(mode);
  }

  function initTheme() {
    const mode = getThemeMode();
    applyTheme(mode);

    document.querySelectorAll('input[name="themeMode"]').forEach((input) => {
      input.checked = input.value === mode;
      input.addEventListener("change", () => {
        if (input.checked) setThemeMode(input.value);
      });
    });

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
        if (getThemeMode() === "device") applyTheme("device");
      });
    }
  }

  function render() {
    renderCalendar();
    updateMonthLabel();
    updateProgress();
  }

  function updateProgress() {
    const labelEl = document.getElementById("progressLabel");
    const percentEl = document.getElementById("progressPercent");
    const fillEl = document.getElementById("progressFill");
    if (!labelEl || !percentEl || !fillEl) return;

    const total = state.calendarDays.length;
    const completedDays = state.calendarDays.filter((day) =>
      day.books.length > 0 && day.books.every((book) => book.chapters.every((ch) => ch.completed))
    ).length;
    const pct = total > 0 ? Math.round((completedDays / total) * 100) : 0;

    labelEl.textContent = `${completedDays} / ${total} days`;
    percentEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct}%`;
  }

  const OT_BOOKS = [
    ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34],
    ["Joshua", 24], ["Judges", 21], ["Ruth", 4], ["1 Samuel", 31], ["2 Samuel", 24], ["1 Kings", 22], ["2 Kings", 25],
    ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10], ["Nehemiah", 13], ["Esther", 10], ["Job", 42], ["Psalms", 150], ["Proverbs", 31],
    ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66], ["Jeremiah", 52], ["Lamentations", 5], ["Ezekiel", 48], ["Daniel", 14],
    ["Hosea", 14], ["Joel", 3], ["Amos", 9], ["Obadiah", 1], ["Jonah", 4], ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3], ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4]
  ];

  const NT_BOOKS = [
    ["Matthew", 28], ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28], ["Romans", 16], ["1 Corinthians", 16], ["2 Corinthians", 13], ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4], ["Colossians", 4], ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6], ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5], ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5], ["2 John", 1], ["3 John", 1], ["Jude", 1], ["Revelation", 22]
  ];

  const DC_BOOKS = [
    ["Tobit", 14], ["Judith", 16], ["Wisdom", 19], ["Sirach", 51], ["Baruch", 6], ["1 Maccabees", 16], ["2 Maccabees", 15]
  ];

  const BIBLE_BOOKS = [...OT_BOOKS, ...NT_BOOKS, ...DC_BOOKS];

  // Relative order used whenever more than one group is selected: Old
  // Testament, then Deuterocanonical, then New Testament (matches where a
  // Catholic reading order places the deuterocanonical books).
  const GROUP_ORDER = ["ot", "dc", "nt"];
  const BOOK_GROUPS = { ot: OT_BOOKS, dc: DC_BOOKS, nt: NT_BOOKS };
  const GROUP_LABELS = { ot: "Old Testament", dc: "Deuterocanonical", nt: "New Testament" };
  const ORDER_LABELS = { inorder: "In-Order", overlap: "Overlap" };
  const WISE_WORD_LABELS = { psalms: "Daily Psalms", proverbs: "Daily Proverbs" };

  /* ================================================================
     Dynamic Reading Plan Generator

     Takes the selected Bible Book groups (Old Testament / Deuterocanonical /
     New Testament), the Order mode (In-Order / Overlap), the Daily Wise
     Words selection (Psalms / Proverbs), and the number of days, and
     produces a full day-by-day reading schedule that always exactly spans
     the chosen number of days -- 1 day means the whole selection in one
     sitting, 128 days spreads it evenly across 128 days, etc.
     ================================================================ */

  function flattenBookList(bookList) {
    const out = [];
    bookList.forEach(([name, chapterCount]) => {
      for (let chapter = 1; chapter <= chapterCount; chapter++) out.push({ name, chapter });
    });
    return out;
  }

  // Splits `list` into `days` buckets whose sizes differ by at most one
  // item, with any extra items spread evenly across the range rather than
  // clumped at the start.
  function splitEvenly(list, days) {
    const total = list.length;
    const result = [];
    let prevCut = 0;
    for (let i = 0; i < days; i++) {
      const cut = days > 0 ? Math.floor(((i + 1) * total) / days) : 0;
      result.push(list.slice(prevCut, cut));
      prevCut = cut;
    }
    return result;
  }

  function buildBooksSchedule(bookGroups, order, days) {
    const groups = GROUP_ORDER.filter((g) => (bookGroups || []).includes(g));
    if (groups.length === 0 || days <= 0) {
      return Array.from({ length: Math.max(days, 0) }, () => []);
    }

    if (order === "overlap" && groups.length > 1) {
      // Each selected group is paced independently across the full range so
      // they all progress -- and finish -- together, rather than reading
      // one group to completion before starting the next.
      const perGroupSplit = groups.map((g) => splitEvenly(flattenBookList(BOOK_GROUPS[g]), days));
      const merged = [];
      for (let d = 0; d < days; d++) {
        let dayItems = [];
        perGroupSplit.forEach((split) => { dayItems = dayItems.concat(split[d]); });
        merged.push(dayItems);
      }
      return merged;
    }

    // In-Order (or only one group selected): one continuous list, split
    // evenly across the days.
    const master = groups.flatMap((g) => flattenBookList(BOOK_GROUPS[g]));
    return splitEvenly(master, days);
  }

  // Daily Psalms/Proverbs are a devotional daily reading: exactly one
  // chapter per active reading day, cycling back to chapter 1 once the
  // book is finished (a classic "Proverb a day" cadence), independent of
  // how the main Bible Books are paced.
  function buildWiseWordsForIndex(wiseWords, index) {
    const items = [];
    if ((wiseWords || []).includes("psalms")) items.push({ name: "Psalms", chapter: (index % 150) + 1 });
    if ((wiseWords || []).includes("proverbs")) items.push({ name: "Proverbs", chapter: (index % 31) + 1 });
    return items;
  }

  // Display hierarchy applied to every date's reading, regardless of the
  // order the plan actually paced the books in: Old Testament, then the
  // daily Psalms/Proverbs readings, then Deuterocanonical, then New
  // Testament.
  function bookCategoryRank(name) {
    if (name === "Psalms") return 1;
    if (name === "Proverbs") return 2;
    if (OT_BOOKS.some(([n]) => n === name)) return 0;
    if (DC_BOOKS.some(([n]) => n === name)) return 3;
    if (NT_BOOKS.some(([n]) => n === name)) return 4;
    return 5;
  }

  function sortDayBooks(day) {
    day.books.sort((a, b) => bookCategoryRank(a.fullName) - bookCategoryRank(b.fullName));
  }

  function groupItemsIntoBooks(items, dayIndex) {
    const order = [];
    const map = new Map();
    items.forEach(({ name, chapter }) => {
      if (!map.has(name)) { map.set(name, []); order.push(name); }
      map.get(name).push(chapter);
    });

    const sortedOrder = order
      .map((name, index) => ({ name, index }))
      .sort((a, b) => bookCategoryRank(a.name) - bookCategoryRank(b.name) || a.index - b.index)
      .map((entry) => entry.name);

    return sortedOrder.map((name) => ({
      id: `book-${dayIndex}-${name.replace(/\s+/g, "")}`,
      abbreviation: name,
      fullName: name,
      chapters: map.get(name).map((number) => ({
        id: `ch-${dayIndex}-${name.replace(/\s+/g, "")}-${number}`,
        number,
        completed: false
      }))
    }));
  }

  function generatePlan() {
    const days = Math.max(1, Math.min(730, Number(state.settings.days) || 1));
    state.settings.days = days;

    const booksSchedule = buildBooksSchedule(state.settings.bookGroups, state.settings.order, days);

    const calendarDays = [];
    for (let i = 0; i < days; i++) {
      const items = booksSchedule[i].concat(buildWiseWordsForIndex(state.settings.wiseWords, i));
      calendarDays.push({
        id: `day-${i}`,
        date: null,
        dayIndex: i,
        metadata: "",
        books: groupItemsIntoBooks(items, i)
      });
    }
    state.calendarDays = calendarDays;
    scheduleCalendarDays();
  }

  function renderBiblePage() {
    const list = document.getElementById("bibleList");
    if (!list || list.childElementCount) return;
    BIBLE_BOOKS.forEach(([name, chapters]) => {
      const row = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = name;
      row.appendChild(summary);
      const chapterList = document.createElement("div");
      chapterList.className = "chapter-list";
      for (let chapter = 1; chapter <= chapters; chapter++) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `Chapter ${chapter}`;
        button.title = `${name} ${chapter}`;
        chapterList.appendChild(button);
      }
      row.appendChild(chapterList);
      list.appendChild(row);
    });
  }

  function showPage(page) {
    document.querySelectorAll("[data-page]").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    // The quote banner stays visible on every page, not just the calendar.
    document.querySelector(".controls").hidden = page !== "calendar";
    document.querySelector(".calendar-section").hidden = page !== "calendar";
    document.getElementById("biblePage").hidden = page !== "bible";
    document.getElementById("savePage").hidden = page !== "save";
    const accountPage = document.getElementById("accountPage");
    if (accountPage) accountPage.hidden = page !== "account";
<<<<<<< HEAD
    const settingsPage = document.getElementById("settingsPage");
    if (settingsPage) settingsPage.hidden = page !== "settings";
=======
>>>>>>> 32043f199c46c0697032b1151c3623d64f8b078b
    if (page === "bible") renderBiblePage();
  }

  // Start date / weekday changes only need to reshuffle which calendar
  // dates the existing reading days land on -- no need to regenerate the
  // reading content itself, so progress already made is kept.
  function rescheduleOnly() {
    state.settings.startDate = document.getElementById("planStartDate").value;
    state.settings.weekdays = [...document.querySelectorAll(".weekday-options input:checked")].map((input) => Number(input.value));
    scheduleCalendarDays();
    saveState();
    render();
  }

  // Days / Bible Books / Order / Daily Wise Words changes alter what content
  // is actually being read, so the whole plan is rebuilt from scratch.
  function regeneratePlan() {
    state.settings.startDate = document.getElementById("planStartDate").value;
    state.settings.days = Math.max(1, Math.min(730, Number(document.getElementById("planDays").value) || 1));
    state.settings.weekdays = [...document.querySelectorAll(".weekday-options input:checked")].map((input) => Number(input.value));

    let bookGroups = [...document.querySelectorAll("[data-book-group]:checked")].map((input) => input.dataset.bookGroup);
    if (bookGroups.length === 0) {
      // At least one Bible Books group must stay selected -- re-check Old
      // Testament rather than silently generating an empty plan.
      bookGroups = ["ot"];
      const otInput = document.querySelector('[data-book-group="ot"]');
      if (otInput) otInput.checked = true;
    }
    state.settings.bookGroups = bookGroups;

    state.settings.order = document.querySelector('input[name="orderMode"]:checked')?.value || "inorder";
    state.settings.wiseWords = [...document.querySelectorAll("[data-wise-word]:checked")].map((input) => input.dataset.wiseWord);

    generatePlan();
    updateDropdownSummaries();
    saveState();
    render();
  }

  function updateDropdownSummaries() {
    const groupsEl = document.getElementById("bookGroupsSummary");
    const orderEl = document.getElementById("orderSummary");
    const wiseEl = document.getElementById("wiseWordsSummary");

    if (groupsEl) {
      const groups = GROUP_ORDER.filter((g) => (state.settings.bookGroups || []).includes(g));
      groupsEl.textContent = groups.length ? groups.map((g) => GROUP_LABELS[g]).join(", ") : "None selected";
    }
    if (orderEl) {
      orderEl.textContent = ORDER_LABELS[state.settings.order] || "In-Order";
    }
    if (wiseEl) {
      const wise = state.settings.wiseWords || [];
      wiseEl.textContent = wise.length ? wise.map((w) => WISE_WORD_LABELS[w]).join(", ") : "None";
    }
  }

  function initializePlanPanel() {
    const tomorrow = new Date(getIndonesiaToday());
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("planStartDate").value = state.settings.startDate || dateToISO(tomorrow);
    document.getElementById("planDays").value = state.settings.days || state.calendarDays.length || 121;

    const weekdays = state.settings.weekdays || [0, 1, 2, 3, 4, 5, 6];
    document.querySelectorAll(".weekday-options input").forEach((input) => {
      input.checked = weekdays.includes(Number(input.value));
    });

    const bookGroups = state.settings.bookGroups || ["ot", "nt"];
    document.querySelectorAll("[data-book-group]").forEach((input) => {
      input.checked = bookGroups.includes(input.dataset.bookGroup);
    });

    const order = state.settings.order || "inorder";
    document.querySelectorAll('input[name="orderMode"]').forEach((input) => {
      input.checked = input.value === order;
    });

    const wiseWords = state.settings.wiseWords || ["psalms", "proverbs"];
    document.querySelectorAll("[data-wise-word]").forEach((input) => {
      input.checked = wiseWords.includes(input.dataset.wiseWord);
    });

    updateDropdownSummaries();
  }

  function initDropdowns() {
    document.querySelectorAll(".dropdown-field").forEach((field) => {
      const trigger = field.querySelector(".dropdown-trigger");
      const menu = field.querySelector(".dropdown-menu");
      if (!trigger || !menu) return;

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !menu.hidden;
        document.querySelectorAll(".dropdown-menu").forEach((m) => { m.hidden = true; });
        document.querySelectorAll(".dropdown-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
        if (!isOpen) {
          menu.hidden = false;
          trigger.setAttribute("aria-expanded", "true");
        }
      });

      menu.addEventListener("click", (e) => e.stopPropagation());
    });

    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown-menu").forEach((m) => { m.hidden = true; });
      document.querySelectorAll(".dropdown-trigger").forEach((t) => t.setAttribute("aria-expanded", "false"));
    });
  }

  /* ================================================================
     Account UI Update
     ================================================================ */
  function updateAccountUI(userProfile) {
    const iconContainer = document.getElementById("accountIconContainer");
    const accountLabel = document.getElementById("accountLabel");

    if (userProfile && userProfile.isLoggedIn) {
      // User WITH a profile (custom avatar image and username)
      accountLabel.textContent = userProfile.name;
      
      if (userProfile.avatarUrl) {
        iconContainer.innerHTML = `<img src="${userProfile.avatarUrl}" alt="Profile" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;">`;
      }
    } else {
      // User WITHOUT a profile (Default guest state)
      accountLabel.textContent = "Account";
      iconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" id="accountSvgIcon" style="width: 18px; height: 18px;">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/>
          <path d="M20 19.5C20 19.78 19.78 20 19.5 20H4.5C4.22 20 4 19.78 4 19.5V16H20V19.5Z" stroke="currentColor" stroke-width="1.7"/>
        </svg>
      `;
    }
  }

/* ================================================================
    Sidebar Resizing Functionality
    ================================================================ */
  function initSidebarResize() {
    const sidebar = document.getElementById('sidebar');
    const resizeHandle = document.getElementById('sidebarResizeHandle');
    if (!sidebar || !resizeHandle) return;

    let isResizing = false;

    // Minimum collapsed width (matches your .sidebar.collapsed width)
    const minCollapsedWidth = 64; 
    // Point at which text labels begin to overlap/crowd, triggering a snap-close
    const snapCloseThreshold = 140; 

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.classList.add('is-resizing');
      sidebar.style.transition = 'none'; // Disable transition while dragging for instant tracking
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const screenWidth = window.innerWidth;
      const maxAllowedWidth = screenWidth / 3; // 1/3 of the screen width max limit
      let newWidth = e.clientX;

      // Check if dragged past the snap-close threshold
      if (newWidth < snapCloseThreshold) {
        sidebar.classList.add('collapsed');
        sidebar.style.width = '';
        const planPanel = document.getElementById('readingPlanPanel');
        if (planPanel) planPanel.hidden = true;
        return;
      }

      // Ensure it stays within bounds (Collapsed size up to 1/3 of screen width)
      if (newWidth > maxAllowedWidth) {
        newWidth = maxAllowedWidth;
      }

      sidebar.classList.remove('collapsed');
      sidebar.style.width = `${newWidth}px`;
    });

    window.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.classList.remove('is-resizing');
      sidebar.style.transition = ''; // Restore smooth CSS transition
    });
  }

  /* ================================================================
     Event Handlers
     ================================================================ */

  function attachEventHandlers() {
    document.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => showPage(button.dataset.page));
    });

    // The account button, the sign-in/create-account forms and the OAuth
    // buttons are all wired up in account-ui.js, which owns the account
    // dialog and talks to auth.js.

    document.getElementById("readingPlansBtn").addEventListener("click", () => {
      const panel = document.getElementById("readingPlanPanel");
      panel.hidden = !panel.hidden;
      if (!panel.hidden) initializePlanPanel();
    });

    document.querySelectorAll("#planStartDate, .weekday-options input").forEach((input) => {
      input.addEventListener("change", rescheduleOnly);
    });

    document.querySelectorAll('#planDays, [data-book-group], input[name="orderMode"], [data-wise-word]').forEach((input) => {
      input.addEventListener("change", regeneratePlan);
    });

    document.getElementById("cancelResetBtn").addEventListener("click", () => { document.getElementById("resetDialog").hidden = true; });
    document.getElementById("confirmResetBtn").addEventListener("click", () => {
      document.getElementById("resetDialog").hidden = true;
      resetPlan(true);
    });
    document.getElementById("goToBibleBtn").addEventListener("click", () => showPage("bible"));

    document.getElementById("prevMonthBtn").addEventListener("click", () => {
      currentDate = addMonths(currentDate, -1);
      render();
    });

    document.getElementById("nextMonthBtn").addEventListener("click", () => {
      currentDate = addMonths(currentDate, 1);
      render();
    });

    document.getElementById("todayBtn").addEventListener("click", () => {
      currentDate = getIndonesiaToday();
      render();
      const todayCell = document.querySelector(".day-cell.today");
      if (todayCell) {
        todayCell.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    document.getElementById("csvFileInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          importCSV(evt.target.result);
        };
        reader.readAsText(file);
      }
    });

    const csvLabel = document.getElementById("csvFileInput").closest("label");
    if (csvLabel) {
      csvLabel.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          document.getElementById("csvFileInput").click();
        }
      });
    }

    document.getElementById("exportBtn").addEventListener("click", exportPlan);

    document.getElementById("resetBtn").addEventListener("click", () => resetPlan());
  }

  /* ================================================================
     Initialization
     ================================================================ */

  function init() {
    if (!loadState()) {
      initializeCalendarData();
      saveState();
    } else {
      scheduleCalendarDays();
      saveState();
    }

    currentDate = getIndonesiaToday();

    initializePlanPanel();
    initDropdowns();
    initTheme();

    attachEventHandlers();
    initDragAndDrop();
    initSidebarResize();
    render();
    updateClock();
    updateQuote();
    showPage("calendar");

    setInterval(updateClock, 1000);
    // Checked well under once an hour so the banner picks up the new
    // quote promptly right after the hour turns over.
    setInterval(updateQuote, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exposed so account-ui.js (a separate, self-contained file) can update
  // the sidebar account button after checking/making a session, without
  // needing to duplicate this module's internals.
  window.updateAccountUI = updateAccountUI;

  /* ================================================================
     App bridge

     The narrow surface the account/sync modules are allowed to use. It
     deliberately hands out copies rather than the live state object, so
     nothing outside this file can mutate the calendar behind its back.
     ================================================================ */
  window.BiblePlanApp = {
    /** A deep copy of { calendarDays, settings }. */
    getState() {
      return JSON.parse(JSON.stringify(state));
    },

    /** Replaces the plan wholesale (used when adopting an account's plan). */
    replaceState(nextState) {
      if (!nextState || !Array.isArray(nextState.calendarDays)) return false;
      state = {
        calendarDays: nextState.calendarDays,
        settings: { ...state.settings, ...(nextState.settings || {}) }
      };
      if (!state.settings.days) state.settings.days = state.calendarDays.length;
      saveState();
      initializePlanPanel();
      render();
      return true;
    },

    /** Fires after every save. Returns an unsubscribe function. */
    onStateChange(listener) {
      if (typeof listener !== "function") return () => {};
      stateChangeListeners.push(listener);
      return () => {
        const index = stateChangeListeners.indexOf(listener);
        if (index !== -1) stateChangeListeners.splice(index, 1);
      };
    },

    /** "ot" | "dc" | "nt" | null for a full book name. */
    getBookCategory(bookName) {
      const name = String(bookName || "");
      const group = GROUP_ORDER.find((key) => BOOK_GROUPS[key].some(([book]) => book === name));
      return group || null;
    },

    /** Switches the visible page ("calendar" | "bible" | "save" | "account"). */
    showPage,

    /** The localStorage key holding the offline copy of the plan. */
    storageKey: STORAGE_KEY
  };
})();
