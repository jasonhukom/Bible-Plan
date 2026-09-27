import { createContext, useContext, useMemo, useState } from "react";

const CalendarViewContext = createContext(null);

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function CalendarViewProvider({ children }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState(todayDateString());

  const value = useMemo(
    () => ({
      viewYear,
      viewMonth,
      selectedDate,
      todayString: todayDateString(),

      setSelectedDate,

      goToMonth(year, month) {
        // Normalize month overflow/underflow (e.g. December -> January).
        const d = new Date(year, month, 1);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      },

      goToPrevMonth() {
        const d = new Date(viewYear, viewMonth - 1, 1);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      },

      goToNextMonth() {
        const d = new Date(viewYear, viewMonth + 1, 1);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      },

      goToToday() {
        const t = new Date();
        setViewYear(t.getFullYear());
        setViewMonth(t.getMonth());
        setSelectedDate(todayDateString());
      },

      /** Jump the calendar to whatever month a given "YYYY-MM-DD" falls in. */
      goToDate(dateStr) {
        const [y, m] = dateStr.split("-").map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedDate(dateStr);
      }
    }),
    [viewYear, viewMonth, selectedDate]
  );

  return <CalendarViewContext.Provider value={value}>{children}</CalendarViewContext.Provider>;
}

export function useCalendarView() {
  const ctx = useContext(CalendarViewContext);
  if (!ctx) throw new Error("useCalendarView must be used within a CalendarViewProvider");
  return ctx;
}
