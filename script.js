/* ==========================================================================
   Bible Plan — script.js
   Complete application logic with calendar rendering and progress tracking
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "biblePlan.v1";

  /* ================================================================
     Date Helpers
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
     State Management
     ================================================================ */

  var PLAN_START = typeof READINGS !== "undefined" && READINGS.length > 0 
    ? parseISODate(READINGS[0].date) 
    : new Date();

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
      return parsed && typeof parsed.readStatus === "object" ? parsed : null;
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
     Actions
     ================================================================ */

  function toggleRead(idx) {
    var key = String(idx);
    state.readStatus[key] = !state.readStatus[key];
    saveState();
    renderCalendar();
    updateProgress();
  }

  /* ================================================================
     Rendering
     ================================================================ */

  function parseReadingPassages(passageStr) {
    // Split by semicolon to get books, then parse each book with its chapters
    var books = passageStr.split(";").map(function (s) { return s.trim(); });
    
    return books.map(function (bookStr) {
      var match = bookStr.match(/^([A-Za-z0-9\s]+?)\s+(.+)$/);
      if (!match) return { title: bookStr, chapters: [] };

      var bookCode = match[1].trim();
      var chaptersStr = match[2].trim();

      // Expand chapter ranges: "1-7" becomes ["1", "2", "3", ...]
      var chapters = [];
      var ranges = chaptersStr.split(",").map(function (s) { return s.trim(); });
      
      ranges.forEach(function (range) {
        if (range.indexOf("-") > -1) {
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

  function renderCalendar() {
    var grid = document.getElementById("calendarGrid");
    if (!grid || typeof READINGS === "undefined") return;

    grid.innerHTML = "";
    var today = startOfDay(new Date());
    var lastMonthKey = null;

    READINGS.forEach(function (reading, dayIndex) {
      var readingDate = parseISODate(reading.date);
      var monthKey = readingDate.getFullYear() + "-" + readingDate.getMonth();

      // Insert month label if this is a new month
      if (monthKey !== lastMonthKey) {
        var monthDiv = document.createElement("div");
        monthDiv.className = "month-label";
        var monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        monthDiv.textContent = monthNames[readingDate.getMonth()] + " " + readingDate.getFullYear();
        grid.appendChild(monthDiv);
        lastMonthKey = monthKey;
      }

      var isToday = isSameDay(readingDate, today);
      var isRead = !!state.readStatus[String(reading.idx)];
      var isMissed = readingDate < today && !isRead;

      var cell = document.createElement("div");
      cell.className = "day-cell";
      if (isToday) cell.classList.add("is-today");
      if (isRead) cell.classList.add("is-read");
      if (isMissed) cell.classList.add("is-missed");

      // Date row with day name and number
      var dateRow = document.createElement("div");
      dateRow.className = "date-row";

      var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var dayWeekday = document.createElement("div");
      dayWeekday.className = "date-weekday";
      dayWeekday.textContent = dayNames[readingDate.getDay()];
      dateRow.appendChild(dayWeekday);

      var dateNum = document.createElement("div");
      dateNum.className = "date-number";
      dateNum.textContent = readingDate.getDate();
      dateRow.appendChild(dateNum);

      if (isToday) {
        var todayLabel = document.createElement("div");
        todayLabel.className = "today-label";
        todayLabel.textContent = "TODAY";
        dateRow.appendChild(todayLabel);
      }

      cell.appendChild(dateRow);

      // Parse and display passages
      var bookBlocks = parseReadingPassages(reading.passage);
      bookBlocks.forEach(function (book) {
        var passage = document.createElement("div");
        passage.className = "passage";
        passage.textContent = book.title;

        var passageBtn = document.createElement("button");
        passageBtn.className = "passage-btn";
        passageBtn.innerHTML = passage.outerHTML;
        passageBtn.setAttribute("data-idx", reading.idx);
        passageBtn.addEventListener("click", function (e) {
          e.preventDefault();
          toggleRead(reading.idx);
        });

        cell.appendChild(passageBtn);
      });

      // Verses badge
      if (reading.verses) {
        var versesBadge = document.createElement("div");
        versesBadge.className = "verses-badge";
        versesBadge.textContent = reading.verses + " v";
        cell.appendChild(versesBadge);
      }

      grid.appendChild(cell);
    });
  }

  function updateProgress() {
    var readCount = 0;
    var totalVerses = 0;
    var readVerses = 0;

    if (typeof READINGS !== "undefined") {
      READINGS.forEach(function (reading) {
        if (state.readStatus[String(reading.idx)]) {
          readCount++;
          if (reading.verses) readVerses += reading.verses;
        }
        if (reading.verses) totalVerses += reading.verses;
      });
    }

    var total = typeof READINGS !== "undefined" ? READINGS.length : 0;
    var progressDaysEl = document.getElementById("progressDays");
    var progressVersesEl = document.getElementById("progressVerses");
    var progressFillEl = document.getElementById("progressFill");

    if (progressDaysEl) progressDaysEl.textContent = readCount + " / " + total + " days";
    if (progressVersesEl) progressVersesEl.textContent = readVerses.toLocaleString() + " verses";
    if (progressFillEl) {
      progressFillEl.style.width = (total > 0 ? (readCount / total) * 100 : 0) + "%";
    }
  }

  /* ================================================================
     Clock & Quote
     ================================================================ */

  function tickClock() {
    var clockDateEl = document.getElementById("clockDate");
    var clockTimeEl = document.getElementById("clockTime");

    if (!clockDateEl || !clockTimeEl) return;

    var now = new Date();
    var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    clockDateEl.textContent =
      dayNames[now.getDay()] + ", " +
      monthNames[now.getMonth()] + " " +
      now.getDate();

    var hours = String(now.getHours()).padStart(2, "0");
    var minutes = String(now.getMinutes()).padStart(2, "0");
    var seconds = String(now.getSeconds()).padStart(2, "0");
    clockTimeEl.textContent = hours + ":" + minutes + ":" + seconds;
  }

  function showNextQuote() {
    if (typeof QUOTES === "undefined" || QUOTES.length === 0) return;

    state.quoteIndex = (state.quoteIndex + 1) % QUOTES.length;
    saveState();

    var q = QUOTES[state.quoteIndex];
    var quoteTextEl = document.getElementById("quoteText");
    var quoteSourceEl = document.getElementById("quoteSource");

    if (quoteTextEl) quoteTextEl.textContent = q.text;
    if (quoteSourceEl) {
      quoteSourceEl.textContent = q.source ? "— " + q.source : "";
    }
  }

  /* ================================================================
     Boot & Initialization
     ================================================================ */

  // Clock ticks
  tickClock();
  setInterval(tickClock, 1000);

  // Show initial quote
  showNextQuote();

  // Allow clicking quote to cycle
  var quoteSection = document.querySelector(".quote-banner");
  if (quoteSection) {
    quoteSection.style.cursor = "pointer";
    quoteSection.addEventListener("click", showNextQuote);
  }

  // Render calendar and progress
  renderCalendar();
  updateProgress();

  // Storage warning
  if (!storageAvailable) {
    console.warn("Bible Plan: localStorage unavailable, progress will not be saved.");
  }
})();
