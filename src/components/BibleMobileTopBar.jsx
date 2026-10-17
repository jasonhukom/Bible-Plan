export default function BibleMobileTopBar({
  bookTitle,
  translationShortName,
  onOpenBooks,
  onOpenTranslations,
  onOpenHistory,
  onOpenFontSettings
}) {
  return (
    <header className="bible-mobile-top-bar">
      <div className="bible-top-bar-left">
        {/* Rounded beige capsule split into two tappable chips */}
        <div className="bible-capsule" role="group" aria-label="Book and Translation Selector">
          <button
            type="button"
            className="bible-capsule-chip-book"
            onClick={onOpenBooks}
            title="Select Bible book and chapter"
            aria-label={`Current passage: ${bookTitle}. Tap to select book and chapter.`}
          >
            <span className="bible-capsule-book-text">{bookTitle}</span>
          </button>

          <span className="bible-capsule-divider" aria-hidden="true" />

          <button
            type="button"
            className="bible-capsule-chip-version"
            onClick={onOpenTranslations}
            title="Change Bible translation"
            aria-label={`Current version: ${translationShortName}. Tap to change translation.`}
          >
            <span className="bible-capsule-version-text">{translationShortName}</span>
          </button>
        </div>

        {/* Circular clock/history icon button next to the capsule */}
        <button
          type="button"
          className="bible-circle-btn bible-clock-btn"
          onClick={onOpenHistory}
          title="Reading History"
          aria-label="View reading history"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
        </button>
      </div>

      <div className="bible-top-bar-right">
        {/* Bold "Aa" icon (font settings) button on the far right */}
        <button
          type="button"
          className="bible-circle-btn bible-font-btn"
          onClick={onOpenFontSettings}
          title="Font and Reading Settings"
          aria-label="Font settings"
        >
          <span className="bible-font-aa-icon">Aa</span>
        </button>
      </div>
    </header>
  );
}
