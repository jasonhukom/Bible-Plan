export default function BibleFontSheet({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) {
  if (!isOpen) return null;

  const fontSizes = [18, 20, 22, 25, 28];
  const currentSize = settings.fontSize || 22;

  function setSize(nextSize) {
    onUpdateSettings({ ...settings, fontSize: nextSize });
  }

  function adjustSize(delta) {
    const currentIndex = fontSizes.indexOf(currentSize);
    let nextIndex = (currentIndex === -1 ? 2 : currentIndex) + delta;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= fontSizes.length) nextIndex = fontSizes.length - 1;
    setSize(fontSizes[nextIndex]);
  }

  function setLineHeight(lh) {
    onUpdateSettings({ ...settings, lineHeight: lh });
  }

  function setFontFamily(ff) {
    onUpdateSettings({ ...settings, fontFamily: ff });
  }

  function setReaderTheme(theme) {
    onUpdateSettings({ ...settings, readerTheme: theme });
  }

  return (
    <div
      className="bible-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Font and reading settings"
    >
      <div className="bible-bottom-sheet">
        {/* Small drag handle */}
        <div className="bible-sheet-handle" aria-hidden="true" />

        {/* Header with circular white "X" button and bold centered title */}
        <div className="bible-sheet-header">
          <button
            type="button"
            className="bible-sheet-close-btn"
            onClick={onClose}
            aria-label="Close font settings"
            title="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 className="bible-sheet-title">Font Settings</h2>

          {/* Spacer */}
          <div style={{ width: 34, height: 34 }} aria-hidden="true" />
        </div>

        <div className="bible-sheet-body" style={{ paddingBottom: 28 }}>
          {/* Font Size controls */}
          <div className="bible-setting-section">
            <div className="bible-setting-header">
              <span className="bible-setting-label">Font Size</span>
              <span className="bible-setting-value">{currentSize}px</span>
            </div>
            <div className="bible-font-stepper">
              <button
                type="button"
                className="bible-font-stepper-btn"
                onClick={() => adjustSize(-1)}
                disabled={currentSize <= fontSizes[0]}
                aria-label="Decrease font size"
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>A-</span>
              </button>

              <div className="bible-font-size-dots">
                {fontSizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`bible-font-dot${currentSize === sz ? " active" : ""}`}
                    onClick={() => setSize(sz)}
                    aria-label={`Set size to ${sz}px`}
                  >
                    <span style={{ fontSize: `${11 + (sz - 18) * 0.4}px` }}>A</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="bible-font-stepper-btn"
                onClick={() => adjustSize(1)}
                disabled={currentSize >= fontSizes[fontSizes.length - 1]}
                aria-label="Increase font size"
              >
                <span style={{ fontSize: 16, fontWeight: 700 }}>A+</span>
              </button>
            </div>
          </div>

          {/* Line spacing controls */}
          <div className="bible-setting-section">
            <div className="bible-setting-header">
              <span className="bible-setting-label">Line Spacing</span>
            </div>
            <div className="bible-setting-pill-group">
              {[
                { label: "Standard", value: 1.8 },
                { label: "Generous", value: 2.15 },
                { label: "Relaxed", value: 2.45 }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`bible-setting-pill-btn${
                    Math.abs((settings.lineHeight || 2.15) - opt.value) < 0.05 ? " active" : ""
                  }`}
                  onClick={() => setLineHeight(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font family controls */}
          <div className="bible-setting-section">
            <div className="bible-setting-header">
              <span className="bible-setting-label">Typography Style</span>
            </div>
            <div className="bible-setting-pill-group">
              <button
                type="button"
                className={`bible-setting-pill-btn${
                  (settings.fontFamily || "serif") === "serif" ? " active" : ""
                }`}
                onClick={() => setFontFamily("serif")}
                style={{ fontFamily: 'var(--font-display, "Spectral", serif)', fontSize: 15 }}
              >
                Serif (Spectral)
              </button>
              <button
                type="button"
                className={`bible-setting-pill-btn${
                  settings.fontFamily === "sans" ? " active" : ""
                }`}
                onClick={() => setFontFamily("sans")}
                style={{ fontFamily: 'var(--font-body, "Karla", sans-serif)', fontSize: 14 }}
              >
                Sans-Serif (Karla)
              </button>
            </div>
          </div>

          {/* Reading Theme */}
          <div className="bible-setting-section" style={{ borderBottom: "none" }}>
            <div className="bible-setting-header">
              <span className="bible-setting-label">Theme Background</span>
            </div>
            <div className="bible-theme-swatches">
              {[
                { id: "dark", label: "Night", bg: "#1e303c", text: "#ede4d0" },
                { id: "paper", label: "Paper", bg: "#f1e7d2", text: "#2b2013" },
                { id: "oled", label: "Black", bg: "#0d1318", text: "#e8dec8" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`bible-theme-swatch${
                    (settings.readerTheme || "dark") === t.id ? " active" : ""
                  }`}
                  onClick={() => setReaderTheme(t.id)}
                  style={{ background: t.bg, color: t.text }}
                >
                  <span className="bible-theme-swatch-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
