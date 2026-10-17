import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPreferredTranslation } from "../lib/bible";
import { GROUP_COLORS, BOOK_NAMES, getLongBookName, getShortBookName } from "../lib/bibleBooks";
import { buildMonthGrid, monthLabel, WEEKDAY_SHORT_LABELS, WEEKDAY_FULL_LABELS } from "../lib/calendarGrid";
import { useCalendarView } from "../context/CalendarViewContext";
import { usePlan } from "../context/PlanContext";
import { useTheme } from "../context/ThemeContext";
import { dataApi } from "../lib/dataApi";
import OnboardingModal from "../components/OnboardingModal";

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
    const bookFullName = getLongBookName(bookId, sorted[0].book_name);
    const shortBookName = getShortBookName(bookId, bookFullName);

    pills.push({
      bookId,
      bookName: bookFullName,
      shortBookName,
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

function formatDetailDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
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
  const [dragOverDate, setDragOverDate] = useState(null);
  const [now, setNow] = useState(new Date());
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem(TIME_FORMAT_KEY) || "12h");
  const [numberPosition, setNumberPosition] = useState("right");
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("bible-plan-onboarded"));
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720);

  // Touch swipe state for month navigation on mobile
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 720);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleOnboardingComplete() {
    localStorage.setItem("bible-plan-onboarded", "true");
    setShowOnboarding(false);
  }

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
    setOverflowDate(date);
  }

  function handlePillDragStart(e, pill) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "book", rowIds: pill.rowIds }));
  }

  function handleChapterDragStart(e, row) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "chapter", rowIds: [row.id] }));
    setOverflowDate(null);
  }

  function handleDrop(e, date) {
    e.preventDefault();
    setDragOverDate(null);
    const payload = parseDragPayload(e);
    if (!payload?.rowIds?.length) return;
    moveRowsToDate(payload.rowIds, date);
  }

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = startWidth + delta;

      if (newWidth < 120) {
        setOverflowDate(null);
        setSidebarWidth(300);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      } else if (newWidth > 600) {
        setSidebarWidth(600);
      } else {
        setSidebarWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

  // Touch handlers for mobile month swipe (spring back cleanly, never stuck in between)
  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(false);
    setSwipeOffset(0);
  }

  function handleTouchMove(e) {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
      setIsSwiping(true);
      const clamped = Math.sign(deltaX) * Math.min(Math.abs(deltaX) * 0.45, 75);
      setSwipeOffset(clamped);
    }
  }

  function handleTouchEnd() {
    if (isSwiping) {
      if (swipeOffset > 25) {
        goToPrevMonth();
      } else if (swipeOffset < -25) {
        goToNextMonth();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setIsSwiping(false);
    setSwipeOffset(0);
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

  const renderScheduleDetails = () => {
    if (overflowByBook.size === 0) {
      return (
        <div className="day-schedule-empty" style={{ padding: "30px 10px", textAlign: "center" }}>
          <p className="hint-text" style={{ fontSize: 13 }}>No readings scheduled for this day.</p>
        </div>
      );
    }

    return (
      <div className="day-schedule-list">
        {[...overflowByBook.entries()].map(([bookId, bookRows]) => {
          const bookCategory = bookRows[0]?.category || "ot";
          const bookFullName = bookRows[0]?.book_name || BOOK_NAMES[bookId] || bookId;
          const categoryColor = GROUP_COLORS[bookCategory] || GROUP_COLORS.ot;

          return (
            <div className="day-schedule-book-group" key={bookId}>
              <div className="day-schedule-book-header">
                <span className="popup-book-dot" style={{ background: categoryColor.bg }} />
                <h3 className="day-schedule-book-title">{bookFullName}</h3>
              </div>

              <div className="day-schedule-chapters">
                {bookRows.map((row) => (
                  <div
                    key={row.id}
                    className={`day-schedule-chapter-item${row.completed ? " completed" : ""}`}
                    draggable
                    onDragStart={(e) => handleChapterDragStart(e, row)}
                  >
                    <span className="day-schedule-chapter-number">{row.chapter}</span>

                    <div className="day-schedule-chapter-actions">
                      <button
                        type="button"
                        className={`chapter-action-btn chapter-action-check${row.completed ? " active" : ""}`}
                        onClick={() => toggleChapter(row)}
                        title={row.completed ? "Mark as unread" : "Mark as read"}
                        aria-label={`Mark chapter ${row.chapter} ${row.completed ? "unread" : "read"}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                          <path
                            d="M5 12.5l4.5 4.5L19 7.5"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="chapter-action-btn chapter-action-book"
                        onClick={() =>
                          navigate(`/bible/${getPreferredTranslation()}/${row.book}/${row.chapter}`)
                        }
                        title="Direct to Bible"
                        aria-label={`Direct chapter ${row.chapter} to Bible`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                          <path
                            d="M4 5.5C4 4.67 4.67 4 5.5 4H12V20H5.5C4.67 20 4 19.33 4 18.5V5.5Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20 5.5C20 4.67 19.33 4 18.5 4H12V20H18.5C19.33 20 20 19.33 20 18.5V5.5Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <p className="reader-loading" style={{ margin: "auto", display: "flex", width: "100%", justifyContent: "center", minHeight: "80vh", alignItems: "center" }}>Building your plan…</p>;
  }

  return (
    <div className="plan-layout">
      {showOnboarding && <OnboardingModal onClose={handleOnboardingComplete} />}

      {/* Desktop / PC Right Sidebar */}
      {!isMobile && (
        <aside
          className={`bible-sidebar${overflowDate ? "" : " collapsed"}`}
          style={{
            width: overflowDate ? sidebarWidth : 0,
            padding: overflowDate ? undefined : 0,
            border: overflowDate ? undefined : "none"
          }}
        >
          {overflowDate && (
            <>
              <div className="cal-popup-header" style={{ paddingBottom: 16 }}>
                <h2>{formatDetailDate(overflowDate)}</h2>
                <button className="btn-ghost btn" type="button" onClick={() => setOverflowDate(null)}>
                  Close
                </button>
              </div>

              {renderScheduleDetails()}
            </>
          )}
        </aside>
      )}

      {/* Desktop Sidebar Resize Handle */}
      {!isMobile && overflowDate && (
        <div
          className="sidebar-resize-handle"
          onMouseDown={startResize}
          title="Drag to resize sidebar"
        />
      )}

      {/* Phone / Mobile Pop-up Dialog */}
      {isMobile && overflowDate && (
        <div className="cal-overlay" onClick={() => setOverflowDate(null)} style={{ zIndex: 100 }}>
          <div className="cal-popup day-detail-popup" onClick={(e) => e.stopPropagation()}>
            <div className="cal-popup-header" style={{ paddingBottom: 12 }}>
              <h2>{formatDetailDate(overflowDate)}</h2>
              <button
                className="icon-btn"
                type="button"
                onClick={() => setOverflowDate(null)}
                aria-label="Close"
                style={{ width: 30, height: 30 }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {renderScheduleDetails()}
          </div>
        </div>
      )}

      <section className="plan-main">
        <div className="phone-calendar-heading">
          <h1>{monthLabel(viewYear, viewMonth, false)}</h1>
          <div className="phone-calendar-arrows">
            <button className="icon-btn" type="button" onClick={goToPrevMonth} aria-label="Previous month">‹</button>
            <button className="icon-btn" type="button" onClick={goToNextMonth} aria-label="Next month">›</button>
          </div>
        </div>
        <div
          className="calendar-grid-wrap"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="calendar-weekdays">
            {WEEKDAY_SHORT_LABELS.map((w, idx) => (
              <span key={w}>
                <span className="weekday-full">{WEEKDAY_FULL_LABELS[idx].toUpperCase()}</span>
                <span className="weekday-short">{w.toUpperCase()}</span>
              </span>
            ))}
          </div>

          <div
            className="calendar-month-grid"
            style={{
              transform: swipeOffset ? `translateX(${swipeOffset}px)` : "none",
              transition: isSwiping ? "none" : "transform 0.22s cubic-bezier(0.2, 0.9, 0.4, 1)"
            }}
          >
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
                  className={`cal-day-cell${cell.isCurrentMonth ? "" : " muted"}${isSelected ? " selected" : ""}${isFullyRead ? " done" : ""
                    }${dragOverDate === cell.date ? " drag-over" : ""}`}
                  onClick={() => {
                    setSelectedDate(cell.date);
                    openDay(cell.date);
                  }}
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
                            setSelectedDate(cell.date);
                            openDay(cell.date);
                          }}
                          title={`${pill.bookName} ${pill.rangeText}`}
                        >
                          {/* Shortened for phone, full name for PC */}
                          <span className="cal-event-name cal-event-name-full">{pill.bookName}</span>
                          <span className="cal-event-name cal-event-name-short">{pill.shortBookName}</span>
                          <span className="cal-event-range">{pill.rangeText}</span>
                        </button>
                      ))}
                      {overflowCount > 0 && (
                        <button
                          type="button"
                          className="cal-day-more"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(cell.date);
                            openDay(cell.date);
                          }}
                        >
                          +{overflowCount} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
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
              title="Switch AM/PM ↔ 24-hour"
            >
              {timeLabel}
            </button>
          </div>

          {/* Mobile-only center month navigation (above navbar) */}
          <div className="calendar-bottom-center-mobile">
            <button className="icon-btn" type="button" onClick={goToPrevMonth} aria-label="Previous month">
              ‹
            </button>
            <span className="calendar-bottom-title cal-title-mobile">{monthLabel(viewYear, viewMonth, true)}</span>
            <button className="icon-btn" type="button" onClick={goToNextMonth} aria-label="Next month">
              ›
            </button>
          </div>

          {/* PC right side navigation (month arrows + fixed-width month text + Today button) */}
          <div className="calendar-bottom-right">
            <div className="calendar-pc-month-nav">
              <button className="icon-btn" type="button" onClick={goToPrevMonth} aria-label="Previous month">
                ‹
              </button>
              <span className="calendar-bottom-title cal-title-pc">{monthLabel(viewYear, viewMonth, false)}</span>
              <button className="icon-btn" type="button" onClick={goToNextMonth} aria-label="Next month">
                ›
              </button>
            </div>
            <button className="btn today-btn" type="button" onClick={goToToday}>
              Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
