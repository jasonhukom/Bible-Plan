import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { READINGS, parsePassageRefs } from "../lib/readingPlanData";
import { DEFAULT_TRANSLATION_ID } from "../lib/helloao";
import { classifyBook, BOOK_NAMES, GROUP_COLORS } from "../lib/bibleBooks";
import { buildMonthGrid, monthLabel, WEEKDAY_LABELS } from "../lib/calendarGrid";
import { useCalendarView } from "../context/CalendarViewContext";
import { dataApi } from "../lib/dataApi";

const MAX_VISIBLE_PILLS = 3;

/** Turns one day's passage string into the list of book-pill descriptors
 * the calendar cell renders (name, chapter range, section color). */
function pillsForReading(reading) {
  if (!reading) return [];
  return parsePassageRefs(reading.passage).map((ref) => {
    const group = classifyBook(ref.bookId);
    const range =
      ref.startChapter === ref.endChapter ? `${ref.startChapter}` : `${ref.startChapter}-${ref.endChapter}`;
    return {
      bookId: ref.bookId,
      name: BOOK_NAMES[ref.bookId] || ref.bookAbbr,
      range,
      color: GROUP_COLORS[group],
      startChapter: ref.startChapter
    };
  });
}

export default function PlanPage() {
  const navigate = useNavigate();
  const { viewYear, viewMonth, selectedDate, todayString, goToPrevMonth, goToNextMonth, goToToday, setSelectedDate } =
    useCalendarView();

  const [completed, setCompleted] = useState(new Set());
  const [overflowDate, setOverflowDate] = useState(null);
  const [numberPosition, setNumberPosition] = useState("right"); // left | center | right

  const readingsByDate = useMemo(() => {
    const map = new Map();
    for (const r of READINGS) map.set(r.date, r);
    return map;
  }, []);

  useEffect(() => {
    dataApi.listCompletedDays().then(({ data }) => {
      setCompleted(new Set((data || []).filter((r) => r.completed).map((r) => r.day_index)));
    });
    dataApi.getSettings().then(({ data }) => {
      if (data?.preferences?.dateNumberPosition) setNumberPosition(data.preferences.dateNumberPosition);
    });
  }, []);

  const toggleDay = useCallback(
    async (reading) => {
      const isDone = completed.has(reading.idx);
      const next = new Set(completed);
      if (isDone) next.delete(reading.idx);
      else next.add(reading.idx);
      setCompleted(next);
      await dataApi.setDayCompleted(reading.idx, reading.date, reading.passage, !isDone);
    },
    [completed]
  );

  // Keyboard navigation: left/right arrows move between months.
  useEffect(() => {
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
  const overflowReading = overflowDate ? readingsByDate.get(overflowDate) : null;

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
            const reading = readingsByDate.get(cell.date);
            const pills = pillsForReading(reading);
            const visible = pills.slice(0, MAX_VISIBLE_PILLS);
            const overflowCount = pills.length - visible.length;
            const isToday = cell.date === todayString;
            const isSelected = cell.date === selectedDate;
            const isDone = reading && completed.has(reading.idx);

            return (
              <div
                key={cell.date}
                className={`cal-day-cell${cell.isCurrentMonth ? "" : " muted"}${isSelected ? " selected" : ""}${
                  isDone ? " done" : ""
                }`}
                onClick={() => setSelectedDate(cell.date)}
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
                        className="cal-event-pill"
                        style={{ background: pill.color.bg, color: pill.color.text }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/bible/${DEFAULT_TRANSLATION_ID}/${pill.bookId}/${pill.startChapter}`);
                        }}
                        title={`${pill.name} ${pill.range}`}
                      >
                        <span className="cal-event-name">{pill.name}</span>
                        <span className="cal-event-range">{pill.range}</span>
                      </button>
                    ))}
                    {overflowCount > 0 && (
                      <button
                        type="button"
                        className="cal-day-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverflowDate(cell.date);
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
        <button className="btn btn-ghost" type="button" onClick={goToToday}>
          Today
        </button>
        <button className="icon-btn" type="button" onClick={goToPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <span className="calendar-bottom-title">{monthLabel(viewYear, viewMonth)}</span>
        <button className="icon-btn" type="button" onClick={goToNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      {overflowDate && overflowReading && (
        <div className="cal-overlay" onClick={() => setOverflowDate(null)}>
          <div className="cal-popup" onClick={(e) => e.stopPropagation()}>
            <div className="cal-popup-header">
              <h2>{overflowDate}</h2>
              <button className="btn-ghost btn" type="button" onClick={() => setOverflowDate(null)}>
                Close
              </button>
            </div>

            <label className="cal-popup-done">
              <input
                type="checkbox"
                checked={completed.has(overflowReading.idx)}
                onChange={() => toggleDay(overflowReading)}
              />
              Mark day as read
            </label>

            <div className="cal-popup-list">
              {pillsForReading(overflowReading).map((pill) => (
                <button
                  key={pill.bookId}
                  type="button"
                  className="cal-event-pill cal-event-pill-wide"
                  style={{ background: pill.color.bg, color: pill.color.text }}
                  onClick={() => navigate(`/bible/${DEFAULT_TRANSLATION_ID}/${pill.bookId}/${pill.startChapter}`)}
                >
                  <span className="cal-event-name">{pill.name}</span>
                  <span className="cal-event-range">{pill.range}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
