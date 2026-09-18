/**
 * Ambient declarations for the globals Bible Plan hangs off `window`.
 *
 * This file doubles as the contract for the other engineers: if you want to
 * know what is available to you, read this. Editors pick it up automatically,
 * so `BiblePlanAuth.` autocompletes in VS Code without any imports.
 */

/** Result shape every network-touching method resolves to. */
export interface Result<T = any> {
  data: T | null;
  error: { message: string; [key: string]: any } | null;
}

export interface AuthState {
  /** True when this deployment has a Supabase project wired up. */
  isConfigured: boolean;
  isSignedIn: boolean;
  /** Supabase user object, or null. */
  user: any | null;
  /** The uuid to use as `user_id` on writes, or null. */
  userId: string | null;
  /** Supabase session (access_token, expires_at, ...), or null. */
  session: any | null;
  /** Row from `profiles`, or null. */
  profile: any | null;
  /** True while the user is following a password-recovery link. */
  recoveryMode: boolean;
}

export interface BiblePlanSupabase {
  ready(): Promise<any>;
  getClient(): any | null;
  isConfigured(): boolean;
  getStatus(): string;
  getStatusDetail(): string;
  getProjectInfo(): { url: string; source: string } | null;
}

export interface BiblePlanAuth {
  ready(): Promise<AuthState>;
  isConfigured(): boolean;
  getClient(): any | null;
  getUser(): any | null;
  getUserId(): string | null;
  getSession(): any | null;
  getAccessToken(): string | null;
  getProfile(): any | null;
  getDisplayName(): string | null;
  isRecovering(): boolean;
  getState(): AuthState;
  onChange(handler: (state: AuthState) => void): () => void;
  signUp(credentials: { email: string; password: string; displayName?: string }): Promise<Result>;
  signIn(credentials: { email: string; password: string }): Promise<Result>;
  signInWithProvider(provider: string): Promise<Result>;
  signOut(): Promise<Result>;
  sendPasswordReset(email: string): Promise<Result>;
  updatePassword(newPassword: string): Promise<Result>;
  updateProfile(changes: { displayName?: string; avatarUrl?: string | null }): Promise<Result>;
  refreshProfile(): Promise<any>;
}

export interface BiblePlanData {
  getProfile(): Promise<Result>;
  updateProfile(patch: { display_name?: string; avatar_url?: string | null }): Promise<Result>;

  getSettings(): Promise<Result>;
  saveSettings(patch: {
    theme?: string;
    translation?: string;
    canon?: string;
    preferences?: any;
  }): Promise<Result>;
  mergePreferences(patch: Record<string, any>): Promise<Result>;

  listPlans(): Promise<Result<any[]>>;
  getActivePlan(): Promise<Result>;
  createPlan(plan: any): Promise<Result>;
  updatePlan(planId: string, patch: any): Promise<Result>;
  setActivePlan(planId: string): Promise<Result>;
  deletePlan(planId: string): Promise<Result>;

  getSchedule(planId: string): Promise<Result<any[]>>;
  replaceSchedule(planId: string, rows: any[]): Promise<Result>;
  setEntryCompleted(entry: {
    planId: string;
    dayIndex: number;
    book: string;
    chapter: number;
    completed: boolean;
    position?: number;
  }): Promise<Result>;
  setEntriesCompleted(
    planId: string,
    entries: Array<{ dayIndex: number; position: number; completed: boolean }>
  ): Promise<Result>;

  listCollections(): Promise<Result<any[]>>;
  createCollection(name: string): Promise<Result>;
  renameCollection(collectionId: string, name: string): Promise<Result>;
  deleteCollection(collectionId: string): Promise<Result>;

  listSavedVerses(options?: {
    collectionId?: string;
    book?: string;
    limit?: number;
  }): Promise<Result<any[]>>;
  saveVerse(verse: {
    translation?: string;
    book: string;
    chapter: number;
    verse?: number | null;
    note?: string | null;
    collection_id?: string | null;
  }): Promise<Result>;
  updateSavedVerse(
    verseId: string,
    patch: { translation?: string; note?: string | null; collection_id?: string | null }
  ): Promise<Result>;
  deleteSavedVerse(verseId: string): Promise<Result>;
}

export interface SyncStatus {
  /** "idle" | "syncing" | "synced" | "error" */
  state: string;
  message: string;
  at: number;
}

export interface BiblePlanSync {
  getStatus(): SyncStatus;
  onStatus(listener: (status: SyncStatus) => void): () => void;
  getActivePlanId(): string | null;
  pushNow(): Promise<any>;
  pullNow(): Promise<any>;
}

/** The narrow bridge script.js exposes to the account and sync modules. */
export interface BiblePlanApp {
  getState(): any;
  replaceState(nextState: any): boolean;
  onStateChange(listener: (state: any) => void): () => void;
  getBookCategory(bookName: string): string | null;
  showPage(page: string): void;
  storageKey: string;
}

declare global {
  interface Window {
    BiblePlanSupabase: BiblePlanSupabase;
    BiblePlanAuth: BiblePlanAuth;
    BiblePlanData: BiblePlanData;
    BiblePlanSync: BiblePlanSync;
    BiblePlanApp: BiblePlanApp;
    /** Set this yourself to bypass /api/config and supabase.config.json. */
    BIBLE_PLAN_PUBLIC_CONFIG?: { supabaseUrl: string; supabaseAnonKey: string };
    /** Sidebar account button renderer, owned by script.js. */
    updateAccountUI(profile: {
      isLoggedIn: boolean;
      name: string | null;
      avatarUrl: string | null;
    }): void;
  }
}
