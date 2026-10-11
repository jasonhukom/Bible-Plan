import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  DEFAULT_TRANSLATION_ID,
  getPreferredTranslation,
  setPreferredTranslation,
  listTranslations,
  listBooks,
  getChapter
} from "../lib/bible";
import { groupBooks, GROUP_LABELS } from "../lib/bibleBooks";
import { useAuth } from "../context/AuthContext";
import { dataApi } from "../lib/dataApi";

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

  const dropdownRef = useRef(null);

  // Close version dropdown when clicking outside
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

  // Auto-collapse the sidebar once a chapter is open, so reading is the focus.
  useEffect(() => {
    setSidebarOpen(!routeBook || !routeChapter);
  }, [routeBook, routeChapter]);

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
  }

  function changeChapter(delta) {
    if (!currentBook) return;
    const next = Number(routeChapter) + delta;
    if (next < 1 || next > currentBook.numberOfChapters) return;
    navigate(`/bible/${translationId}/${routeBook}/${next}`);
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
    } else {
      await dataApi.saveVerse({
        translation: translationId,
        book: routeBook,
        book_name: currentBook?.commonName || currentBook?.name || routeBook,
        chapter: Number(routeChapter),
        verse: verseNumber,
        verse_text: verseText
      });
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

  return (
    <div>
      <div className="page-header page-header-sticky" style={{ alignItems: "center" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>Bible</h1>
            {currentBook && (
              <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>
                  {currentBook.commonName || currentBook.name} {routeChapter}
                </span>
                <span style={{ opacity: 0.4 }}>•</span>
                <button
                  type="button"
                  onClick={() => setVersionsSidebarOpen((v) => !v)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                    opacity: 0.95
                  }}
                  title="Click to change Bible version"
                >
                  {translations.find(t => t.id === translationId)?.shortName ||
                   translations.find(t => t.id === translationId)?.label?.split(' ')[0] ||
                   translationId}
                </button>
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              className="btn btn-ghost version-picker-btn"
              type="button"
              onClick={() => setVersionsSidebarOpen(!versionsSidebarOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: 240,
                cursor: 'pointer',
                fontWeight: 500,
                border: '1px solid var(--night-line)',
                background: 'var(--night-2)',
                borderRadius: '8px',
                padding: '7px 12px',
                color: '#ffffff'
              }}
              title="Click to change Bible version"
            >
              <span style={{ maxWidth: 190, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>
                {translations.find(t => t.id === translationId)?.label || translationId}
              </span>
              <span style={{ fontSize: 9, opacity: 0.8, color: '#ffffff', transform: versionsSidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
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
                      className={`version-list-btn${translationId === t.id ? ' active' : ''}`}
                      onClick={() => { goToTranslation(t.id); setVersionsSidebarOpen(false); }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <div style={{ fontWeight: 500 }}>{t.label}</div>
                      {t.provider && (
                        <span style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase' }}>
                          {t.provider === 'apibible' ? 'API.Bible' : t.provider === 'helloao' ? 'HelloAO' : 'YouVersion'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-ghost bible-sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen ? "Hide books" : "Books"}
          </button>
        </div>
      </div>

      {saveNotice && (
        <p className="hint-text" style={{ marginBottom: 14 }}>
          {saveNotice} <Link to="/login">Sign in</Link>
        </p>
      )}

      <div className={`bible-layout${!routeBook ? " home-mode" : ""}`}>
        <aside className={`bible-sidebar${sidebarOpen ? "" : " collapsed"}`} style={{ width: sidebarOpen ? sidebarWidth : 0, padding: sidebarOpen ? undefined : 0, border: sidebarOpen ? undefined : 'none' }}>
          {booksLoading && <p className="hint-text">Loading books…</p>}

          {(["ot", "dc", "nt"]).map((groupKey) =>
            grouped[groupKey].length ? (
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
                            className={`chapter-grid-btn${routeBook === book.id && Number(routeChapter) === ch ? " active" : ""
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

        <section className="reader" style={{ flex: 1, minWidth: 0 }}>
          {!routeBook && <p className="reader-empty">Pick a book from the list to start reading.</p>}

          {routeBook && chapterLoading && <p className="reader-loading">Loading chapter…</p>}
          {routeBook && chapterError && <p className="error-text">{chapterError}</p>}

          {chapterData && !chapterLoading && (
            <>
              <div className="reader-heading">
                <h1>
                  {chapterData.book.commonName || chapterData.book.name} {chapterData.chapter.number}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div className="reader-nav">
                    <button className="btn btn-ghost" onClick={() => changeChapter(-1)} type="button">
                      ‹ Prev
                    </button>
                    <button className="btn btn-ghost" onClick={() => changeChapter(1)} type="button">
                      Next ›
                    </button>
                  </div>
                </div>
              </div>

              <div className="reader-text">
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
              {chapterData.attribution && (
                <p className="bible-attribution" style={{ marginTop: "32px", fontSize: "12px", color: "var(--ink-soft)", fontStyle: "italic", textAlign: "center" }} dangerouslySetInnerHTML={{ __html: chapterData.attribution }}>
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
