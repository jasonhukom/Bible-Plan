import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuminessBot } from '../../components/LuminessWidget/LuminessBot.tsx';
import {
  BIBLE_PLAN_APP_VERSION,
  type BiblePlanScheduleFeed,
  type DesktopHeartbeatCheckResult,
  type DesktopPlatform,
  LUMINESS_EXTENSION_EVENT,
  LUMINESS_GITHUB_REPO,
  LUMINESS_IPC_ENDPOINT,
  LUMINESS_LOCK_MESSAGE,
  LUMINESS_RELEASE_URL,
  LUMINESS_SCHEDULE_EVENT,
  type LuminessExtensionState,
  buildLuminessHeartbeatPayload,
  buildLuminessLaunchQuery,
  checkLuminessDesktopHeartbeat,
  detectDesktopPlatform,
  getLuminessExtensionState,
  getTodayBibleScheduleFeed,
  isDesktopViewport,
  isLuminessExtensionActive,
  markTodayReadingCompleted,
  syncLuminessDesktopHandshake,
} from './luminessExtensionState.ts';
import './ExtensionsPage.css';

function formatPlatformLabel(platform: DesktopPlatform): string {
  switch (platform) {
    case 'windows':
      return 'Windows PC Desktop';
    case 'macos':
      return 'macOS Desktop';
    case 'linux':
      return 'Linux Desktop';
    case 'mobile':
      return 'Mobile Viewport (< 768px)';
    default:
      return 'Desktop Browser';
  }
}

