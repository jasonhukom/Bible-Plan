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
      quoteIndex: -1
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
    if (!window.READINGS || READINGS.length === 0) return;

    state.calendarDays = READINGS.map((reading) => ({
      id: `day-${reading.idx}`,
      date: reading.date,
      dayIndex: reading.idx,
      metadata: reading.verses || "",
      books: parsePassageString(reading.passage)
    }));
  }

  /* ================================================================
     State Persistence
     ================================================================ */

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.calendarDays && Array.isArray(parsed.calendarDays)) {
          state = parsed;
          return true;
        }
      }
    } catch (e) {
      console.warn("Failed to load state:", e);
    }
    return false;
  }

  function resetPlan() {
    if (!confirm("Clear all reading progress? This cannot be undone.")) return;
    state = {
      calendarDays: [],
      settings: { quoteIndex: -1 }
    };
    initializeCalendarData();
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
      cell.draggable = true;
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

  function createBookElement(dayId, book) {
    const bookEl = document.createElement("div");
    bookEl.className = "book";
    bookEl.dataset.dayId = dayId;
    bookEl.dataset.bookId = book.id;
    bookEl.draggable = true;

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

    header.appendChild(checkbox);
    header.appendChild(title);
    header.appendChild(progress);
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
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const label = document.getElementById("monthLabel");
    label.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
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

  function updateQuote() {
    if (!window.QUOTES || QUOTES.length === 0) return;

    state.settings.quoteIndex = (state.settings.quoteIndex + 1) % QUOTES.length;
    saveState();

    const q = QUOTES[state.settings.quoteIndex];
    document.getElementById("quoteText").textContent = q.text;
    document.getElementById("quoteSource").textContent = q.source ? `— ${q.source}` : "";
  }

  function render() {
    renderCalendar();
    updateMonthLabel();
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

    document.querySelector(".file-label").addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT") {
        document.getElementById("csvFileInput").click();
      }
    });

    document.getElementById("exportBtn").addEventListener("click", exportPlan);

    document.getElementById("resetBtn").addEventListener("click", resetPlan);

    document.getElementById("quoteBanner").addEventListener("click", updateQuote);
  }

  /* ================================================================
     Initialization
     ================================================================ */

  function init() {
    if (!loadState()) {
      initializeCalendarData();
      saveState();
    }

    currentDate = getIndonesiaToday();

    attachEventHandlers();
    initDragAndDrop();
    initSidebarResize();
    render();
    updateClock();
    updateQuote();

    setInterval(updateClock, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
