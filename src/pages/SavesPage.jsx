import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dataApi } from "../lib/dataApi";

export default function SavesPage() {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataApi.listSavedVerses().then(({ data }) => {
      setVerses(data || []);
      setLoading(false);
    });
  }, []);

  async function remove(id) {
    setVerses((v) => v.filter((verse) => verse.id !== id));
    await dataApi.unsaveVerse(id);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Saved Verses</h1>
          <p className="page-subtitle">In the order you saved them</p>
        </div>
      </div>

      {loading ? (
        <p className="reader-loading">Loading…</p>
      ) : verses.length === 0 ? (
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
