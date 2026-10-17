export default function BibleTranslationsSheet({
  isOpen,
  onClose,
  translations = [],
  currentTranslationId,
  onSelectTranslation
}) {
  if (!isOpen) return null;

  return (
    <div
      className="bible-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Bible translations selector"
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
            aria-label="Close translations sheet"
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

          <h2 className="bible-sheet-title">Translations</h2>

          {/* Spacer for symmetry with the X button */}
          <div style={{ width: 34, height: 34 }} aria-hidden="true" />
        </div>

        <div className="bible-sheet-body">
          <div className="bible-translation-list">
            {translations.map((t) => {
              const isActive = t.id === currentTranslationId;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`bible-translation-card${isActive ? " active" : ""}`}
                  onClick={() => {
                    onSelectTranslation(t.id);
                    onClose();
                  }}
                >
                  <div className="bible-translation-info">
                    <span className="bible-translation-label">{t.label}</span>
                    {t.provider && (
                      <span className="bible-translation-badge">
                        {t.provider === "apibible"
                          ? "API.Bible"
                          : t.provider === "helloao"
                          ? "HelloAO"
                          : "YouVersion"}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <svg
                      className="bible-translation-check"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="var(--gold-bright)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
