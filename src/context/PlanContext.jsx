import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { dataApi } from "../lib/dataApi";
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
  days: 360,
  book_groups: ["ot", "nt"],
  order_mode: "overlap"
};

/** Turns generator output (per-day flat chapter entries) into flat
 * reading_schedule rows, each with a client-generated id so the UI can use
 * them immediately without a round-trip re-fetch after insert. */
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

const LOCAL_PLAN_KEY = "bible-plan-local-active-plan";
const LOCAL_SCHEDULE_KEY = "bible-plan-local-schedule-rows";

function getLocalPlan() {
  try {
    const raw = localStorage.getItem(LOCAL_PLAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalPlan(plan) {
  try {
    if (plan) localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(plan));
    else localStorage.removeItem(LOCAL_PLAN_KEY);
  } catch {}
}

function getLocalRows() {
  try {
    const raw = localStorage.getItem(LOCAL_SCHEDULE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalRows(rows) {
  try {
    if (rows && rows.length > 0) localStorage.setItem(LOCAL_SCHEDULE_KEY, JSON.stringify(rows));
    else localStorage.removeItem(LOCAL_SCHEDULE_KEY);
  } catch {}
}

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState(() => getLocalPlan());
  const [rows, setRows] = useState(() => getLocalRows());
  const [loading, setLoading] = useState(() => !getLocalPlan());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const regenerate = useCallback(async (config, options = {}) => {
    setGenerating(true);
    setError("");
    try {
      const planId = plan?.id || newId();
      let savedPlan = {
        id: planId,
        name: config.name || "My reading plan",
        start_date: config.start_date,
        days: config.days,
        book_groups: config.book_groups,
        order_mode: config.order_mode,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (user && !user.is_anonymous) {
        try {
          const { data: dbPlan } = await dataApi.saveActivePlan(config);
          if (dbPlan) savedPlan = dbPlan;
        } catch (dbErr) {
          console.warn("[PlanContext] Could not save to cloud:", dbErr);
        }
      }

      const scheduleDays = await generateSchedule({
        translationId: getPreferredTranslation() || DEFAULT_TRANSLATION_ID,
        startDate: savedPlan.start_date,
        days: savedPlan.days,
        groups: savedPlan.book_groups,
        orderMode: savedPlan.order_mode,
        excludeBooks: options.excludeBooks || []
      });
      const newRows = scheduleToRows(scheduleDays, options.preCompletedBooks || []);

      if (user && !user.is_anonymous && savedPlan.id) {
        try {
          await dataApi.replaceSchedule(savedPlan.id, newRows);
        } catch (dbErr) {
          console.warn("[PlanContext] Could not save schedule to cloud:", dbErr);
        }
      }

      setPlan(savedPlan);
      setRows(newRows);
      setLocalPlan(savedPlan);
      setLocalRows(newRows);
      return { data: savedPlan, error: null };
    } catch (err) {
      setError(err.message || "Couldn't generate the plan.");
      return { data: null, error: err };
    } finally {
      setGenerating(false);
    }
  }, [plan?.id, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user && !user.is_anonymous) {
        try {
          const { data: existingPlan } = await dataApi.getActivePlan();
          if (cancelled) return;

          if (existingPlan) {
            const { data: existingRows } = await dataApi.listSchedule(existingPlan.id);
            if (cancelled) return;
            setPlan(existingPlan);
            setRows(existingRows || []);
            setLocalPlan(existingPlan);
            setLocalRows(existingRows || []);
            setLoading(false);
            return;
          } else {
            const existingLocal = getLocalPlan();
            const existingRows = getLocalRows();
            if (existingLocal && existingRows.length > 0) {
              const { data: syncedPlan } = await dataApi.saveActivePlan(existingLocal);
              if (syncedPlan) {
                await dataApi.replaceSchedule(syncedPlan.id, existingRows);
                setPlan(syncedPlan);
                setRows(existingRows);
                setLocalPlan(syncedPlan);
                setLocalRows(existingRows);
                setLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn("[PlanContext] Cloud fetch error:", e);
        }
      }

      const cachedPlan = getLocalPlan();
      const cachedRows = getLocalRows();
      if (cachedPlan && cachedRows.length > 0) {
        if (!cancelled) {
          setPlan(cachedPlan);
          setRows(cachedRows);
          setLoading(false);
        }
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
    setRows((prev) => {
      const next = prev.map((r) =>
        r.id === row.id
          ? { ...r, completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null }
          : r
      );
      setLocalRows(next);
      return next;
    });
    if (user && !user.is_anonymous) {
      dataApi.setChapterCompleted(row.id, nextCompleted);
    }
  }, [user]);

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

        setLocalRows(updated);
        if (user && !user.is_anonymous) {
          dataApi.moveScheduleEntries(moves);
        }
        return updated;
      });
    },
    [plan, user]
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
