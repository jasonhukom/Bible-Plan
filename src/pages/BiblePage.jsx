import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  DEFAULT_TRANSLATION_ID,
  getPreferredTranslation,
  setPreferredTranslation,
  listTranslations,
  listBooks,
  getChapter,
  getTranslationShortName
} from "../lib/bible";
import { groupBooks, GROUP_LABELS } from "../lib/bibleBooks";
import { useAuth } from "../context/AuthContext";
import { dataApi } from "../lib/dataApi";

import BibleMobileTopBar from "../components/BibleMobileTopBar";
import BibleFloatingNav from "../components/BibleFloatingNav";
import BibleBooksSheet from "../components/BibleBooksSheet";
import BibleTranslationsSheet from "../components/BibleTranslationsSheet";
import BibleFontSheet from "../components/BibleFontSheet";

export default function BiblePage() {
  const { translationId: routeTranslation, bookId: routeBook, chapter: routeChapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [preferredTrans, setPreferredTrans] = useState(() => getPreferredTranslation());
  const translationId = routeTranslation || preferredTrans || DEFAULT_TRANSLATION_ID;

  const [translations, setTranslations] = useState([]);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [chapterData, setChapterData] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(!routeBook);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [versionsSidebarOpen, setVersionsSidebarOpen] = useState(false);
  const [expandedBook, setExpandedBook] = useState(routeBook || null);
  const [savedVerses, setSavedVerses] = useState([]);
  const [saveNotice, setSaveNotice] = useState("");

  // Mobile Bottom Sheets & State
  const [isBooksSheetOpen, setIsBooksSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState("books");
  const [isTranslationsSheetOpen, setIsTranslationsSheetOpen] = useState(false);
  const [isFontSheetOpen, setIsFontSheetOpen] = useState(false);

  // Reader Appearance Settings (persisted)
  const [readerSettings, setReaderSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("bible-reader-settings");
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      fontSize: 22,
      lineHeight: 2.15,
      fontFamily: "serif",
      readerTheme: "dark"
    };
  });

  // Reading History (persisted)
  const [readingHistory, setReadingHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bible-reading-history") || "[]");
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Close version dropdown when clicking outside (desktop)
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setVersionsSidebarOpen(false);
      }
    }
    if (versionsSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [versionsSidebarOpen]);

  // Synchronize when settings change the version
  useEffect(() => {
    function onTranslationChanged(e) {
      const nextId = e.detail;
      if (!nextId) return;
      setPreferredTrans(nextId);
      if (routeBook && routeChapter) {
        navigate(`/bible/${nextId}/${routeBook}/${routeChapter}`);
      } else {
        navigate(`/bible/${nextId}`);
      }
    }
    window.addEventListener("bible-translation-changed", onTranslationChanged);
    return () => window.removeEventListener("bible-translation-changed", onTranslationChanged);
  }, [routeBook, routeChapter, navigate]);

  const grouped = useMemo(() => groupBooks(books), [books]);
  const currentBook = useMemo(() => books.find((b) => b.id === routeBook), [books, routeBook]);
  const currentTranslationObj = useMemo(
    () => translations.find((t) => t.id === translationId),
    [translations, translationId]
  );
  const translationShortName = useMemo(
    () => getTranslationShortName(currentTranslationObj, translationId),
    [currentTranslationObj, translationId]
  );
  const translationFullName = currentTranslationObj?.label || translationId;

  // Featured translation list for the picker.
  useEffect(() => {
    listTranslations().then(setTranslations).catch(() => setTranslations([]));
  }, []);

  // Book list for the current translation.
  useEffect(() => {
    setBooksLoading(true);
    listBooks(translationId)
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setBooksLoading(false));
  }, [translationId]);

  // Chapter content.
  useEffect(() => {
    if (!routeBook || !routeChapter) {
      setChapterData(null);
      return;
    }
    setChapterLoading(true);
    setChapterError("");
    getChapter(translationId, routeBook, Number(routeChapter))
      .then(setChapterData)
      .catch(() => setChapterError("Couldn't load that chapter. Try another one."))
      .finally(() => setChapterLoading(false));
  }, [translationId, routeBook, routeChapter]);

  // Record reading history whenever chapter loads successfully
  useEffect(() => {
    if (!routeBook || !routeChapter || !chapterData) return;
    try {
      const stored = JSON.parse(localStorage.getItem("bible-reading-history") || "[]");
      const bookName = currentBook?.commonName || currentBook?.name || chapterData.book?.name || routeBook;
      const newEntry = {
        bookId: routeBook,
        bookName,
        chapter: Number(routeChapter),
        translationId,
        timestamp: Date.now()
      };
      const filtered = stored.filter(
        (item) =>
          !(item.bookId === routeBook && item.chapter === Number(routeChapter) && item.translationId === translationId)
      );
      const updated = [newEntry, ...filtered].slice(0, 30);
      localStorage.setItem("bible-reading-history", JSON.stringify(updated));
      setReadingHistory(updated);
    } catch {}
  }, [routeBook, routeChapter, translationId, chapterData, currentBook]);

  // Auto-collapse the desktop sidebar once a chapter is open
  useEffect(() => {
    setSidebarOpen(!routeBook || !routeChapter);
  }, [routeBook, routeChapter]);

  // Auto-clear save notice toast
  useEffect(() => {
    if (saveNotice) {
      const timer = setTimeout(() => setSaveNotice(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [saveNotice]);

  // Saved verses (for highlighting already-saved verses in the reader).
  const refreshSaved = useCallback(() => {
    if (!user) {
      setSavedVerses([]);
      return;
    }
    dataApi.listSavedVerses().then(({ data }) => setSavedVerses(data || []));
  }, [user]);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  function goToTranslation(nextTranslation) {
    setPreferredTranslation(nextTranslation);
    setPreferredTrans(nextTranslation);
    if (user) {
      dataApi.saveSettings({ translation: nextTranslation }).catch(() => {});
    }
    if (routeBook && routeChapter) {
      navigate(`/bible/${nextTranslation}/${routeBook}/${routeChapter}`);
    } else {
      navigate(`/bible/${nextTranslation}`);
    }
  }

  function openBook(bookId) {
    setExpandedBook((current) => (current === bookId ? null : bookId));
  }

  function openChapter(bookId, chapterNumber) {
    navigate(`/bible/${translationId}/${bookId}/${chapterNumber}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeChapter(delta) {
    if (!currentBook) return;
    const next = Number(routeChapter) + delta;
    if (next < 1 || next > currentBook.numberOfChapters) return;
    navigate(`/bible/${translationId}/${routeBook}/${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelectHistory(item) {
    navigate(`/bible/${item.translationId || translationId}/${item.bookId}/${item.chapter}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleClearHistory() {
    try {
      localStorage.removeItem("bible-reading-history");
    } catch {}
    setReadingHistory([]);
  }

  function handleUpdateReaderSettings(next) {
    setReaderSettings(next);
    try {
      localStorage.setItem("bible-reader-settings", JSON.stringify(next));
    } catch {}
  }

  async function toggleVerse(verseNumber, verseText) {
    if (!user) {
      setSaveNotice("Sign in to save verses.");
      return;
    }
    const existing = savedVerses.find(
      (v) =>
        v.translation === translationId &&
        v.book === routeBook &&
        v.chapter === Number(routeChapter) &&
        v.verse === verseNumber
    );
    if (existing) {
      await dataApi.unsaveVerse(existing.id);
      setSaveNotice("Verse removed from saved.");
    } else {
      await dataApi.saveVerse({
        translation: translationId,
        book: routeBook,
        book_name: currentBook?.commonName || currentBook?.name || routeBook,
        chapter: Number(routeChapter),
        verse: verseNumber,
        verse_text: verseText
      });
      setSaveNotice("Verse saved!");
    }
    refreshSaved();
  }

  function isVerseSaved(verseNumber) {
    return savedVerses.some(
      (v) =>
        v.translation === translationId &&
        v.book === routeBook &&
        v.chapter === Number(routeChapter) &&
        v.verse === verseNumber
    );
  }

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = startWidth + delta;

      if (newWidth < 120) {
        setSidebarOpen(false);
        setSidebarWidth(250);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      } else if (newWidth > 600) {
        setSidebarWidth(600);
      } else {
        setSidebarWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth, setSidebarOpen]);

  // Book title display for mobile top bar
  const mobileBookTitle = currentBook
    ? `${currentBook.commonName || currentBook.name} ${routeChapter}`
    : "Select Book";

  return (
    <div className={`page-shell theme-${readerSettings.readerTheme || "dark"}`}>
      {/* --------------------------------------------------------------------------
          MOBILE TOP BAR (Phone View)
          Top bar: on the left, a rounded beige capsule split into two tappable chips,
          "<Bible Book> <chapter>" [BUTTON] and "<version (shortened)>" [BUTTON],
          next to it is a circular clock/history icon [BUTTON].
          On the far right, a bold "Aa" icon (font settings) [BUTTON].
          A thin divider line separates the bar from the text.
          -------------------------------------------------------------------------- */}
      <BibleMobileTopBar
        bookTitle={mobileBookTitle}
        translationShortName={translationShortName}
        onOpenBooks={() => {
          setSheetTab("books");
          setIsBooksSheetOpen(true);
        }}
        onOpenTranslations={() => setIsTranslationsSheetOpen(true)}
        onOpenHistory={() => {
          setSheetTab("history");
          setIsBooksSheetOpen(true);
        }}
        onOpenFontSettings={() => setIsFontSheetOpen(true)}
      />

      {/* --------------------------------------------------------------------------
          DESKTOP HEADER (Hidden on mobile via CSS)
          -------------------------------------------------------------------------- */}
      <div className="page-header page-header-sticky bible-page-header">
        <div className="page-header-title-row">
          <h1 className="page-title">Bible</h1>
          {currentBook ? (
            <p className="page-subtitle">
              <span>
                {currentBook.commonName || currentBook.name} {routeChapter}
              </span>
              <span className="page-subtitle-sep">•</span>
              <button
                type="button"
                className="page-subtitle-trans-btn"
                onClick={() => setVersionsSidebarOpen((v) => !v)}
                title="Click to change Bible version"
              >
                {translationShortName}
              </button>
            </p>
          ) : (
            <p className="page-subtitle">Select a book and chapter</p>
          )}
        </div>
        <div className="page-header-actions">
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className="btn btn-ghost version-picker-btn"
              type="button"
              onClick={() => setVersionsSidebarOpen(!versionsSidebarOpen)}
              title="Click to change Bible version"
            >
              <span className="version-btn-label-pc">{translationFullName}</span>
              <span className="version-btn-label-mobile">{translationShortName}</span>
              <span className={`version-btn-arrow${versionsSidebarOpen ? " open" : ""}`}>
                ▼
              </span>
            </button>
            {versionsSidebarOpen && (
              <div className="versions-sidebar-dropdown">
                <div className="versions-sidebar-header">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Select Translation</h3>
                </div>
                <div className="versions-sidebar-list">
                  {translations.map((t) => (
                    <button
                      key={t.id}
                      className={`version-list-btn${translationId === t.id ? " active" : ""}`}
                      onClick={() => {
                        goToTranslation(t.id);
                        setVersionsSidebarOpen(false);
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <div style={{ fontWeight: 500 }}>{t.label}</div>
                      {t.provider && (
                        <span style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase" }}>
                          {t.provider === "apibible"
                            ? "API.Bible"
                            : t.provider === "helloao"
                            ? "HelloAO"
                            : "YouVersion"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {Boolean(routeBook) && (
            <button className="btn btn-ghost bible-sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)}>
              {sidebarOpen ? "Hide books" : "Books"}
            </button>
          )}
        </div>
      </div>

      {/* Floating Save Notice Toast */}
      {saveNotice && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--night-2)",
            border: "1px solid var(--night-line)",
            padding: "8px 18px",
            borderRadius: 999,
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            zIndex: 60,
            fontSize: 13,
            color: "var(--cream)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "bibleFadeIn 0.2s ease"
          }}
        >
          <span>{saveNotice}</span>
          {!user && (
            <Link to="/login" style={{ color: "var(--gold-bright)", textDecoration: "underline", fontWeight: 600 }}>
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------------
          MAIN BIBLE LAYOUT
          -------------------------------------------------------------------------- */}
      <div className={`bible-layout${!routeBook ? " home-mode" : ""}`}>
        {/* Desktop Sidebar (hidden on phone) */}
        <aside
          className={`bible-sidebar${sidebarOpen ? "" : " collapsed"}`}
          style={{
            width: sidebarOpen ? sidebarWidth : 0,
            padding: sidebarOpen ? undefined : 0,
            border: sidebarOpen ? undefined : "none"
          }}
        >
          {booksLoading && <p className="hint-text">Loading books…</p>}

          {["ot", "nt"].map((groupKey) =>
            grouped[groupKey]?.length ? (
              <div className="book-group" key={groupKey}>
                <div className="book-group-label">{GROUP_LABELS[groupKey]}</div>
                {grouped[groupKey].map((book) => (
                  <div key={book.id}>
                    <button
                      className={`book-list-btn${expandedBook === book.id ? " active" : ""}`}
                      onClick={() => openBook(book.id)}
                      type="button"
                      style={expandedBook !== book.id && routeBook ? { color: "var(--ink-soft)" } : {}}
                    >
                      {book.commonName || book.name}
                    </button>
                    {expandedBook === book.id && (
                      <div className="chapter-grid">
                        {Array.from({ length: book.numberOfChapters }, (_, i) => i + 1).map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            className={`chapter-grid-btn${
                              routeBook === book.id && Number(routeChapter) === ch ? " active" : ""
                            }`}
                            onClick={() => openChapter(book.id, ch)}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null
          )}
        </aside>

        {sidebarOpen && !(!routeBook) && (
          <div
            className="sidebar-resize-handle"
            onMouseDown={startResize}
            title="Drag to resize sidebar"
          />
        )}

        {/* Reader section */}
        <section className="reader" style={{ flex: 1, minWidth: 0 }}>
          {!routeBook && (
            <div className="reader-empty" style={{ flexDirection: "column", gap: 14 }}>
              <p style={{ margin: 0 }}>Pick a book from the list to start reading.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSheetTab("books");
                  setIsBooksSheetOpen(true);
                }}
              >
                Browse Books
              </button>
            </div>
          )}

          {routeBook && chapterLoading && <p className="reader-loading">Loading chapter…</p>}
          {routeBook && chapterError && <p className="error-text">{chapterError}</p>}

          {chapterData && !chapterLoading && (
            <>
              {/* Desktop heading (hidden on mobile) */}
              <div className="reader-heading">
                <h1 style={{ textAlign: "left" }}>
                  {chapterData.book.name || chapterData.book.commonName} {chapterData.chapter.number}
                </h1>
              </div>

              {/* Desktop top nav (hidden on mobile) */}
              <div className="reader-nav-bar">
                <button
                  className="btn btn-ghost reader-nav-btn prev"
                  onClick={() => changeChapter(-1)}
                  type="button"
                  disabled={Number(routeChapter) <= 1}
                >
                  ‹ Prev Chapter
                </button>
                <button
                  className="btn btn-ghost reader-nav-btn next"
                  onClick={() => changeChapter(1)}
                  type="button"
                  disabled={currentBook && Number(routeChapter) >= currentBook.numberOfChapters}
                >
                  Next Chapter ›
                </button>
              </div>

              {/* --------------------------------------------------------------------------
                  SCRIPTURE TEXT:
                  A large, elegant serif font with very generous line spacing.
                  Verse numbers are tiny, and sit slightly raised before each verse.
                  -------------------------------------------------------------------------- */}
              <div
                className="reader-text"
                style={{
                  fontSize: `${readerSettings.fontSize || 22}px`,
                  lineHeight: readerSettings.lineHeight || 2.15,
                  fontFamily:
                    readerSettings.fontFamily === "sans"
                      ? 'var(--font-body, "Karla", sans-serif)'
                      : 'var(--font-display, "Spectral", Georgia, serif)',
                  ...(readerSettings.readerTheme === "paper"
                    ? { color: "#2b2013" }
                    : readerSettings.readerTheme === "oled"
                    ? { color: "#e8dec8" }
                    : {})
                }}
              >
                {chapterData.chapter.content.map((item, i) => {
                  if (item.type === "heading") {
                    return (
                      <span className="reader-heading-inline" key={i}>
                        {item.text}
                      </span>
                    );
                  }
                  if (item.type === "line_break") {
                    return <br key={i} />;
                  }
                  if (item.type === "verse" || item.type === "hebrew_subtitle") {
                    const saved = item.number != null && isVerseSaved(item.number);
                    return (
                      <span
                        key={i}
                        className={`verse${saved ? " saved" : ""}`}
                        onClick={() => item.number != null && toggleVerse(item.number, item.text)}
                        title={user ? "Tap to save this verse" : "Sign in to save verses"}
                      >
                        {item.number != null && <sup className="verse-num">{item.number}</sup>}
                        {item.text}{" "}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Desktop bottom nav (hidden on mobile) */}
              <div className="reader-nav-bar reader-nav-bar-bottom">
                <button
                  className="btn btn-ghost reader-nav-btn prev"
                  onClick={() => changeChapter(-1)}
                  type="button"
                  disabled={Number(routeChapter) <= 1}
                >
                  ‹ Prev Chapter
                </button>
                <button
                  className="btn btn-ghost reader-nav-btn next"
                  onClick={() => changeChapter(1)}
                  type="button"
                  disabled={currentBook && Number(routeChapter) >= currentBook.numberOfChapters}
                >
                  Next Chapter ›
                </button>
              </div>

              {chapterData.attribution && (
                <p
                  className="bible-attribution"
                  style={{
                    marginTop: "32px",
                    fontSize: "12px",
                    color: "var(--ink-soft)",
                    fontStyle: "italic",
                    textAlign: "left"
                  }}
                  dangerouslySetInnerHTML={{ __html: chapterData.attribution }}
                />
              )}
            </>
          )}
        </section>
      </div>

      {/* --------------------------------------------------------------------------
          FLOATING BUTTONS:
          Two small white circles with thin arrows ("<" and ">") hover near
          the lower left and right edges for previous and next chapter.
          They overlap the text slightly.
          -------------------------------------------------------------------------- */}
      {Boolean(routeBook && routeChapter && chapterData) && (
        <BibleFloatingNav
          onPrev={() => changeChapter(-1)}
          onNext={() => changeChapter(1)}
          hasPrev={Number(routeChapter) > 1}
          hasNext={Boolean(currentBook && Number(routeChapter) < currentBook.numberOfChapters)}
          prevLabel="Previous chapter"
          nextLabel="Next chapter"
        />
      )}

      {/* --------------------------------------------------------------------------
          BOTTOM SHEET: Bible Book Chapter
          Overlay: the reading screen is dimmed behind a sheet with rounded top corners
          and a small drag handle.
          Header: a white circular "X" button on the left, a bold centered "Books" title,
          and a circular clock icon on the right.
          Search: a pill-shaped field with a magnifier icon and placeholder "Search books".
          -------------------------------------------------------------------------- */}
      <BibleBooksSheet
        isOpen={isBooksSheetOpen}
        onClose={() => setIsBooksSheetOpen(false)}
        books={books}
        grouped={grouped}
        currentBookId={routeBook}
        currentChapter={routeChapter}
        onSelectChapter={openChapter}
        initialTab={sheetTab}
        history={readingHistory}
        onSelectHistory={handleSelectHistory}
        onClearHistory={handleClearHistory}
      />

      {/* BOTTOM SHEET: Translations Selector */}
      <BibleTranslationsSheet
        isOpen={isTranslationsSheetOpen}
        onClose={() => setIsTranslationsSheetOpen(false)}
        translations={translations}
        currentTranslationId={translationId}
        onSelectTranslation={goToTranslation}
      />

      {/* BOTTOM SHEET: Font and Reader Settings */}
      <BibleFontSheet
        isOpen={isFontSheetOpen}
        onClose={() => setIsFontSheetOpen(false)}
        settings={readerSettings}
        onUpdateSettings={handleUpdateReaderSettings}
      />
    </div>
  );
}
