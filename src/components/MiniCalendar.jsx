import { buildMonthGrid, monthLabel, WEEKDAY_LABELS } from "../lib/calendarGrid";
import { useCalendarView } from "../context/CalendarViewContext";

export default function MiniCalendar() {
  const { viewYear, viewMonth, selectedDate, todayString, goToPrevMonth, goToNextMonth, setSelectedDate, goToMonth } =
    useCalendarView();

  const cells = buildMonthGrid(viewYear, viewMonth);

  function handleDayClick(cell) {
    setSelectedDate(cell.date);
    if (!cell.isCurrentMonth) {
      const [y, m] = cell.date.split("-").map(Number);
      goToMonth(y, m - 1);
    }
  }

  return (
    <div className="mini-cal">
      <div className="mini-cal-header">
        <span className="mini-cal-title">{monthLabel(viewYear, viewMonth)}</span>
        <div className="mini-cal-nav">
          <button type="button" onClick={goToPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <button type="button" onClick={goToNextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="mini-cal-grid mini-cal-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w[0]}</span>
        ))}
      </div>

      <div className="mini-cal-grid">
        {cells.map((cell) => {
          const isToday = cell.date === todayString;
          const isSelected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              type="button"
              className={[
                "mini-cal-day",
                !cell.isCurrentMonth && "muted",
                isToday && "today",
                isSelected && !isToday && "selected"
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleDayClick(cell)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
