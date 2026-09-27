import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  DEFAULT_TRANSLATION_ID,
  listFeaturedTranslations,
  listBooks,
  getChapter
} from "../lib/helloao";
import { groupBooks, GROUP_LABELS } from "../lib/bibleBooks";
import { useAuth } from "../context/AuthContext";
import { dataApi } from "../lib/dataApi";

export default function BiblePage() {
  const { translationId: routeTranslation, bookId: routeBook, chapter: routeChapter } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const translationId = routeTranslation || DEFAULT_TRANSLATION_ID;

  const [translations, setTranslations] = useState([]);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [chapterData, setChapterData] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(!routeBook);
  const [expandedBook, setExpandedBook] = useState(routeBook || null);
  const [savedVerses, setSavedVerses] = useState([]);
  const [saveNotice, setSaveNotice] = useState("");

  const grouped = useMemo(() => groupBooks(books), [books]);
  const currentBook = useMemo(() => books.find((b) => b.id === routeBook), [books, routeBook]);

  // Featured translation list for the picker.
  useEffect(() => {
    listFeaturedTranslations().then(setTranslations).catch(() => setTranslations([]));
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
    if (routeBook && routeChapter) {
      navigate(`/bible/${nextTranslation}/${routeBook}/${routeChapter}`);
    } else {
      navigate("/bible");
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bible</h1>
          {currentBook && (
            <p className="page-subtitle">
              {currentBook.commonName || currentBook.name} {routeChapter}
            </p>
          )}
        </div>
        <button className="btn btn-ghost bible-sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)}>
          {sidebarOpen ? "Hide books" : "Books"}
        </button>
      </div>

      {saveNotice && (
        <p className="hint-text" style={{ marginBottom: 14 }}>
          {saveNotice} <Link to="/login">Sign in</Link>
        </p>
      )}

      <div className="bible-layout">
        <aside className={`bible-sidebar${sidebarOpen ? "" : " collapsed"}`}>
          <select
            className="field-select translation-select"
            value={translationId}
            onChange={(e) => goToTranslation(e.target.value)}
          >
            {!translations.some((t) => t.id === translationId) && (
              <option value={translationId}>{translationId}</option>
            )}
            {translations.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

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

        <section className="reader">
          {!routeBook && <p className="reader-empty">Pick a book from the list to start reading.</p>}

          {routeBook && chapterLoading && <p className="reader-loading">Loading chapter…</p>}
          {routeBook && chapterError && <p className="error-text">{chapterError}</p>}

          {chapterData && !chapterLoading && (
            <>
              <button className="back-link" onClick={() => setSidebarOpen(true)} type="button">
                ← Books
              </button>
              <div className="reader-heading">
                <h1>
                  {chapterData.book.commonName || chapterData.book.name} {chapterData.chapter.number}
                </h1>
                <div className="reader-nav">
                  <button className="btn btn-ghost" onClick={() => changeChapter(-1)} type="button">
                    ‹ Prev
                  </button>
                  <button className="btn btn-ghost" onClick={() => changeChapter(1)} type="button">
                    Next ›
                  </button>
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}
