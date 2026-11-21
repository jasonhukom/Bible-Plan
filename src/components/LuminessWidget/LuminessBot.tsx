import React, { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  BIBLE_PLAN_APP_VERSION,
  type BiblePlanScheduleFeed,
  LUMINESS_EXTENSION_EVENT,
  type LuminessExtensionState,
  LUMINESS_LOCK_MESSAGE,
  LUMINESS_SCHEDULE_EVENT,
  getLuminessExtensionState,
  getTodayBibleScheduleFeed,
  isDesktopViewport,
  isLuminessExtensionActive,
  markTodayReadingCompleted,
  syncLuminessDesktopHandshake,
} from '../../pages/Extensions/luminessExtensionState.ts';
import './LuminessBot.css';

export type LuminessEmotion = 'idle' | 'joy' | 'love' | 'curiosity' | 'sadness';

interface FaceConfig {
  left: string;
  right: string;
  leftBrow?: string;
  rightBrow?: string;
  mouth?: string;
  blush?: boolean;
}

const EMOTION_FACES: Record<LuminessEmotion, FaceConfig> = {
  idle: {
    left: 'M 65 94 C 65 86, 85 86, 85 94 C 85 102, 65 102, 65 94 Z',
    right: 'M 115 94 C 115 86, 135 86, 135 94 C 135 102, 115 102, 115 94 Z',
    mouth: 'M 87 116 Q 100 123 113 116',
  },
  joy: {
    left: 'M 60 98 Q 75 74 90 98 Q 75 84 60 98',
    right: 'M 110 98 Q 125 74 140 98 Q 125 84 110 98',
    leftBrow: 'M 62 76 Q 75 70 88 75',
    rightBrow: 'M 112 75 Q 125 70 138 76',
    mouth: 'M 86 111 Q 100 125 114 111',
    blush: true,
  },
  sadness: {
    left: 'M 64 102 Q 75 90 89 95 Q 75 101 64 102',
    right: 'M 111 95 Q 125 90 136 102 Q 125 101 111 95',
    leftBrow: 'M 60 84 Q 74 79 88 74',
    rightBrow: 'M 112 74 Q 126 79 140 84',
    mouth: 'M 89 121 Q 100 112 111 121',
  },
  curiosity: {
    left: 'M 62 93 A 13 14 0 1 1 88 93 A 13 14 0 1 1 62 93',
    right: 'M 115 95 C 115 89, 135 89, 135 95 C 135 101, 115 101, 115 95',
    leftBrow: 'M 61 71 Q 75 63 89 71',
    rightBrow: 'M 113 80 L 137 78',
    mouth: 'M 96 116 A 4 4 0 1 1 104 116 A 4 4 0 1 1 96 116',
  },
  love: {
    left: 'M 75 106 C 63 98, 59 86, 66 80 C 71 76, 75 81, 75 85 C 75 81, 79 76, 84 80 C 91 86, 87 98, 75 106 Z',
    right: 'M 125 106 C 113 98, 109 86, 116 80 C 121 76, 125 81, 125 85 C 125 81, 129 76, 134 80 C 141 86, 137 98, 125 106 Z',
    leftBrow: 'M 62 72 Q 75 67 88 73',
    rightBrow: 'M 112 73 Q 125 67 138 72',
    mouth: 'M 88 112 Q 94 121 100 114 Q 106 121 112 112',
    blush: true,
  },
};

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
}

export interface LuminessBotProps {
  mode?: 'floating' | 'preview';
  size?: number;
  emotion?: LuminessEmotion;
  statusPill?: string;
  onClick?: () => void;
}

