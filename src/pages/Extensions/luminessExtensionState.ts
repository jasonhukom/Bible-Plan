import { getPreferredTranslation } from '../../lib/bible.js';
import { getLongBookName } from '../../lib/bibleBooks.js';
import { deviceStorage } from '../../lib/deviceStorage.js';

export const BIBLE_PLAN_APP_VERSION = 'Alpha0.0.1';
export const LUMINESS_EXTENSION_ID = 'luminess-assist';
export const LUMINESS_IPC_ENDPOINT = 'http://127.0.0.1:47821';
export const LUMINESS_STORAGE_KEY = 'bible-plan-extension-luminess';
export const LUMINESS_EXTENSION_EVENT = 'bible-plan-luminess-extension-changed';
export const LUMINESS_SCHEDULE_EVENT = 'bible-schedule-changed';
export const LUMINESS_LOCK_MESSAGE =
  'Luminess requires an active update/connection from the Bible-Plan Extension page.';
export const LUMINESS_GITHUB_REPO = 'https://github.com/jasonhukom/Luminess-Assist';
export const LUMINESS_RELEASE_URL =
  'https://github.com/jasonhukom/Luminess-Assist/releases/latest';

export type DesktopPlatform = 'windows' | 'macos' | 'linux' | 'mobile' | 'unknown';

export interface LuminessExtensionState {
  extensionId: string;
  enabled: boolean;
  installedFromBiblePlan: boolean;
  appVersion: string;
  installedAt: string | null;
  lastHeartbeatAt: string | null;
  lastHandshakeOk: boolean | null;
  companionExpanded: boolean;
}

export interface TodayBookReading {
  book: string;
  bookName: string;
  category: string;
  chapters: number[];
  chaptersText: string;
  completed: boolean;
  rowIds: string[];
}

export interface BiblePlanScheduleFeed {
  planName: string;
  translation: string;
  todayDate: string;
  totalForToday: number;
  completedForToday: number;
  readings: TodayBookReading[];
}

export interface BiblePlanHeartbeatResponse {
  extensionId: string;
  installedFromBiblePlan: boolean;
  enabled: boolean;
  appVersion: string;
  requiredVersion: string;
  unlocked: boolean;
  updatedAtMs: number;
  heartbeatUrl: string | null;
  scheduleFeed: BiblePlanScheduleFeed;
}

export interface DesktopHeartbeatCheckResult {
  reachable: boolean;
  unlocked: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
}

export interface DesktopHandshakeSyncResult {
  state: LuminessExtensionState;
  reachable: boolean;
  lockStatus: Record<string, unknown> | null;
  error: string | null;
}

const DEFAULT_EXTENSION_STATE: LuminessExtensionState = {
  extensionId: LUMINESS_EXTENSION_ID,
  enabled: false,
  installedFromBiblePlan: false,
  appVersion: BIBLE_PLAN_APP_VERSION,
  installedAt: null,
  lastHeartbeatAt: null,
  lastHandshakeOk: null,
  companionExpanded: false,
};

export function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768;
}

export function detectDesktopPlatform(): DesktopPlatform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown';
  }
  const ua = navigator.userAgent || '';
  if (!isDesktopViewport() || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)) {
    return 'mobile';
  }
  const navWithUaData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = (
    navWithUaData.userAgentData?.platform ||
    navigator.platform ||
    ua
  ).toLowerCase();
  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac') || platform.includes('darwin')) return 'macos';
  if (platform.includes('linux') || platform.includes('x11')) return 'linux';
  return 'unknown';
}

