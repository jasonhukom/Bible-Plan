/* ==========================================================================
   Bible Plan
   Calendar renderer + reading state
   ========================================================================== */

(function () {
  "use strict";


  /* --------------------------------------------------------------------------
     STORAGE
     -------------------------------------------------------------------------- */

  const STORAGE_KEY = "biblePlan.calendar.v2";


  /* --------------------------------------------------------------------------
     DATA
     -------------------------------------------------------------------------- */

  const FALLBACK_QUOTES = [
    {
      text: "Your word is a lamp for my feet, a light on my path.",
      source: "Psalm 119:105"
    },
    {
      text: "I have hidden your word in my heart that I might not sin against you.",
      source: "Psalm 119:11"
    },
    {
      text: "The grass withers and the flowers fall, but the word of our God endures forever.",
      source: "Isaiah 40:8"
    },
    {
      text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.",
      source: "2 Timothy 3:16"
    },
    {
      text: "For the word of God is alive and active.",
      source: "Hebrews 4:12"
    }
  ];


  const quotes =
    typeof QUOTES !== "undefined" && Array.isArray(QUOTES)
      ? QUOTES
      : FALLBACK_QUOTES;


  const readings =
    typeof READINGS !== "undefined" && Array.isArray(READINGS)
      ? READINGS
      : [];


  /* --------------------------------------------------------------------------
     BOOK NAME MAPPING
     -------------------------------------------------------------------------- */

  const bookNames = {
    "Gen": "Genesis",
    "Ex": "Exodus",
    "Lev": "Leviticus",
    "Num": "Numbers",
    "Deut": "Deuteronomy",

    "Jos": "Joshua",
    "Judg": "Judges",
    "Ruth": "Ruth",

    "1 Sa": "1 Samuel",
    "2 Sa": "2 Samuel",

    "1 Ki": "1 Kings",
    "2 Ki": "2 Kings",

    "1 Ch": "1 Chronicles",
    "2 Ch": "2 Chronicles",

    "Ezr": "Ezra",
    "Neh": "Nehemiah",
    "Est": "Esther",

    "Job": "Job",
    "Ps": "Psalms",
    "Pro": "Proverbs",

    "Ecc": "Ecclesiastes",
    "Song": "Song of Solomon",

    "Isa": "Isaiah",
    "Jer": "Jeremiah",
    "Lam": "Lamentations",
    "Eze": "Ezekiel",

    "Dan": "Daniel",
    "Hos": "Hosea",
    "Joel": "Joel",
    "Am": "Amos",
    "Ob": "Obadiah",

    "Jon": "Jonah",
    "Mic": "Micah",
    "Nah": "Nahum",
    "Hab": "Habakkuk",
    "Zep": "Zephaniah",

    "Hag": "Haggai",
    "Zec": "Zechariah",
    "Mal": "Malachi",

    "Mat": "Matthew",
    "Mk": "Mark",
    "Lk": "Luke",
    "Jn": "John",

    "Act": "Acts",
    "Rom": "Romans",

    "1 Co": "1 Corinthians",
    "2 Co": "2 Corinthians",

    "Gal": "Galatians",
    "Eph": "Ephesians",
    "Php": "Philippians",

    "Col": "Colossians",

    "1 Th": "1 Thessalonians",
    "2 Th": "2 Thessalonians",

    "1 Ti": "1 Timothy",
    "2 Ti": "2 Timothy",

    "Tit": "Titus",
    "Phm": "Philemon",

    "Heb": "Hebrews",
    "Jam": "James",

    "1 Pe": "1 Peter",
    "2 Pe": "2 Peter",

    "1 Jn": "1 John",
    "2 Jn": "2 John",
    "3 Jn": "3 John",

    "Jude": "Jude",
    "Rev": "Revelation"
  };


  /* --------------------------------------------------------------------------
     DATE HELPERS
     -------------------------------------------------------------------------- */

  function parseISODate(value) {
    if (!value) return new Date();

    const parts = String(value).split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return new Date(value);
    }

    return new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    );
  }


  function addDays(date, amount) {
    const result = new Date(date.getTime());

    result.setDate(
      result.getDate() + amount
    );

    return result;
  }


  function startOfDay(date) {
    const result = new Date(date.getTime());

    result.setHours(0, 0, 0, 0);

    return result;
  }


  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }


  function formatDate(date) {
    return date.toISOString().slice(0, 10);
  }


  /* --------------------------------------------------------------------------
     BOOK EXPANSION
     -------------------------------------------------------------------------- */

  function expandPassage(passage) {

    let expanded = String(passage);

    for (const [shortName, longName] of Object.entries(bookNames)) {

      const escaped = shortName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        "\\b" + escaped + "\\b",
        "g"
      );

      expanded = expanded.replace(
        regex,
        longName
      );
    }

    return expanded;
  }


  /* --------------------------------------------------------------------------
     STATE
     -------------------------------------------------------------------------- */

  const planStart =
    readings.length > 0
      ? parseISODate(readings[0].date)
      : new Date();


  function createDefaultState() {

    return {
      order: readings.map(
        (reading, index) =>
          "r-" +
          (
            reading.idx !== undefined
              ? reading.idx
              : index
          )
      ),

      readStatus: {},

      restCounter: 0,

      quoteIndex: -1
    };
  }


  function loadState() {

    try {

      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return createDefaultState();
      }

      const parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        !Array.isArray(parsed.order)
      ) {
        return createDefaultState();
      }

      if (
        !parsed.readStatus ||
        typeof parsed.readStatus !== "object"
      ) {
        parsed.readStatus = {};
      }

      if (
        typeof parsed.restCounter !== "number"
      ) {
        parsed.restCounter = 0;
      }

      return parsed;

    } catch (error) {

      console.warn(
        "Bible Plan: could not load saved state.",
        error
      );

      return createDefaultState();
    }
  }


  let state = loadState();


  function saveState() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

    } catch (error) {

      console.warn(
        "Bible Plan: could not save state.",
        error
      );
    }
  }


  /* --------------------------------------------------------------------------
     RECONCILE STATE
     -------------------------------------------------------------------------- */

  function reconcileState() {

    const validReadingKeys =
      new Set(
        readings.map(
          (reading, index) =>
            "r-" +
            (
              reading.idx !== undefined
                ? reading.idx
                : index
            )
        )
      );


    state.order = state.order.filter(
      key =>
        key.startsWith("rest-") ||
        validReadingKeys.has(key)
    );


    const present = new Set(state.order);


    readings.forEach(
      (reading, index) => {

        const key =
          "r-" +
          (
            reading.idx !== undefined
              ? reading.idx
              : index
          );

        if (!present.has(key)) {
          state.order.push(key);
        }
      }
    );
  }


  reconcileState();
  saveState();


  /* --------------------------------------------------------------------------
     DOM
     -------------------------------------------------------------------------- */

  const calendarGrid =
    document.getElementById("calendarGrid");

  const clockDate =
    document.getElementById("clockDate");

  const clockTime =
    document.getElementById("clockTime");

  const quoteText =
    document.getElementById("quoteText");

  const quoteSource =
    document.getElementById("quoteSource");

  const progressCount =
    document.getElementById("progressCount");

  const progressVerses =
    document.getElementById("progressVerses");

  const progressFill =
    document.getElementById("progressFill");

  const jumpToday =
    document.getElementById("jumpToday");


  /* --------------------------------------------------------------------------
     ICONS
     -------------------------------------------------------------------------- */

  const ICON_CHECK = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="4,13 9,18 20,6"/>
    </svg>
  `;


  const ICON_X = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <line x1="5" y1="5" x2="19" y2="19"/>
      <line x1="19" y1="5" x2="5" y2="19"/>
    </svg>
  `;


  const ICON_TRASH = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="7" x2="19" y2="7"/>
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      <path d="M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"/>
    </svg>
  `;


  /* --------------------------------------------------------------------------
     ESCAPE HTML
     -------------------------------------------------------------------------- */

  function escapeHtml(value) {

    return String(value).replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );
  }


  /* --------------------------------------------------------------------------
     FIND READING
     -------------------------------------------------------------------------- */

  function getReadingFromKey(key) {

    if (!key.startsWith("r-")) {
      return null;
    }

    const idx =
      Number(key.slice(2));

    return readings.find(
      (reading, index) =>
        (
          reading.idx !== undefined
            ? reading.idx
            : index
        ) === idx
    ) || readings[idx] || null;
  }


  /* --------------------------------------------------------------------------
     TOGGLE READ
     -------------------------------------------------------------------------- */

  function toggleRead(key) {

    const reading =
      getReadingFromKey(key);

    if (!reading) return;

    const idx =
      reading.idx !== undefined
        ? String(reading.idx)
        : String(
            readings.indexOf(reading)
          );

    state.readStatus[idx] =
      !state.readStatus[idx];

    saveState();
    render();
  }


  /* --------------------------------------------------------------------------
     PUSH READING FORWARD
     -------------------------------------------------------------------------- */

  function pushForward(key, days) {

    const position =
      state.order.indexOf(key);

    if (position === -1) {
      return;
    }


    const newRestDays = [];

    for (
      let i = 0;
      i < days;
      i++
    ) {

      state.restCounter++;

      newRestDays.push(
        "rest-" +
        state.restCounter
      );
    }


    state.order.splice(
      position,
      0,
      ...newRestDays
    );


    saveState();

    render();
  }


  /* --------------------------------------------------------------------------
     REMOVE REST DAY
     -------------------------------------------------------------------------- */

  function removeRestDay(key) {

    const position =
      state.order.indexOf(key);

    if (position === -1) {
      return;
    }

    state.order.splice(
      position,
      1
    );

    saveState();

    render();
  }


  /* --------------------------------------------------------------------------
     DRAG AND DROP
     -------------------------------------------------------------------------- */

  let draggedKey = null;


  function handleDragStart(event, key) {

    draggedKey = key;

    event.dataTransfer.effectAllowed = "move";

    event.currentTarget
      .closest(".day-cell")
      ?.classList.add("dragging");
  }


  function handleDragEnd(event) {

    event.currentTarget
      .closest(".day-cell")
      ?.classList.remove("dragging");

    document
      .querySelectorAll(".day-cell.drag-over")
      .forEach(cell =>
        cell.classList.remove("drag-over")
      );

    draggedKey = null;
  }


  function handleDragOver(event) {

    event.preventDefault();

    event.currentTarget
      .classList.add("drag-over");

    event.dataTransfer.dropEffect = "move";
  }


  function handleDragLeave(event) {

    event.currentTarget
      .classList.remove("drag-over");
  }


  function handleDrop(event, targetKey) {

    event.preventDefault();

    event.currentTarget
      .classList.remove("drag-over");

    if (!draggedKey) {
      return;
    }

    if (draggedKey === targetKey) {
      return;
    }


    const oldIndex =
      state.order.indexOf(draggedKey);

    const newIndex =
      state.order.indexOf(targetKey);


    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }


    const moved =
      state.order.splice(
        oldIndex,
        1
      )[0];


    state.order.splice(
      newIndex,
      0,
      moved
    );


    saveState();

    render();

    draggedKey = null;
  }


  /* --------------------------------------------------------------------------
     CREATE DAY CELL
     -------------------------------------------------------------------------- */

  function createReadingCell(
    key,
    position,
    date,
    reading
  ) {

    const cell =
      document.createElement("div");

    const today =
      startOfDay(new Date());

    const isToday =
      isSameDay(
        date,
        today
      );


    const readingIndex =
      reading.idx !== undefined
        ? String(reading.idx)
        : String(
            readings.indexOf(reading)
          );


    const isRead =
      !!state.readStatus[
        readingIndex
      ];


    const isMissed =
      date < today &&
      !isToday &&
      !isRead;


    cell.className =
      "day-cell" +
      (
        isToday
          ? " is-today"
          : ""
      ) +
      (
        isRead
          ? " is-read"
          : ""
      ) +
      (
        isMissed
          ? " is-missed"
          : ""
      );


    cell.dataset.key = key;


    /* DROP EVENTS */

    cell.addEventListener(
      "dragover",
      handleDragOver
    );

    cell.addEventListener(
      "dragleave",
      handleDragLeave
    );

    cell.addEventListener(
      "drop",
      event =>
        handleDrop(
          event,
          key
        )
    );


    /* DATE */

    const dateRow =
      document.createElement("div");

    dateRow.className =
      "date-row";


    const dateInfo =
      document.createElement("div");

    const weekday =
      date.toLocaleDateString(
        undefined,
        { weekday: "short" }
      );


    dateInfo.innerHTML =
      `
        <div class="date-weekday">
          ${escapeHtml(weekday)}
        </div>

        <div class="date-number">
          ${date.getDate()}
        </div>
      `;


    dateRow.appendChild(dateInfo);


    if (isToday) {

      const todayBadge =
        document.createElement("span");

      todayBadge.className =
        "today-label";

      todayBadge.textContent =
        "Today";

      dateRow.appendChild(
        todayBadge
      );
    }


    cell.appendChild(
      dateRow
    );


    /* PASSAGE */

    const passage =
      document.createElement("div");

    passage.className =
      "passage";

    passage.textContent =
      expandPassage(
        reading.passage ||
        reading.text ||
        ""
      );

    passage.draggable = true;


    passage.addEventListener(
      "dragstart",
      event =>
        handleDragStart(
          event,
          key
        )
    );


    passage.addEventListener(
      "dragend",
      handleDragEnd
    );


    cell.appendChild(
      passage
    );


    /* VERSES */

    if (reading.verses) {

      const verses =
        document.createElement("div");

      verses.className =
        "verses-badge";

      verses.textContent =
        reading.verses +
        " verses";

      cell.appendChild(
        verses
      );
    }


    /* ACTIONS */

    const actions =
      document.createElement("div");

    actions.className =
      "actions";


    const checkButton =
      document.createElement("button");

    checkButton.type =
      "button";

    checkButton.className =
      "btn-read";

    checkButton.setAttribute(
      "aria-pressed",
      isRead
        ? "true"
        : "false"
    );

    checkButton.setAttribute(
      "aria-label",
      isRead
        ? "Mark as unread"
        : "Mark as read"
    );

    checkButton.innerHTML =
      ICON_CHECK;

    checkButton.addEventListener(
      "click",
      () => toggleRead(key)
    );


    const skipButton =
      document.createElement("button");

    skipButton.type =
      "button";

    skipButton.className =
      "btn-skip";

    skipButton.setAttribute(
      "aria-expanded",
      "false"
    );

    skipButton.setAttribute(
      "aria-label",
      "Skip this reading"
    );

    skipButton.innerHTML =
      ICON_X;


    actions.appendChild(
      checkButton
    );

    actions.appendChild(
      skipButton
    );

    cell.appendChild(
      actions
    );


    /* SKIP PANEL */

    const skipPanel =
      document.createElement("div");

    skipPanel.className =
      "skip-panel";

    skipPanel.hidden = true;


    const skipText =
      document.createElement("span");

    skipText.textContent =
      "Push this reading forward by:";

    skipPanel.appendChild(
      skipText
    );


    [1, 2, 4].forEach(
      days => {

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.textContent =
          days +
          (
            days === 1
              ? " day"
              : " days"
          );


        button.addEventListener(
          "click",
          () =>
            pushForward(
              key,
              days
            )
        );


        skipPanel.appendChild(
          button
        );
      }
    );


    const cancel =
      document.createElement(
        "button"
      );

    cancel.type =
      "button";

    cancel.className =
      "cancel";

    cancel.textContent =
      "Cancel";


    cancel.addEventListener(
      "click",
      () => {

        skipPanel.hidden =
          true;

        skipButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    );


    skipPanel.appendChild(
      cancel
    );


    skipButton.addEventListener(
      "click",
      () => {

        const shouldOpen =
          skipPanel.hidden;

        document
          .querySelectorAll(
            ".skip-panel"
          )
          .forEach(panel => {
            panel.hidden = true;
          });


        document
          .querySelectorAll(
            ".btn-skip"
          )
          .forEach(button => {
            button.setAttribute(
              "aria-expanded",
              "false"
            );
          });


        if (shouldOpen) {

          skipPanel.hidden =
            false;

          skipButton.setAttribute(
            "aria-expanded",
            "true"
          );
        }
      }
    );


    cell.appendChild(
      skipPanel
    );


    return cell;
  }


  /* --------------------------------------------------------------------------
     CREATE REST CELL
     -------------------------------------------------------------------------- */

  function createRestCell(
    key,
    date
  ) {

    const cell =
      document.createElement("div");

    cell.className =
      "day-cell rest-day";

    cell.dataset.key =
      key;


    cell.innerHTML =
      `
        <div class="date-row">

          <div>
            <div class="date-weekday">
              ${escapeHtml(
                date.toLocaleDateString(
                  undefined,
                  { weekday: "short" }
                )
              )}
            </div>

            <div class="date-number">
              ${date.getDate()}
            </div>
          </div>

          <button
            type="button"
            class="btn-remove-rest"
            aria-label="Remove rest day"
            title="Remove rest day"
          >
            ${ICON_TRASH}
          </button>

        </div>

        <div class="rest-content">
          <div class="rest-label">
            Rest day
          </div>
        </div>
      `;


    cell
      .querySelector(
        ".btn-remove-rest"
      )
      .addEventListener(
        "click",
        () =>
          removeRestDay(key)
      );


    cell.addEventListener(
      "dragover",
      handleDragOver
    );

    cell.addEventListener(
      "dragleave",
      handleDragLeave
    );

    cell.addEventListener(
      "drop",
      event =>
        handleDrop(
          event,
          key
        )
    );


    return cell;
  }


  /* --------------------------------------------------------------------------
     RENDER CALENDAR
     -------------------------------------------------------------------------- */

  function render() {

    calendarGrid.innerHTML = "";


    if (readings.length === 0) {

      const empty =
        document.createElement("div");

      empty.className =
        "month-label";

      empty.textContent =
        "No reading data found. Make sure readings-data.js is loaded.";

      calendarGrid.appendChild(
        empty
      );

      updateProgress();

      return;
    }


    const today =
      startOfDay(new Date());


    let previousMonth =
      null;


    state.order.forEach(
      (key, position) => {

        const date =
          addDays(
            planStart,
            position
          );


        const monthKey =
          date.getFullYear() +
          "-" +
          date.getMonth();


        if (
          monthKey !==
          previousMonth
        ) {

          const monthLabel =
            document.createElement(
              "div"
            );

          monthLabel.className =
            "month-label";

          monthLabel.textContent =
            date.toLocaleDateString(
              undefined,
              {
                month: "long",
                year: "numeric"
              }
            );


          calendarGrid.appendChild(
            monthLabel
          );


          previousMonth =
            monthKey;
        }


        let cell;


        if (
          key.startsWith(
            "rest-"
          )
        ) {

          cell =
            createRestCell(
              key,
              date
            );

        } else {

          const reading =
            getReadingFromKey(
              key
            );

          if (!reading) {
            return;
          }

          cell =
            createReadingCell(
              key,
              position,
              date,
              reading
            );
        }


        cell.dataset.date =
          formatDate(date);

        cell.dataset.position =
          String(position);


        if (
          isSameDay(
            date,
            today
          )
        ) {
          cell.id =
            "calendar-today";
        }


        calendarGrid.appendChild(
          cell
        );
      }
    );


    updateProgress();
  }


  /* --------------------------------------------------------------------------
     PROGRESS
     -------------------------------------------------------------------------- */

  function updateProgress() {

    let readCount = 0;

    let verseCount = 0;


    readings.forEach(
      (reading, index) => {

        const readingIndex =
          reading.idx !== undefined
            ? String(reading.idx)
            : String(index);


        if (
          state.readStatus[
            readingIndex
          ]
        ) {

          readCount++;

          verseCount +=
            Number(
              reading.verses
            ) || 0;
        }
      }
    );


    const total =
      readings.length;


    progressCount.textContent =
      readCount +
      " / " +
      total +
      " days read";


    progressVerses.textContent =
      verseCount.toLocaleString() +
      " verses read";


    progressFill.style.width =
      (
        total > 0
          ? (readCount / total) * 100
          : 0
      ) +
      "%";
  }


  /* --------------------------------------------------------------------------
     QUOTES
     -------------------------------------------------------------------------- */

  function showNextQuote() {

    if (!quotes.length) {
      return;
    }


    state.quoteIndex =
      (
        state.quoteIndex + 1
      ) %
      quotes.length;


    saveState();


    const quote =
      quotes[state.quoteIndex];


    if (
      typeof quote === "string"
    ) {

      quoteText.textContent =
        quote;

      quoteSource.textContent =
        "";

      return;
    }


    quoteText.textContent =
      quote.text || "";


    quoteSource.textContent =
      quote.source
        ? "— " + quote.source
        : "";
  }


  /* --------------------------------------------------------------------------
     CLOCK
     -------------------------------------------------------------------------- */

  function tickClock() {

    const now =
      new Date();


    clockDate.textContent =
      now.toLocaleDateString(
        undefined,
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
        }
      );


    clockTime.textContent =
      now.toLocaleTimeString(
        undefined,
        {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit"
        }
      );
  }


  /* --------------------------------------------------------------------------
     TODAY BUTTON
     -------------------------------------------------------------------------- */

  jumpToday.addEventListener(
    "click",
    () => {

      const today =
        document.getElementById(
          "calendar-today"
        );

      if (!today) {
        return;
      }

      today.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  );


  /* --------------------------------------------------------------------------
     BOOT
     -------------------------------------------------------------------------- */

  render();

  showNextQuote();

  tickClock();

  setInterval(
    tickClock,
    1000
  );


  /* --------------------------------------------------------------------------
     INITIAL TODAY POSITION
     -------------------------------------------------------------------------- */

  window.requestAnimationFrame(
    () => {

      const today =
        document.getElementById(
          "calendar-today"
        );

      if (today) {

        today.scrollIntoView({
          behavior: "auto",
          block: "center"
        });
      }
    }
  );

})();