export function LuminessMascotVisual({
  size = 112,
  emotion = 'idle',
  statusPill,
  onClick,
  staticFloat = false,
}: {
  size?: number;
  emotion?: LuminessEmotion;
  statusPill?: string;
  onClick?: () => void;
  staticFloat?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const headShellId = `lum-head-shell-${uid}`;
  const screenGlareId = `lum-screen-glare-${uid}`;
  const eyeGlowId = `lum-neon-eye-glow-${uid}`;
  const antennaBloomId = `lum-antenna-bloom-${uid}`;

  const [hovered, setHovered] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const heartIdRef = useRef(0);
  const lastHeartAtRef = useRef(0);

  const face = EMOTION_FACES[emotion] || EMOTION_FACES.idle;

  const spawnHeart = useCallback(() => {
    const now = Date.now();
    if (now - lastHeartAtRef.current < 320) return;
    lastHeartAtRef.current = now;
    const id = ++heartIdRef.current;
    const heart: FloatingHeart = {
      id,
      x: 32 + Math.random() * 36,
      y: 22 + Math.random() * 18,
      size: 10 + Math.random() * 6,
    };
    setHearts((prev) => [...prev.slice(-4), heart]);
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((item) => item.id !== id));
    }, 1150);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setGaze({
      x: Math.max(-3.6, Math.min(3.6, nx * 3.6)),
      y: Math.max(-2.8, Math.min(2.8, ny * 2.8)),
    });
  };

  return (
    <button
      type="button"
      className={`lum-robot-container emotion-${emotion} ${hovered ? 'is-hovered' : ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={() => {
        spawnHeart();
        onClick?.();
      }}
      onMouseEnter={() => {
        setHovered(true);
        spawnHeart();
      }}
      onMouseLeave={() => {
        setHovered(false);
        setGaze({ x: 0, y: 0 });
      }}
      onPointerMove={handlePointerMove}
      aria-label={
        statusPill
          ? `Luminess Assist companion (${statusPill})`
          : 'Luminess Assist companion'
      }
      title="Luminess Assist • Click to view today's Bible Plan readings"
    >
      <div className="lum-robot-glow-bg" aria-hidden="true" />
      <div className="lum-robot-glow-core" aria-hidden="true" />

      <div className="lum-robot-hearts-layer" aria-hidden="true">
        {hearts.map((h) => (
          <svg
            key={h.id}
            className="lum-floating-heart"
            viewBox="0 0 24 24"
            style={
              {
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.size}px`,
                height: `${h.size}px`,
              } as CSSProperties
            }
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#f472b6"
            />
          </svg>
        ))}
      </div>

      {statusPill && <div className="lum-robot-status-pill">{statusPill}</div>}

      <svg
        className={`lum-robot-svg ${staticFloat ? 'is-static' : ''}`}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={screenGlareId} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <linearGradient id={headShellId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#26273b" />
            <stop offset="100%" stopColor="#141522" />
          </linearGradient>

          <filter id={eyeGlowId} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={antennaBloomId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="lum-robot-antenna-group">
          <rect x="95" y="12" width="10" height="36" rx="5" className="lum-robot-antenna-stem" />
          <circle
            cx="100"
            cy="12"
            r="10"
            className="lum-robot-antenna-bulb"
            filter={`url(#${antennaBloomId})`}
          />
        </g>

        <g className="lum-robot-head-group">
          <rect x="24" y="80" width="20" height="40" rx="10" className="lum-robot-ear" />
          <rect x="156" y="80" width="20" height="40" rx="10" className="lum-robot-ear" />

          <rect
            x="40"
            y="40"
            width="120"
            height="120"
            rx="35"
            className="lum-robot-head"
            style={{ fill: `url(#${headShellId})` }}
          />

          <rect x="50" y="55" width="100" height="85" rx="20" className="lum-robot-screen" />
          <rect x="50" y="55" width="100" height="85" rx="20" fill={`url(#${screenGlareId})`} opacity="0.85" />

          <g
            className="lum-eyes-container"
            filter={`url(#${eyeGlowId})`}
            style={{ transform: `translate(${gaze.x}px, ${gaze.y}px)` }}
          >
            {face.blush && (
              <g>
                <ellipse cx="64" cy="109" rx="9" ry="4.5" className="lum-cheek-blush" />
                <ellipse cx="136" cy="109" rx="9" ry="4.5" className="lum-cheek-blush" />
              </g>
            )}
            {face.leftBrow && <path className="lum-brow" d={face.leftBrow} />}
            {face.rightBrow && <path className="lum-brow" d={face.rightBrow} />}
            <path className="lum-eye lum-left-eye" d={face.left} />
            <path className="lum-eye lum-right-eye" d={face.right} />
            {face.mouth && <path className="lum-mouth" d={face.mouth} />}
          </g>
        </g>
      </svg>
    </button>
  );
}

