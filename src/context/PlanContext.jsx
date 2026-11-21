import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { deviceStorage } from "../lib/deviceStorage";
import { generateSchedule } from "../lib/planGenerator";
import { DEFAULT_TRANSLATION_ID, getPreferredTranslation } from "../lib/bible";

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
  days: 365,
  book_groups: ["ot", "nt"],
  order_mode: "overlap",
  chronological: false,
  daily_psalms: false,
  daily_proverbs: false
};

/** Turns generator output (per-day flat chapter entries) into flat
 * reading_schedule rows, each with a client-generated id so the UI can use
 * them immediately. */
function scheduleToRows(scheduleDays, preCompletedBooks = []) {
  const rows = [];
  for (const day of scheduleDays) {
    day.entries.forEach((entry, position) => {
      const isCompleted = preCompletedBooks.includes(entry.bookId);
      rows.push({
        id: newId(),
        day_index: day.dayIndex,
        date: day.date,
        book: entry.bookId,
        book_name: entry.bookName,
        chapter: entry.chapter,
        category: entry.category,
        position,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      });
    });
  }
  return rows;
}

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState(() => deviceStorage.getActivePlan());
  const [rows, setRows] = useState(() => deviceStorage.listSchedule());
  const [loading, setLoading] = useState(() => {
    const cachedPlan = deviceStorage.getActivePlan();
    const cachedRows = deviceStorage.listSchedule();
    return !(cachedPlan && cachedRows.length > 0);
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const regenerate = useCallback(async (config, options = {}) => {
    setGenerating(true);
    setError("");
    try {
      const existingPlan = deviceStorage.getActivePlan();
      const savedPlan = {
        id: existingPlan?.id || newId(),
        name: config.name || "My reading plan",
        start_date: config.start_date,
        days: config.days,
        book_groups: config.book_groups,
        order_mode: config.order_mode,
        chronological: Boolean(config.chronological),
        daily_psalms: Boolean(config.daily_psalms),
        daily_proverbs: Boolean(config.daily_proverbs),
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const scheduleDays = await generateSchedule({
        translationId: getPreferredTranslation() || DEFAULT_TRANSLATION_ID,
        startDate: savedPlan.start_date,
        days: savedPlan.days,
        groups: savedPlan.book_groups,
        orderMode: savedPlan.order_mode,
        chronological: savedPlan.chronological,
        dailyPsalms: savedPlan.daily_psalms,
        dailyProverbs: savedPlan.daily_proverbs,
        excludeBooks: options.excludeBooks || []
      });
      const newRows = scheduleToRows(scheduleDays, options.preCompletedBooks || []);

      deviceStorage.saveActivePlan(savedPlan);
      deviceStorage.replaceSchedule(newRows);
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
    let cancelled = false;
    const cachedPlan = deviceStorage.getActivePlan();
    const cachedRows = deviceStorage.listSchedule();
    if (cachedPlan && cachedRows.length > 0) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await regenerate(cachedPlan ? { ...DEFAULT_CONFIG, ...cachedPlan } : DEFAULT_CONFIG);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regenerate]);

  const toggleChapter = useCallback((row) => {
    const nextCompleted = !row.completed;
    setRows((prev) => {
      const next = prev.map((r) =>
        r.id === row.id
          ? { ...r, completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null }
          : r
      );
      deviceStorage.replaceSchedule(next);
      return next;
    });
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
        const idSet = new Set(rowIds);

        const updated = prevRows.map((r) => {
          if (!idSet.has(r.id)) return r;
          const day_index = plan?.start_date ? dayIndexFor(plan.start_date, newDate) : r.day_index;
          return { ...r, date: newDate, day_index, position: nextPosition++ };
        });

        deviceStorage.replaceSchedule(updated);
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
