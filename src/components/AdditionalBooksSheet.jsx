import { useState, useEffect } from "react";
import { EXTRA_COLLECTIONS, getWhereTheyGoPreview } from "../lib/extraBooksRegistry";
import { getExtraBooksToggles, setExtraBooksToggles } from "../lib/extraBooksApi";

const COLLECTIONS_LIST = ["DC", "ORT", "ETH", "PSE", "NTA"];

export default function AdditionalBooksSheet({ isOpen, onClose }) {
  const [toggles, setToggles] = useState(() => getExtraBooksToggles());
  const [expandedPreview, setExpandedPreview] = useState({});

  useEffect(() => {
    if (isOpen) {
      setToggles(getExtraBooksToggles());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleToggle(colId, e) {
    if (e) e.stopPropagation();
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(10);
      } catch {}
    }
    const next = {
      ...toggles,
      [colId]: !toggles[colId]
    };
    setToggles(next);
    setExtraBooksToggles(next);
  }

  function togglePreview(colId, e) {
    e.stopPropagation();
    setExpandedPreview((prev) => ({
      ...prev,
      [colId]: !prev[colId]
    }));
  }

  return (
    <div
      className="bible-sheet-backdrop bible-extra-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Additional Books Settings"
    >
      <div className="bible-bottom-sheet bible-extra-sheet">
        {/* Drag handle */}
        <div className="bible-sheet-handle" aria-hidden="true" />

        {/* Header */}
        <div className="bible-sheet-header extra-sheet-header">
          <button
            type="button"
            className="bible-sheet-close-btn"
            onClick={onClose}
            aria-label="Close additional books"
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

          <div className="extra-sheet-title-group">
            <h2 className="extra-sheet-title">Additional Books</h2>
            <span className="extra-sheet-tag">Optional</span>
          </div>

          <div style={{ width: 34, height: 34 }} aria-hidden="true" />
        </div>

        {/* Subtitle helper line */}
        <div className="extra-sheet-intro">
          <p className="extra-sheet-desc">
            Turn on extra books. They appear in the book list where they traditionally belong.
          </p>
        </div>

        {/* Five collection rows in a unified rounded card */}
        <div className="bible-sheet-body extra-sheet-body">
          <div className="extra-collections-card">
            {COLLECTIONS_LIST.map((colId, index) => {
              const col = EXTRA_COLLECTIONS[colId];
              const isOn = Boolean(toggles[colId]);
              const isExpanded = Boolean(expandedPreview[colId]);
              const previewText = getWhereTheyGoPreview(colId);

              return (
                <div
                  key={colId}
                  className={`extra-collection-row${isOn ? " active" : ""}${
                    index < COLLECTIONS_LIST.length - 1 ? " with-divider" : ""
                  }`}
                  onClick={(e) => handleToggle(colId, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggle(colId, e);
                    }
                  }}
                  aria-pressed={isOn}
                  aria-label={`${col.name}, ${isOn ? "on" : "off"}`}
                >
                  <div className="extra-row-main">
                    {/* Left: Beige rounded label chip */}
                    <span className="extra-chip-label">{col.shortLabel}</span>

                    {/* Middle: Bold name, gray subtitle, where they go trigger */}
                    <div className="extra-row-text">
                      <div className="extra-row-title-line">
                        <span className="extra-row-name">{col.name}</span>
                      </div>
                      <div className="extra-row-subtitle">{col.subtitle}</div>

                      <button
                        type="button"
                        className="extra-where-they-go-btn"
                        onClick={(e) => togglePreview(colId, e)}
                        aria-expanded={isExpanded}
                      >
                        <span>Where they go</span>
                        <svg
                          className={`extra-chevron${isExpanded ? " open" : ""}`}
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    {/* Right: Toggle switch */}
                    <div className="extra-switch-wrap">
                      <div
                        className={`extra-toggle-switch${isOn ? " on" : ""}`}
                        role="switch"
                        aria-checked={isOn}
                        aria-label={`${col.name} toggle`}
                      >
                        <div className="extra-toggle-knob" />
                      </div>
                    </div>
                  </div>

                  {/* Expandable "Where they go" preview */}
                  {isExpanded && (
                    <div
                      className="extra-preview-panel"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="extra-preview-content">
                        <span className="extra-preview-heading">Placement preview:</span>
                        <p className="extra-preview-text">{previewText}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="extra-sheet-footer">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="var(--gold-bright)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.85, flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
              Extra books may use a different translation than the one you selected. The
              source is shown above each chapter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
