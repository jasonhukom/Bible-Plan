import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { dataApi } from "../lib/dataApi";
import { generateSchedule } from "../lib/planGenerator";
import { DEFAULT_TRANSLATION_ID } from "../lib/helloao";

const PlanContext = createContext(null);

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const DEFAULT_CONFIG = {
  name: "My reading plan",
  start_date: todayDateString(),
  days: 360,
  book_groups: ["ot", "nt"],
  order_mode: "overlap"
};

/** Turns generator output (per-day flat chapter entries) into flat
 * reading_schedule rows, each with a client-generated id so the UI can use
 * them immediately without a round-trip re-fetch after insert. */
function scheduleToRows(scheduleDays) {
  const rows = [];
  for (const day of scheduleDays) {
    day.entries.forEach((entry, position) => {
      rows.push({
        id: newId(),
        day_index: day.dayIndex,
        date: day.date,
        book: entry.bookId,
        book_name: entry.bookName,
        chapter: entry.chapter,
        category: entry.category,
        position,
        completed: false,
        completed_at: null
      });
    });
  }
  return rows;
}

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const regenerate = useCallback(async (config) => {
    setGenerating(true);
    setError("");
    try {
      const { data: savedPlan, error: planError } = await dataApi.saveActivePlan(config);
      if (planError) throw new Error(planError.message);

      const scheduleDays = await generateSchedule({
        translationId: DEFAULT_TRANSLATION_ID,
        startDate: savedPlan.start_date,
        days: savedPlan.days,
        groups: savedPlan.book_groups,
        orderMode: savedPlan.order_mode
      });
      const newRows = scheduleToRows(scheduleDays);

      const { error: replaceError } = await dataApi.replaceSchedule(savedPlan.id, newRows);
      if (replaceError) throw new Error(replaceError.message);

      setPlan(savedPlan);
      setRows(newRows);
      return { data: savedPlan, error: null };
    } catch (err) {
      setError(err.message || "Couldn't generate the plan.");
      return { data: null, error: err };
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: existingPlan } = await dataApi.getActivePlan();
      if (cancelled) return;

      if (existingPlan) {
        const { data: existingRows } = await dataApi.listSchedule(existingPlan.id);
        if (cancelled) return;
        setPlan(existingPlan);
        setRows(existingRows || []);
        setLoading(false);
      } else {
        await regenerate(DEFAULT_CONFIG);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, regenerate]);

  const toggleChapter = useCallback((row) => {
    const nextCompleted = !row.completed;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null } : r))
    );
    dataApi.setChapterCompleted(row.id, nextCompleted);
  }, []);

  /**
   * Moves one or more rows to a new date, appending them after whatever is
   * already scheduled there (used by both whole-book and single-chapter
   * drag-and-drop).
   * @param {string[]} rowIds
   * @param {string} newDate
   */
  const moveRowsToDate = useCallback(
    (rowIds, newDate) => {
      setRows((prevRows) => {
        const targetExisting = prevRows.filter((r) => r.date === newDate && !rowIds.includes(r.id));
        let nextPosition = targetExisting.length;
        const moves = [];
        const idSet = new Set(rowIds);

        const updated = prevRows.map((r) => {
          if (!idSet.has(r.id)) return r;
          const day_index = plan?.start_date ? dayIndexFor(plan.start_date, newDate) : r.day_index;
          const move = { id: r.id, date: newDate, day_index, position: nextPosition++ };
          moves.push(move);
          return { ...r, ...move };
        });

        dataApi.moveScheduleEntries(moves);
        return updated;
      });
    },
    [plan]
  );

  const scheduleByDate = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date).push(row);
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [rows]);

  const value = useMemo(
    () => ({
      plan,
      rows,
      scheduleByDate,
      loading,
      generating,
      error,
      regenerate,
      toggleChapter,
      moveRowsToDate
    }),
    [plan, rows, scheduleByDate, loading, generating, error, regenerate, toggleChapter, moveRowsToDate]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

function dayIndexFor(startDate, targetDate) {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ty, tm, td] = targetDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const target = new Date(ty, tm - 1, td);
  return Math.round((target - start) / 86400000);
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
