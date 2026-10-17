export default function BibleFloatingNav({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  prevLabel = "Previous chapter",
  nextLabel = "Next chapter",
  leftOffset
}) {
  return (
    <div className="bible-floating-nav-container" aria-label="Chapter navigation">
      {/* Floating button: circular button with gold thin arrow "<" hovering near lower left edge */}
      <button
        type="button"
        className={`bible-floating-btn bible-floating-prev${!hasPrev ? " disabled" : ""}`}
        onClick={onPrev}
        disabled={!hasPrev}
        title={prevLabel}
        aria-label={prevLabel}
        style={leftOffset ? { left: leftOffset } : undefined}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold-bright, #dbb558)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Floating button: circular button with gold thin arrow ">" hovering near lower right edge */}
      <button
        type="button"
        className={`bible-floating-btn bible-floating-next${!hasNext ? " disabled" : ""}`}
        onClick={onNext}
        disabled={!hasNext}
        title={nextLabel}
        aria-label={nextLabel}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--gold-bright, #dbb558)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