export default function ExtensionsPage() {
  const [extState, setExtState] = useState<LuminessExtensionState>(() =>
    getLuminessExtensionState()
  );
  const [feed, setFeed] = useState<BiblePlanScheduleFeed>(() =>
    getTodayBibleScheduleFeed()
  );
  const [platform, setPlatform] = useState<DesktopPlatform>(() =>
    detectDesktopPlatform()
  );
  const [isDesktop, setIsDesktop] = useState<boolean>(() => isDesktopViewport());
  const [heartbeatInfo, setHeartbeatInfo] =
    useState<DesktopHeartbeatCheckResult | null>(null);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showJsonContract, setShowJsonContract] = useState<boolean>(false);

  const unlocked = isLuminessExtensionActive(extState);
  const remainingChapters = Math.max(0, feed.totalForToday - feed.completedForToday);
  const allDoneToday = feed.totalForToday > 0 && remainingChapters === 0;

  const refreshLocalState = useCallback(() => {
    setExtState(getLuminessExtensionState());
    setFeed(getTodayBibleScheduleFeed());
    setPlatform(detectDesktopPlatform());
    setIsDesktop(isDesktopViewport());
  }, []);

  const refreshDesktopHeartbeat = useCallback(async () => {
    const result = await checkLuminessDesktopHeartbeat();
    setHeartbeatInfo(result);
    return result;
  }, []);

  useEffect(() => {
    refreshLocalState();
    void refreshDesktopHeartbeat();

    window.addEventListener('resize', refreshLocalState);
    window.addEventListener(LUMINESS_EXTENSION_EVENT, refreshLocalState);
    window.addEventListener(LUMINESS_SCHEDULE_EVENT, refreshLocalState);
    window.addEventListener('storage', refreshLocalState);

    return () => {
      window.removeEventListener('resize', refreshLocalState);
      window.removeEventListener(LUMINESS_EXTENSION_EVENT, refreshLocalState);
      window.removeEventListener(LUMINESS_SCHEDULE_EVENT, refreshLocalState);
      window.removeEventListener('storage', refreshLocalState);
    };
  }, [refreshLocalState, refreshDesktopHeartbeat]);

  const handleToggleExtension = async () => {
    const nextEnabled = !extState.enabled;
    setIsBusy(true);
    try {
      const result = await syncLuminessDesktopHandshake({
        enabled: nextEnabled,
        installedFromBiblePlan: nextEnabled ? true : extState.installedFromBiblePlan,
        appVersion: BIBLE_PLAN_APP_VERSION,
        installedAt: extState.installedAt || new Date().toISOString(),
      });
      setExtState(result.state);
      await refreshDesktopHeartbeat();
      setStatusMessage(
        nextEnabled
          ? result.reachable
            ? `Luminess Assist turned ON and unlocked on desktop IPC (${BIBLE_PLAN_APP_VERSION}).`
            : `Luminess Assist turned ON for desktop web (>= 768px). Launch desktop Luminess to sync via ${LUMINESS_IPC_ENDPOINT}.`
          : result.reachable
            ? 'Luminess Assist turned OFF — desktop companion has been locked.'
            : 'Luminess Assist turned OFF — floating companion disabled and desktop lock armed.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleInstallDesktopExtension = async () => {
    if (!isDesktop || platform === 'mobile') {
      setStatusMessage(
        'Desktop installation requires a PC browser viewport (>= 768px). Mobile phone widgets remain disabled.'
      );
      return;
    }

    setIsBusy(true);
    try {
      const nowIso = new Date().toISOString();
      const result = await syncLuminessDesktopHandshake({
        installedFromBiblePlan: true,
        enabled: true,
        appVersion: BIBLE_PLAN_APP_VERSION,
        installedAt: extState.installedAt || nowIso,
      });
      setExtState(result.state);
      await refreshDesktopHeartbeat();

      if (typeof window !== 'undefined') {
        window.open(LUMINESS_RELEASE_URL, '_blank', 'noopener,noreferrer');
      }

      const launchQuery = buildLuminessLaunchQuery(result.state);
      setStatusMessage(
        result.reachable
          ? `Connected & pushed Alpha0.0.1 handshake + today's schedule to running Luminess desktop app.`
          : `Extension marked installed & ON (${BIBLE_PLAN_APP_VERSION}). Opened native installer releases; desktop app accepts handshake query "${launchQuery}" or live loopback IPC at ${LUMINESS_IPC_ENDPOINT}.`
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisconnectExtension = async () => {
    setIsBusy(true);
    try {
      const result = await syncLuminessDesktopHandshake({
        installedFromBiblePlan: false,
        enabled: false,
        appVersion: BIBLE_PLAN_APP_VERSION,
      });
      setExtState(result.state);
      await refreshDesktopHeartbeat();
      setStatusMessage(
        `Extension disconnected (${BIBLE_PLAN_APP_VERSION}). Desktop Luminess now displays: "${LUMINESS_LOCK_MESSAGE}"`
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSyncScheduleNow = async () => {
    setIsBusy(true);
    try {
      const result = await syncLuminessDesktopHandshake();
      setExtState(result.state);
      await refreshDesktopHeartbeat();
      setStatusMessage(
        result.reachable
          ? `Synced ${feed.readings.length} reading group(s) (${feed.totalForToday} chapters today) to Luminess Desktop.`
          : `Could not reach ${LUMINESS_IPC_ENDPOINT} (${result.error || 'desktop app not running'}). Web companion schedule is up to date.`
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header page-header-sticky">
        <div className="page-header-title-row">
          <h1 className="page-title">Extensions</h1>
          <p className="page-subtitle">
            Connect Luminess Assist Desktop & Web Companion ({BIBLE_PLAN_APP_VERSION})
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8 }}>
          <Link className="lum-ext-secondary-btn" to="/plan">
            Reading Plan
          </Link>
          <Link className="lum-ext-secondary-btn" to="/settings">
            Settings
          </Link>
        </div>
      </div>

      <div className="page-container-narrow" style={{ paddingBottom: 48 }}>
        {/* Hero Card: Luminess Extension Toggle, Preview & Install */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="lum-ext-hero">
            <div className="lum-ext-mascot-box">
              <LuminessBot
                mode="preview"
                size={108}
                emotion={!unlocked ? 'sadness' : allDoneToday ? 'joy' : 'idle'}
                statusPill={
                  !unlocked
                    ? 'Locked'
                    : allDoneToday
                      ? 'Done Today'
                      : `${remainingChapters} ch left`
                }
              />
            </div>

            <div>
              <div className="lum-ext-title-row">
                <h2 style={{ fontSize: 18, margin: 0 }}>Luminess Assist Extension</h2>
                <span className={`lum-ext-badge ${unlocked ? 'is-active' : 'is-locked'}`}>
                  {unlocked ? 'Active & Unlocked' : 'Locked / Inactive'}
                </span>
                <span className="lum-ext-badge is-gold">{BIBLE_PLAN_APP_VERSION}</span>
              </div>

              <p className="hint-text" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
                Brings your floating Luminess companion to Bible-Plan on PC web (
                <strong>&gt;= 768px only</strong>) and unlocks the native Rust/Tauri{' '}
                <strong>Luminess-Assist</strong> desktop app with live Bible reading reminders.
              </p>

              <div className="lum-ext-controls-row">
                <button
                  type="button"
                  className="lum-ext-toggle-btn"
                  aria-pressed={extState.enabled}
                  onClick={() => void handleToggleExtension()}
                  disabled={isBusy}
                >
                  <span className="lum-ext-switch-track" aria-hidden="true">
                    <span className="lum-ext-switch-knob" />
                  </span>
                  <span>{extState.enabled ? 'Extension ON' : 'Extension OFF'}</span>
                </button>

                <button
                  type="button"
                  className="lum-ext-primary-btn"
                  onClick={() => void handleInstallDesktopExtension()}
                  disabled={isBusy || !isDesktop || platform === 'mobile'}
                >
                  Install Luminess Desktop Extension
                </button>
              </div>
            </div>
          </div>

          <div
            className={`lum-ext-status-banner ${unlocked ? 'is-connected' : 'is-locked'}`}
          >
            {unlocked ? (
              <>
                <strong>Connection Active:</strong> Both PC Web Floating Companion (
                {isDesktop ? 'visible bottom-right on >= 768px screens' : 'hidden on < 768px mobile'}
                ) and native desktop handshake ({BIBLE_PLAN_APP_VERSION}) are enabled.
              </>
            ) : (
              <>
                <strong>Desktop Extension Locked:</strong> {LUMINESS_LOCK_MESSAGE}
              </>
            )}
          </div>

          {statusMessage && (
            <div className="lum-ext-status-banner" role="status">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Heartbeat, IPC & Version Lifecycle Lock Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, marginBottom: 6 }}>
            Desktop Lifecycle Lock & Loopback IPC
          </h2>
          <p className="hint-text" style={{ margin: 0 }}>
            Native <code>Luminess-Assist</code> only runs when installed from Bible-Plan and kept
            ON at version <code>{BIBLE_PLAN_APP_VERSION}</code> via loopback IPC or{' '}
            <code>/api/extensions/luminess-heartbeat</code>.
          </p>

          <div className="lum-ext-grid-2">
            <div className="lum-ext-kv">
              <div className="lum-ext-kv-label">Detected Environment</div>
              <div className="lum-ext-kv-value">{formatPlatformLabel(platform)}</div>
            </div>
            <div className="lum-ext-kv">
              <div className="lum-ext-kv-label">Desktop App IPC ({LUMINESS_IPC_ENDPOINT})</div>
              <div className="lum-ext-kv-value">
                {heartbeatInfo === null
                  ? 'Checking...'
                  : heartbeatInfo.reachable
                    ? heartbeatInfo.unlocked
                      ? 'Reachable • Unlocked'
                      : 'Reachable • Locked'
                    : 'Not running locally'}
              </div>
            </div>
            <div className="lum-ext-kv">
              <div className="lum-ext-kv-label">Installed From Bible-Plan</div>
              <div className="lum-ext-kv-value">
                {extState.installedFromBiblePlan ? `Yes (${extState.appVersion})` : 'No'}
              </div>
            </div>
            <div className="lum-ext-kv">
              <div className="lum-ext-kv-label">Last Desktop Sync</div>
              <div className="lum-ext-kv-value">
                {extState.lastHeartbeatAt
                  ? new Date(extState.lastHeartbeatAt).toLocaleString()
                  : 'Never pushed'}
              </div>
            </div>
          </div>

          <div className="lum-ext-controls-row">
            <button
              type="button"
              className="lum-ext-secondary-btn"
              onClick={() => void refreshDesktopHeartbeat()}
              disabled={isBusy}
            >
              Check Heartbeat
            </button>
            <button
              type="button"
              className="lum-ext-secondary-btn"
              onClick={() => void handleSyncScheduleNow()}
              disabled={isBusy}
            >
              Sync Bible Schedule Now
            </button>
            <button
              type="button"
              className="lum-ext-secondary-btn"
              onClick={() => void handleDisconnectExtension()}
              disabled={isBusy}
            >
              Disconnect & Lock Desktop
            </button>
            <a
              className="lum-ext-secondary-btn"
              href={LUMINESS_GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
            <button
              type="button"
              className="lum-ext-secondary-btn"
              onClick={() => setShowJsonContract((v) => !v)}
            >
              {showJsonContract ? 'Hide Heartbeat JSON' : 'Inspect Heartbeat JSON'}
            </button>
          </div>

          {showJsonContract && (
            <pre className="lum-ext-code-pre">
              {JSON.stringify(buildLuminessHeartbeatPayload(extState), null, 2)}
            </pre>
          )}
        </div>

        {/* Today's Bible Plan Feed Card */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ fontSize: 15, margin: 0 }}>
                Today&apos;s Companion Reading Feed
              </h2>
              <p className="hint-text" style={{ margin: '4px 0 0' }}>
                {feed.planName} • {feed.todayDate} ({feed.completedForToday}/{feed.totalForToday}{' '}
                chapters complete)
              </p>
            </div>
            <Link className="lum-ext-secondary-btn" to="/plan">
              Open Plan
            </Link>
          </div>

          {feed.readings.length === 0 ? (
            <p className="hint-text" style={{ margin: 0 }}>
              No readings are scheduled for today yet. Configure or generate a reading plan in the{' '}
              <Link to="/plan" style={{ textDecoration: 'underline' }}>
                Plan page
              </Link>
              , and Luminess will remind you here automatically.
            </p>
          ) : (
            <div>
              {feed.readings.map((item) => {
                const firstChapter = item.chapters[0] || 1;
                return (
                  <div key={item.book} className="lum-ext-reading-item">
                    <div>
                      <strong>
                        {item.bookName} {item.chaptersText}
                      </strong>
                      <div className="hint-text" style={{ margin: '2px 0 0', fontSize: 12 }}>
                        {item.completed ? 'Completed today' : 'Pending reminder'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className="lum-ext-secondary-btn"
                        onClick={() => {
                          const updated = markTodayReadingCompleted(
                            item.rowIds,
                            !item.completed
                          );
                          setFeed(updated);
                        }}
                      >
                        {item.completed ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <Link
                        className="lum-ext-secondary-btn"
                        to={`/bible/${feed.translation}/${item.book}/${firstChapter}`}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
