/* ==========================================================================
   Bible Plan — script.js
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "biblePlan.v1";

  /* ================================================================
     1. Date helpers
     ================================================================ */

  function parseISODate(s) {
    var parts = s.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function toISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function startOfDay(date) {
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isSameDay(a, b) {
    return toISODate(a) === toISODate(b);
  }

  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  /* ================================================================
     2. State management
     ================================================================ */

  var PLAN_START = parseISODate(READINGS[0].date);

  function defaultState() {
    return {
      readStatus: {},
      quoteIndex: -1
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.readStatus ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  var state = loadState() || defaultState();
  var storageAvailable = true;

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      storageAvailable = false;
    }
  }

  /* ================================================================
     3. Actions
     ================================================================ */

  function toggleRead(idx) {
    var key = String(idx);
    state.readStatus[key] = !state.readStatus[key];
    saveState();
    renderCalendar();
  }

  /* ================================================================
     4. Rendering calendar view
     ================================================================ */

  function renderCalendar() {
    var grid = document.getElementById("calendarGrid");
    if (!grid) return;
    
    grid.innerHTML = "";
    var today = startOfDay(new Date());
    
    READINGS.forEach(function (reading, dayIndex) {
      var cell = document.createElement("div");
      var readingDate = parseISODate(reading.date);
      var isToday = isSameDay(readingDate, today);
      var isRead = !!state.readStatus[String(reading.idx)];
      var isMissed = readingDate < today && !isRead;

      cell.className = "day-cell";
      if (isToday) cell.classList.add("today");
      if (isRead) cell.classList.add("read");
      if (isMissed) cell.classList.add("missed");

      // Date header
      var dateDiv = document.createElement("div");
      dateDiv.className = "day-header";
      var dayNum = document.createElement("div");
      dayNum.className = "day-number";
      dayNum.textContent = readingDate.getDate();
      dateDiv.appendChild(dayNum);
      cell.appendChild(dateDiv);

      // Readings container
      var readingsDiv = document.createElement("div");
      readingsDiv.className = "readings-container";

      // Create book blocks for this day's reading
      var bookBlocks = parseReadingPassages(reading.passage);
      bookBlocks.forEach(function (book) {
        var details = document.createElement("details");
        details.className = "book-block";
        if (isRead) details.classList.add("completed-book");

        var summary = document.createElement("summary");
        summary.className = "book-header";

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "book-checkbox";
        checkbox.checked = isRead;
        checkbox.addEventListener("change", function () {
          toggleRead(reading.idx);
        });

        var title = document.createElement("span");
        title.className = "book-title";
        if (isRead) title.classList.add("completed-text");
        title.textContent = book.title;

        var icon = document.createElement("span");
        icon.className = "expand-icon";
        icon.textContent = "▶";

        summary.appendChild(checkbox);
        summary.appendChild(title);
        summary.appendChild(icon);
        details.appendChild(summary);

        // Chapters list
        var chapterList = document.createElement("div");
        chapterList.className = "chapter-list";
        book.chapters.forEach(function (chapter) {
          var item = document.createElement("div");
          item.className = "chapter-item";

          var chapterCheckbox = document.createElement("input");
          chapterCheckbox.type = "checkbox";
          chapterCheckbox.className = "chapter-checkbox";
          chapterCheckbox.checked = isRead;
          chapterCheckbox.addEventListener("change", function () {
            toggleRead(reading.idx);
          });

          var label = document.createElement("span");
          label.className = "chapter-label";
          if (isRead) label.classList.add("completed-text");
          label.textContent = chapter;

          item.appendChild(chapterCheckbox);
          item.appendChild(label);
          chapterList.appendChild(item);
        });
        details.appendChild(chapterList);
        readingsDiv.appendChild(details);
      });

      cell.appendChild(readingsDiv);
      grid.appendChild(cell);
    });

    updateProgress();
  }

  function parseReadingPassages(passageStr) {
    // Split by semicolon to get books
    var books = passageStr.split(";").map(function (s) { return s.trim(); });
    
    return books.map(function (bookStr) {
      // e.g., "Gen 1-7" or "Mat 1-2"
      var match = bookStr.match(/^([A-Z a-z]+?)\s+(.+)$/);
      if (!match) return { title: bookStr, chapters: [bookStr] };

      var bookCode = match[1].trim();
      var chaptersStr = match[2].trim();

      // Expand chapter ranges: "1-7" becomes ["1", "2", "3", ...]
      var chapters = [];
      var ranges = chaptersStr.split(",").map(function (s) { return s.trim(); });
      ranges.forEach(function (range) {
        if (range.includes("-")) {
          var parts = range.split("-").map(Number);
          for (var i = parts[0]; i <= parts[1]; i++) {
            chapters.push(String(i));
          }
        } else {
          chapters.push(range);
        }
      });

      return {
        title: bookCode,
        chapters: chapters
      };
    });
  }

  function updateProgress() {
    var readCount = 0;
    READINGS.forEach(function (reading) {
      if (state.readStatus[String(reading.idx)]) {
        readCount++;
      }
    });

    var totalVerses = 0;
    READINGS.forEach(function (reading) {
      if (reading.verses) totalVerses += reading.verses;
    });

    var readVerses = 0;
    READINGS.forEach(function (reading) {
      if (state.readStatus[String(reading.idx)] && reading.verses) {
        readVerses += reading.verses;
      }
    });

    var total = READINGS.length;
    var pct = total ? (readCount / total) * 100 : 0;
  }

  /* ================================================================
     5. UI Wiring
     ================================================================ */

  var clockDateEl = document.getElementById("clockDate");
  var clockTimeEl = document.getElementById("clockTime");
  var quoteContainer = document.getElementById("quoteContainer");

  function tickClock() {
    if (!clockDateEl || !clockTimeEl) return;
    var now = new Date();
    clockDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    clockTimeEl.textContent = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function showNextQuote() {
    if (!quoteContainer || typeof QUOTES === "undefined") return;
    state.quoteIndex = (state.quoteIndex + 1) % QUOTES.length;
    saveState();
    var q = QUOTES[state.quoteIndex];
    quoteContainer.textContent = q.text + (q.source ? " — " + q.source : "");
  }

  // Calendar navigation
  var todayBtn = document.getElementById("todayBtn");
  if (todayBtn) {
    todayBtn.addEventListener("click", function () {
      var grid = document.getElementById("calendarGrid");
      if (grid) {
        var todayCell = grid.querySelector(".day-cell.today");
        if (todayCell) {
          todayCell.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  // Import CSV
  var csvFileInput = document.getElementById("csvFileInput");
  var importBtn = document.getElementById("importBtn");
  if (importBtn && csvFileInput) {
    importBtn.addEventListener("click", function () {
      csvFileInput.click();
    });

    csvFileInput.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function (event) {
          console.log("CSV import not yet implemented");
        };
        reader.readAsText(file);
      }
    });
  }

  // Export backup
  var exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var dataStr = JSON.stringify(state, null, 2);
      var dataBlob = new Blob([dataStr], { type: "application/json" });
      var url = URL.createObjectURL(dataBlob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "bible-plan-backup-" + toISODate(new Date()) + ".json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // Reset plan
  var resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (confirm("Are you sure? This will clear all reading progress.")) {
        state = defaultState();
        saveState();
        renderCalendar();
      }
    });
  }

  /* ================================================================
     Boot
     ================================================================ */

  tickClock();
  setInterval(tickClock, 1000);
  showNextQuote();
  renderCalendar();

  if (!storageAvailable) {
    console.warn("Bible Plan: localStorage unavailable, progress will not be saved.");
  }
})();