export function getTodayLocalIso(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatChapterRanges(chapters: number[]): string {
  if (!chapters.length) return '';
  const uniqueSorted = Array.from(new Set(chapters)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = uniqueSorted[0];
  let end = uniqueSorted[0];

  for (let i = 1; i < uniqueSorted.length; i += 1) {
    if (uniqueSorted[i] === end + 1) {
      end = uniqueSorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = uniqueSorted[i];
      end = uniqueSorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}

export function getLuminessExtensionState(): LuminessExtensionState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_EXTENSION_STATE };
  }
  try {
    const raw = window.localStorage.getItem(LUMINESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EXTENSION_STATE };
    const parsed = JSON.parse(raw) as Partial<LuminessExtensionState>;
    return {
      ...DEFAULT_EXTENSION_STATE,
      ...parsed,
      extensionId: parsed.extensionId || LUMINESS_EXTENSION_ID,
      appVersion: parsed.appVersion || BIBLE_PLAN_APP_VERSION,
    };
  } catch {
    return { ...DEFAULT_EXTENSION_STATE };
  }
}

export function saveLuminessExtensionState(
  next: LuminessExtensionState
): LuminessExtensionState {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LUMINESS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent(LUMINESS_EXTENSION_EVENT, { detail: next })
      );
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

export function updateLuminessExtensionState(
  patch: Partial<LuminessExtensionState>
): LuminessExtensionState {
  const current = getLuminessExtensionState();
  return saveLuminessExtensionState({
    ...current,
    ...patch,
  });
}

export function isLuminessExtensionActive(
  state: LuminessExtensionState = getLuminessExtensionState()
): boolean {
  return Boolean(
    state.installedFromBiblePlan &&
      state.enabled &&
      state.appVersion === BIBLE_PLAN_APP_VERSION
  );
}

interface StoredScheduleRow {
  id: string;
  date?: string;
  book?: string;
  book_name?: string;
  chapter?: number;
  category?: string;
  completed?: boolean;
}

export function getTodayBibleScheduleFeed(): BiblePlanScheduleFeed {
  const todayDate = getTodayLocalIso();
  const plan = deviceStorage.getActivePlan() as { name?: string } | null;
  const rows = (deviceStorage.listSchedule() as StoredScheduleRow[]) || [];
  const todayRows = rows.filter((row) => row.date === todayDate);

  const byBook = new Map<
    string,
    {
      book: string;
      bookName: string;
      category: string;
      chapters: number[];
      rowIds: string[];
      allCompleted: boolean;
    }
  >();

  let completedForToday = 0;
  for (const row of todayRows) {
    if (row.completed) completedForToday += 1;
    const book = row.book || 'UNK';
    const bookName = getLongBookName(book, row.book_name || book);
    const existing = byBook.get(book);
    if (!existing) {
      byBook.set(book, {
        book,
        bookName,
        category: row.category || 'ot',
        chapters: typeof row.chapter === 'number' ? [row.chapter] : [],
        rowIds: [row.id],
        allCompleted: Boolean(row.completed),
      });
    } else {
      if (typeof row.chapter === 'number') {
        existing.chapters.push(row.chapter);
      }
      existing.rowIds.push(row.id);
      if (!row.completed) existing.allCompleted = false;
    }
  }

  const readings: TodayBookReading[] = Array.from(byBook.values()).map((item) => ({
    book: item.book,
    bookName: item.bookName,
    category: item.category,
    chapters: item.chapters,
    chaptersText: formatChapterRanges(item.chapters),
    completed: item.allCompleted,
    rowIds: item.rowIds,
  }));

  return {
    planName: plan?.name || 'Daily Bible Reading Plan',
    translation: getPreferredTranslation(),
    todayDate,
    totalForToday: todayRows.length,
    completedForToday,
    readings,
  };
}

export function buildLuminessHeartbeatPayload(
  stateOverride?: LuminessExtensionState
): BiblePlanHeartbeatResponse {
  const state = stateOverride || getLuminessExtensionState();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : null;
  const isLoopbackHttp =
    origin !== null &&
    /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin);

  return {
    extensionId: LUMINESS_EXTENSION_ID,
    installedFromBiblePlan: state.installedFromBiblePlan,
    enabled: state.enabled,
    appVersion: state.appVersion,
    requiredVersion: BIBLE_PLAN_APP_VERSION,
    unlocked: isLuminessExtensionActive(state),
    updatedAtMs: Date.now(),
    heartbeatUrl: isLoopbackHttp
      ? `${origin}/api/extensions/luminess-heartbeat`
      : null,
    scheduleFeed: getTodayBibleScheduleFeed(),
  };
}

export async function checkLuminessDesktopHeartbeat(
  timeoutMs: number = 1400
): Promise<DesktopHeartbeatCheckResult> {
  if (typeof fetch === 'undefined') {
    return { reachable: false, unlocked: false, data: null, error: 'fetch unavailable' };
  }
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(
      `${LUMINESS_IPC_ENDPOINT}/api/extensions/luminess-heartbeat`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }
    );
    const json = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
    if (!resp.ok || !json) {
      return {
        reachable: false,
        unlocked: false,
        data: json,
        error: `Desktop IPC HTTP ${resp.status}`,
      };
    }
    const lockStatus = json.lockStatus as { unlocked?: boolean } | undefined;
    return {
      reachable: true,
      unlocked: Boolean(lockStatus?.unlocked),
      data: json,
      error: null,
    };
  } catch (err) {
    return {
      reachable: false,
      unlocked: false,
      data: null,
      error: err instanceof Error ? err.message : 'Luminess desktop app not reachable',
    };
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export async function syncLuminessDesktopHandshake(
  patch?: Partial<LuminessExtensionState>,
  timeoutMs: number = 1800
): Promise<DesktopHandshakeSyncResult> {
  let state = patch
    ? updateLuminessExtensionState(patch)
    : getLuminessExtensionState();

  const payload = buildLuminessHeartbeatPayload(state);
  if (typeof fetch === 'undefined') {
    return { state, reachable: false, lockStatus: null, error: 'fetch unavailable' };
  }

  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(
      `${LUMINESS_IPC_ENDPOINT}/api/extensions/luminess-handshake`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': BIBLE_PLAN_APP_VERSION,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    const json = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
    const ok = resp.ok && Boolean(json?.ok);
    state = updateLuminessExtensionState({
      lastHeartbeatAt: new Date().toISOString(),
      lastHandshakeOk: ok,
    });
    return {
      state,
      reachable: resp.ok,
      lockStatus: (json?.lockStatus as Record<string, unknown>) || null,
      error: ok ? null : `Handshake returned HTTP ${resp.status}`,
    };
  } catch (err) {
    state = updateLuminessExtensionState({
      lastHandshakeOk: false,
    });
    return {
      state,
      reachable: false,
      lockStatus: null,
      error:
        err instanceof Error
          ? err.message
          : 'Desktop Luminess IPC listener is offline',
    };
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export function markTodayReadingCompleted(
  rowIds: string[],
  completed: boolean
): BiblePlanScheduleFeed {
  for (const rowId of rowIds) {
    deviceStorage.setChapterCompleted(rowId, completed);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LUMINESS_SCHEDULE_EVENT));
  }
  const feed = getTodayBibleScheduleFeed();
  const state = getLuminessExtensionState();
  if (isLuminessExtensionActive(state)) {
    void syncLuminessDesktopHandshake();
  }
  return feed;
}

export function buildLuminessLaunchQuery(
  state: LuminessExtensionState = getLuminessExtensionState()
): string {
  const params = new URLSearchParams({
    installedFromBiblePlan: state.installedFromBiblePlan ? '1' : '0',
    enabled: state.enabled ? '1' : '0',
    appVersion: state.appVersion || BIBLE_PLAN_APP_VERSION,
  });
  return `?${params.toString()}`;
}