export function LuminessBot({
  mode = 'floating',
  size = 112,
  emotion: forcedEmotion,
  statusPill: forcedStatusPill,
  onClick,
}: LuminessBotProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => isDesktopViewport());
  const [extState, setExtState] = useState<LuminessExtensionState>(() =>
    getLuminessExtensionState()
  );
  const [feed, setFeed] = useState<BiblePlanScheduleFeed>(() =>
    getTodayBibleScheduleFeed()
  );
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  const refreshData = useCallback(() => {
    const nextState = getLuminessExtensionState();
    setExtState(nextState);
    setFeed(getTodayBibleScheduleFeed());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewport = () => {
      setIsDesktop(isDesktopViewport());
    };

    const mql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(min-width: 768px)')
        : null;

    handleViewport();
    mql?.addEventListener?.('change', handleViewport);
    window.addEventListener('resize', handleViewport);
    window.addEventListener(LUMINESS_EXTENSION_EVENT, refreshData);
    window.addEventListener(LUMINESS_SCHEDULE_EVENT, refreshData);
    window.addEventListener('storage', refreshData);
    window.addEventListener('focus', refreshData);

    const timer = window.setInterval(refreshData, 30000);

    return () => {
      mql?.removeEventListener?.('change', handleViewport);
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener(LUMINESS_EXTENSION_EVENT, refreshData);
      window.removeEventListener(LUMINESS_SCHEDULE_EVENT, refreshData);
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('focus', refreshData);
      window.clearInterval(timer);
    };
  }, [refreshData]);

  // Keep local desktop Luminess Assist synchronized while floating web companion is active
  useEffect(() => {
    if (mode !== 'floating' || !isDesktop) return undefined;
    if (!isLuminessExtensionActive(extState)) return undefined;
    void syncLuminessDesktopHandshake();
    return undefined;
  }, [mode, isDesktop, extState.enabled, extState.installedFromBiblePlan, extState.appVersion]);

  const remainingChapters = Math.max(0, feed.totalForToday - feed.completedForToday);
  const unreadReadings = feed.readings.filter((r) => !r.completed);
  const unlocked = isLuminessExtensionActive(extState);

  const derivedEmotion: LuminessEmotion =
    forcedEmotion ??
    (!unlocked
      ? 'sadness'
      : feed.totalForToday > 0 && remainingChapters === 0
        ? 'joy'
        : panelOpen
          ? 'curiosity'
          : 'idle');

  const derivedStatusPill =
    forcedStatusPill ??
    (!unlocked
      ? 'Locked'
      : feed.totalForToday === 0
        ? 'Ready'
        : remainingChapters === 0
          ? "Today's plan done"
          : `${remainingChapters} ch left today`);

  if (mode === 'preview') {
    return (
      <div className="lum-preview-stage">
        <LuminessMascotVisual
          size={size}
          emotion={derivedEmotion}
          statusPill={derivedStatusPill}
          onClick={onClick}
        />
      </div>
    );
  }

  // Strictly PC-only (>= 768px) and strictly gated by the Bible-Plan Extension toggle
  if (!isDesktop || !unlocked) {
    return null;
  }

  const reminderSummary = !unlocked
    ? LUMINESS_LOCK_MESSAGE
    : feed.totalForToday === 0
      ? 'No Bible chapters are scheduled for today yet. Visit your Plan page to set up or adjust your reading schedule.'
      : remainingChapters === 0
        ? `Amazing! You finished all ${feed.totalForToday} chapter${feed.totalForToday === 1 ? '' : 's'} scheduled for today.`
        : `Today's reminder: ${unreadReadings
            .slice(0, 3)
            .map((item) => `${item.bookName} ${item.chaptersText}`)
            .join(' • ')}${unreadReadings.length > 3 ? ` (+${unreadReadings.length - 3} more)` : ''}`;

  return (
    <aside className="lum-desktop-widget-root" aria-label="Luminess Desktop Companion">
      {panelOpen && (
        <section
          className={`lum-companion-panel emotion-${derivedEmotion}`}
          aria-label="Today's Bible Reading Companion"
        >
          <header className="lum-panel-header">
            <div className="lum-panel-title-wrap">
              <div className="lum-panel-title">
                <span>Luminess Assist</span>
                <span className="lum-version-chip">{BIBLE_PLAN_APP_VERSION}</span>
              </div>
              <span className="lum-panel-subtitle">
                {feed.planName} • {feed.todayDate}
              </span>
            </div>
            <button
              type="button"
              className="lum-panel-close-btn"
              onClick={() => setPanelOpen(false)}
              aria-label="Minimize Luminess companion"
            >
              ×
            </button>
          </header>

          <div
            className={`lum-reminder-callout ${
              feed.totalForToday > 0 && remainingChapters === 0 ? 'is-done' : ''
            }`}
          >
            <p className="lum-reminder-text">{reminderSummary}</p>
          </div>

          {feed.readings.length > 0 && (
            <div className="lum-reading-list">
              {feed.readings.map((item) => {
                const firstChapter = item.chapters[0] || 1;
                return (
                  <div
                    key={item.book}
                    className={`lum-reading-row ${item.completed ? 'is-completed' : ''}`}
                  >
                    <div className="lum-reading-left">
                      <button
                        type="button"
                        className={`lum-reading-check ${item.completed ? 'checked' : ''}`}
                        onClick={() => {
                          const nextFeed = markTodayReadingCompleted(
                            item.rowIds,
                            !item.completed
                          );
                          setFeed(nextFeed);
                        }}
                        aria-label={`Mark ${item.bookName} ${item.chaptersText} as ${
                          item.completed ? 'unread' : 'read'
                        }`}
                      >
                        {item.completed ? '✓' : ''}
                      </button>
                      <span className="lum-reading-book">
                        {item.bookName}{' '}
                        <span className="lum-reading-ch">{item.chaptersText}</span>
                      </span>
                    </div>
                    <Link
                      className="lum-reading-open-link"
                      to={`/bible/${feed.translation}/${item.book}/${firstChapter}`}
                    >
                      Read
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <footer className="lum-panel-footer">
            <Link className="lum-footer-link primary" to="/plan">
              Open Bible Plan
            </Link>
            <Link className="lum-footer-link" to="/extensions">
              Extension Settings
            </Link>
          </footer>
        </section>
      )}

      <div className="lum-bot-trigger-wrap">
        <LuminessMascotVisual
          size={size}
          emotion={derivedEmotion}
          statusPill={derivedStatusPill}
          onClick={() => {
            setPanelOpen((prev) => !prev);
            onClick?.();
          }}
        />
      </div>
    </aside>
  );
}

export default LuminessBot;
