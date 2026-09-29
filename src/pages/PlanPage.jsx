import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_TRANSLATION_ID } from "../lib/helloao";
import { GROUP_COLORS } from "../lib/bibleBooks";
import { buildMonthGrid, monthLabel, WEEKDAY_LABELS } from "../lib/calendarGrid";
import { useCalendarView } from "../context/CalendarViewContext";
import { usePlan } from "../context/PlanContext";
import { useTheme } from "../context/ThemeContext";
import { dataApi } from "../lib/dataApi";

const MAX_VISIBLE_PILLS = 3;
const TIME_FORMAT_KEY = "bible-plan-time-format";

/** Groups one day's schedule rows by book and collapses each book's
 * chapters into comma-separated contiguous ranges, e.g. a book with
 * chapters 9, 20, 21 scheduled the same day renders as "9, 20-21" instead
 * of a misleading single range. */
function pillsForDate(rows) {
  const byBook = new Map();
  for (const row of rows) {
    if (!byBook.has(row.book)) byBook.set(row.book, []);
    byBook.get(row.book).push(row);
  }
  const pills = [];
  for (const [bookId, bookRows] of byBook) {
    const sorted = [...bookRows].sort((a, b) => a.chapter - b.chapter);
    const runs = [];
    for (const row of sorted) {
      const last = runs[runs.length - 1];
      if (last && row.chapter === last.end + 1) {
        last.end = row.chapter;
        last.rowIds.push(row.id);
      } else {
        runs.push({ start: row.chapter, end: row.chapter, rowIds: [row.id] });
      }
    }
    const rangeText = runs.map((r) => (r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`)).join(", ");
    pills.push({
      bookId,
      bookName: sorted[0].book_name || bookId,
      category: sorted[0].category,
      rangeText,
      startChapter: sorted[0].chapter,
      rowIds: sorted.map((r) => r.id)
    });
  }
  return pills;
}

function parseDragPayload(e) {
  try {
    return JSON.parse(e.dataTransfer.getData("text/plain"));
  } catch {
    return null;
  }
}

export default function PlanPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const {
    viewYear,
    viewMonth,
    selectedDate,
    todayString,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    setSelectedDate
  } = useCalendarView();
  const { scheduleByDate, loading, toggleChapter, moveRowsToDate } = usePlan();

  const [overflowDate, setOverflowDate] = useState(null);
  const [expandedBooks, setExpandedBooks] = useState(new Set());
  const [dragOverDate, setDragOverDate] = useState(null);
  const [now, setNow] = useState(new Date());
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem(TIME_FORMAT_KEY) || "12h");
  const [numberPosition, setNumberPosition] = useState("right");

  useEffect(() => {
    dataApi.getSettings().then(({ data }) => {
      if (data?.preferences?.dateNumberPosition) setNumberPosition(data.preferences.dateNumberPosition);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(TIME_FORMAT_KEY, timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    // Keyboard navigation: left/right arrows move between months.
    function handleKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") goToPrevMonth();
      if (e.key === "ArrowRight") goToNextMonth();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToPrevMonth, goToNextMonth]);

  const cells = buildMonthGrid(viewYear, viewMonth);

  function openDay(date) {
    const rows = scheduleByDate.get(date) || [];
    const firstBook = rows[0]?.book;
    setExpandedBooks(firstBook ? new Set([firstBook]) : new Set());
    setOverflowDate(date);
  }

  function toggleBookExpanded(bookId) {
    setExpandedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  function handlePillDragStart(e, pill) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "book", rowIds: pill.rowIds }));
  }

  function handleChapterDragStart(e, row) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "chapter", rowIds: [row.id] }));
    setOverflowDate(null); // "left hold closes the popup" -- let the grid receive the drop
  }

  function handleDrop(e, date) {
    e.preventDefault();
    setDragOverDate(null);
    const payload = parseDragPayload(e);
    if (!payload?.rowIds?.length) return;
    moveRowsToDate(payload.rowIds, date);
  }

  const overflowRows = overflowDate ? scheduleByDate.get(overflowDate) || [] : [];
  const overflowByBook = useMemo(() => {
    const map = new Map();
    for (const row of overflowRows) {
      if (!map.has(row.book)) map.set(row.book, []);
      map.get(row.book).push(row);
    }
    for (const list of map.values()) list.sort((a, b) => a.chapter - b.chapter);
    return map;
  }, [overflowRows]);

  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "12h"
  });

  if (loading) {
    return <p className="reader-loading">Building your plan…</p>;
  }

  return (
    <div className="calendar-page">
      <div className="calendar-grid-wrap">
        <div className="calendar-weekdays">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w.toUpperCase()}</span>
          ))}
        </div>

        <div className="calendar-month-grid">
          {cells.map((cell) => {
            const rows = scheduleByDate.get(cell.date) || [];
            const pills = pillsForDate(rows);
            const visible = pills.slice(0, MAX_VISIBLE_PILLS);
            const overflowCount = pills.length - visible.length;
            const isToday = cell.date === todayString;
            const isSelected = cell.date === selectedDate;
            const isFullyRead = rows.length > 0 && rows.every((r) => r.completed);

            return (
              <div
                key={cell.date}
                className={`cal-day-cell${cell.isCurrentMonth ? "" : " muted"}${isSelected ? " selected" : ""}${
                  isFullyRead ? " done" : ""
                }${dragOverDate === cell.date ? " drag-over" : ""}`}
                onClick={() => setSelectedDate(cell.date)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverDate(cell.date);
                }}
                onDragLeave={() => setDragOverDate((d) => (d === cell.date ? null : d))}
                onDrop={(e) => handleDrop(e, cell.date)}
              >
                <div className={`cal-day-number-row pos-${numberPosition}`}>
                  <span className={`cal-day-number${isToday ? " today" : ""}`}>{cell.day}</span>
                </div>

                {pills.length > 0 && (
                  <div className="cal-day-events">
                    {visible.map((pill) => (
                      <button
                        key={pill.bookId}
                        type="button"
                        draggable
                        className="cal-event-pill"
                        style={{ background: GROUP_COLORS[pill.category].bg, color: GROUP_COLORS[pill.category].text }}
                        onDragStart={(e) => handlePillDragStart(e, pill)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDay(cell.date);
                        }}
                        title={`${pill.bookName} ${pill.rangeText}`}
                      >
                        <span className="cal-event-name">{pill.bookName}</span>
                        <span className="cal-event-range">{pill.rangeText}</span>
                      </button>
                    ))}
                    {overflowCount > 0 && (
                      <button
                        type="button"
                        className="cal-day-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDay(cell.date);
                        }}
                      >
                        {overflowCount} more
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-bottom-bar">
        <div className="calendar-bottom-left">
          <button
            className="icon-btn theme-toggle-btn"
            type="button"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            title="Toggle dark/light mode"
          >
            {mode === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                <path
                  d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <span className="calendar-date-text">{dateLabel}</span>
          <button
            type="button"
            className="time-format-btn"
            onClick={() => setTimeFormat((f) => (f === "12h" ? "24h" : "12h"))}
            title="Switch AM/PM \u2194 24-hour"
          >
            {timeLabel}
          </button>
        </div>

        <div className="calendar-bottom-right">
          <button className="icon-btn" type="button" onClick={goToPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <span className="calendar-bottom-title">{monthLabel(viewYear, viewMonth)}</span>
          <button className="icon-btn" type="button" onClick={goToNextMonth} aria-label="Next month">
            ›
          </button>
          <button className="btn today-btn" type="button" onClick={goToToday}>
            Today
          </button>
        </div>
      </div>

      {overflowDate && (
        <div className="cal-overlay" onClick={() => setOverflowDate(null)}>
          <div className="cal-popup" onClick={(e) => e.stopPropagation()}>
            <div className="cal-popup-header">
              <h2>{overflowDate}</h2>
              <button className="btn-ghost btn" type="button" onClick={() => setOverflowDate(null)}>
                Close
              </button>
            </div>

            {overflowByBook.size === 0 && <p className="hint-text">Nothing scheduled this day.</p>}

            <div className="popup-book-list">
              {[...overflowByBook.entries()].map(([bookId, bookRows]) => {
                const isOpen = expandedBooks.has(bookId);
                return (
                  <div className="popup-book-section" key={bookId}>
                    <button type="button" className="popup-book-header" onClick={() => toggleBookExpanded(bookId)}>
                      <span className={`popup-chevron${isOpen ? " open" : ""}`}>›</span>
                      <span
                        className="popup-book-dot"
                        style={{ background: GROUP_COLORS[bookRows[0].category].bg }}
                      />
                      {bookRows[0].book_name || bookId}
                    </button>
                    {isOpen && (
                      <div className="popup-chapter-list">
                        {bookRows.map((row) => (
                          <div
                            key={row.id}
                            className="popup-chapter-row"
                            draggable
                            onDragStart={(e) => handleChapterDragStart(e, row)}
                            onClick={() =>
                              navigate(`/bible/${DEFAULT_TRANSLATION_ID}/${row.book}/${row.chapter}`)
                            }
                          >
                            <span className="popup-chapter-num">{row.chapter}</span>
                            <label
                              className="popup-chapter-read"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={row.completed}
                                onChange={() => toggleChapter(row)}
                              />
                              Read
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
