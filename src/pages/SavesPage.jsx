import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deviceStorage } from "../lib/deviceStorage";

export default function SavesPage() {
  const [verses, setVerses] = useState(() => deviceStorage.listSavedVerses());

  useEffect(() => {
    function onSavedVersesChanged(e) {
      setVerses(e.detail || deviceStorage.listSavedVerses());
    }
    window.addEventListener("bible-saved-verses-changed", onSavedVersesChanged);
    return () => window.removeEventListener("bible-saved-verses-changed", onSavedVersesChanged);
  }, []);

  function remove(id) {
    const next = deviceStorage.unsaveVerse(id);
    setVerses(next);
  }

  return (
    <div className="page-shell">
      <div className="page-header page-header-sticky">
        <div className="page-header-title-row">
          <h1 className="page-title">Saved Verses</h1>
          <p className="page-subtitle">In the order you saved them</p>
        </div>
        <div className="page-header-actions">
        </div>
      </div>

      {verses.length === 0 ? (
        <div className="empty-state">
          <p>No saved verses yet.</p>
          <p className="hint-text">
            Open the <Link to="/bible">Bible</Link> and tap any verse to save it here.
          </p>
        </div>
      ) : (
        verses.map((verse) => (
          <div className="saved-verse-card" key={verse.id}>
            <div className="saved-verse-ref">
              <Link to={`/bible/${verse.translation}/${verse.book}/${verse.chapter}`}>
                {verse.book_name || verse.book} {verse.chapter}:{verse.verse} · {verse.translation}
              </Link>
              <button className="btn-ghost btn" onClick={() => remove(verse.id)} type="button">
                Remove
              </button>
            </div>
            <p className="saved-verse-text">{verse.verse_text}</p>
          </div>
        ))
      )}
    </div>
  );
}
