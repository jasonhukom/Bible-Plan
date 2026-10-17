import { useState, useMemo, useEffect, useRef } from "react";
import { GROUP_LABELS } from "../lib/bibleBooks";

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function BibleBooksSheet({
  isOpen,
  onClose,
  books = [],
  grouped = {},
  currentBookId,
  currentChapter,
  onSelectChapter,
  initialTab = "books",
  history = [],
  onSelectHistory,
  onClearHistory
}) {
  const [tab, setTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestament, setSelectedTestament] = useState("all");
  const [expandedBookId, setExpandedBookId] = useState(currentBookId || null);
  const searchInputRef = useRef(null);

  // Sync tab with initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setSearchQuery("");
      setExpandedBookId(currentBookId || null);
    }
  }, [isOpen, initialTab, currentBookId]);

  // Focus search input when switching to books tab with query
  useEffect(() => {
    if (isOpen && tab === "books" && searchInputRef.current) {
      // Small timeout to allow transition
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, tab]);

  // Filter books by search query
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return books.filter((b) => {
      const name = (b.name || "").toLowerCase();
      const commonName = (b.commonName || "").toLowerCase();
      const id = (b.id || "").toLowerCase();
      return name.includes(q) || commonName.includes(q) || id.includes(q);
    });
  }, [books, searchQuery]);

  if (!isOpen) return null;

  function toggleBook(bookId) {
    setExpandedBookId((prev) => (prev === bookId ? null : bookId));
  }

  function handleChapterClick(bookId, ch) {
    onSelectChapter(bookId, ch);
    onClose();
  }

  return (
    <div
      className="bible-sheet-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Books and chapters navigation"
    >
      <div className="bible-bottom-sheet">
        {/* Small drag handle at the top */}
        <div className="bible-sheet-handle" aria-hidden="true" />

        {/* Header: White circular "X" button on the left, bold centered "Books" title, circular clock icon on the right */}
        <div className="bible-sheet-header">
          <button
            type="button"
            className="bible-sheet-close-btn"
            onClick={onClose}
            aria-label="Close books sheet"
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

          <h2 className="bible-sheet-title">
            {tab === "history" ? "History" : "Books"}
          </h2>

          <button
            type="button"
            className={`bible-sheet-clock-btn${tab === "history" ? " active" : ""}`}
            onClick={() => setTab((prev) => (prev === "history" ? "books" : "history"))}
            title={tab === "history" ? "Show books list" : "Show reading history"}
            aria-label={tab === "history" ? "Switch to books list" : "Switch to reading history"}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          </button>
        </div>

        {tab === "books" && (
          <>
            {/* Search: pill-shaped field with a magnifier icon and placeholder "Search books" */}
            <div className="bible-sheet-search-wrap">
              <svg
                className="bible-sheet-search-icon"
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="bible-sheet-search-input"
                placeholder="Search books"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search books"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="bible-sheet-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search text"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Testament quick filter tabs when not searching */}
            {!filteredBooks && (
              <div className="bible-sheet-tabs">
                <button
                  type="button"
                  className={`bible-sheet-tab${selectedTestament === "all" ? " active" : ""}`}
                  onClick={() => setSelectedTestament("all")}
                >
                  All Books
                </button>
                <button
                  type="button"
                  className={`bible-sheet-tab${selectedTestament === "ot" ? " active" : ""}`}
                  onClick={() => setSelectedTestament("ot")}
                >
                  Old Testament
                </button>
                <button
                  type="button"
                  className={`bible-sheet-tab${selectedTestament === "nt" ? " active" : ""}`}
                  onClick={() => setSelectedTestament("nt")}
                >
                  New Testament
                </button>
              </div>
            )}
          </>
        )}

        {/* Scrollable sheet body */}
        <div className="bible-sheet-body">
          {tab === "history" ? (
            <div className="bible-history-list">
              {history && history.length > 0 ? (
                <>
                  <div className="bible-history-items">
                    {history.map((item, idx) => (
                      <button
                        key={`${item.bookId}-${item.chapter}-${idx}`}
                        type="button"
                        className="bible-history-item"
                        onClick={() => {
                          onSelectHistory(item);
                          onClose();
                        }}
                      >
                        <div className="bible-history-item-main">
                          <span className="bible-history-passage">
                            {item.bookName} {item.chapter}
                          </span>
                          <span className="bible-history-version">
                            {item.translationId}
                          </span>
                        </div>
                        <span className="bible-history-time">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {onClearHistory && (
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: 13, color: "var(--ink-soft)" }}
                        onClick={onClearHistory}
                      >
                        Clear History
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bible-sheet-empty">
                  <svg
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.5, marginBottom: 10 }}
                  >
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 15" />
                  </svg>
                  <p>No reading history yet.</p>
                  <span style={{ fontSize: 12, opacity: 0.65 }}>
                    Chapters you visit will appear here for fast access.
                  </span>
                </div>
              )}
            </div>
          ) : filteredBooks ? (
            /* Search results list */
            <div className="bible-search-results">
              {filteredBooks.length === 0 ? (
                <div className="bible-sheet-empty">
                  <p>No books matching "{searchQuery}"</p>
                </div>
              ) : (
                filteredBooks.map((book) => {
                  const isExpanded = expandedBookId === book.id;
                  return (
                    <div key={book.id} className="bible-sheet-book-card">
                      <button
                        type="button"
                        className={`bible-sheet-book-btn${isExpanded ? " active" : ""}`}
                        onClick={() => toggleBook(book.id)}
                      >
                        <span className="bible-sheet-book-name">
                          {book.commonName || book.name}
                        </span>
                        <span className="bible-sheet-book-count">
                          {book.numberOfChapters} {book.numberOfChapters === 1 ? "ch" : "chs"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="bible-sheet-chapters-grid">
                          {Array.from({ length: book.numberOfChapters }, (_, i) => i + 1).map((ch) => {
                            const isCurrent =
                              currentBookId === book.id && Number(currentChapter) === ch;
                            return (
                              <button
                                key={ch}
                                type="button"
                                className={`bible-sheet-chapter-btn${isCurrent ? " current" : ""}`}
                                onClick={() => handleChapterClick(book.id, ch)}
                              >
                                {ch}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Standard Testament book groups */
            <div className="bible-sheet-testaments">
              {(selectedTestament === "all"
                ? ["ot", "nt"]
                : selectedTestament === "ot"
                ? ["ot"]
                : ["nt"]
              ).map((groupKey) => {
                const groupList = grouped[groupKey] || [];
                if (!groupList.length) return null;
                return (
                  <div key={groupKey} className="bible-sheet-group">
                    <div className="bible-sheet-group-label">
                      {GROUP_LABELS[groupKey]}
                    </div>
                    {groupList.map((book) => {
                      const isExpanded = expandedBookId === book.id;
                      return (
                        <div key={book.id} className="bible-sheet-book-card">
                          <button
                            type="button"
                            className={`bible-sheet-book-btn${isExpanded ? " active" : ""}`}
                            onClick={() => toggleBook(book.id)}
                          >
                            <span className="bible-sheet-book-name">
                              {book.commonName || book.name}
                            </span>
                            <span className="bible-sheet-book-count">
                              {book.numberOfChapters} {book.numberOfChapters === 1 ? "ch" : "chs"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="bible-sheet-chapters-grid">
                              {Array.from({ length: book.numberOfChapters }, (_, i) => i + 1).map((ch) => {
                                const isCurrent =
                                  currentBookId === book.id && Number(currentChapter) === ch;
                                return (
                                  <button
                                    key={ch}
                                    type="button"
                                    className={`bible-sheet-chapter-btn${isCurrent ? " current" : ""}`}
                                    onClick={() => handleChapterClick(book.id, ch)}
                                  >
                                    {ch}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
