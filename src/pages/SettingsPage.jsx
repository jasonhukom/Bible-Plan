import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { dataApi } from "../lib/dataApi";
import { DEFAULT_TRANSLATION_ID, listFeaturedTranslations } from "../lib/helloao";

export default function SettingsPage() {
  const { user, signOut, isConfigured } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();

  const [translations, setTranslations] = useState([]);
  const [defaultTranslation, setDefaultTranslation] = useState(DEFAULT_TRANSLATION_ID);
  const [numberPosition, setNumberPosition] = useState("right");
  const [preferences, setPreferences] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    listFeaturedTranslations().then(setTranslations).catch(() => setTranslations([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    dataApi.getSettings().then(({ data }) => {
      if (data?.translation) setDefaultTranslation(data.translation);
      if (data?.preferences) {
        setPreferences(data.preferences);
        if (data.preferences.dateNumberPosition) setNumberPosition(data.preferences.dateNumberPosition);
      }
    });
  }, [user]);

  async function handleNumberPositionChange(position) {
    setNumberPosition(position);
    const nextPreferences = { ...preferences, dateNumberPosition: position };
    setPreferences(nextPreferences);
    if (user) await dataApi.saveSettings({ preferences: nextPreferences });
  }

  async function handleTranslationChange(id) {
    setDefaultTranslation(id);
    if (user) {
      await dataApi.saveSettings({ translation: id });
      setMessage("Saved.");
      setTimeout(() => setMessage(""), 2000);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, marginBottom: 14 }}>Appearance</h2>
        <div className="theme-options">
          {[
            ["dark", "Dark"],
            ["light", "Light"],
            ["device", "Device"]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`theme-option${mode === key ? " active" : ""}`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, marginBottom: 14 }}>Calendar</h2>
        <p className="hint-text" style={{ marginBottom: 10 }}>Where each day's date number sits in its cell</p>
        <div className="theme-options">
          {[
            ["left", "Top left"],
            ["center", "Top center"],
            ["right", "Top right"]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`theme-option${numberPosition === key ? " active" : ""}`}
              onClick={() => handleNumberPositionChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, marginBottom: 14 }}>Default translation</h2>
        <select
          value={defaultTranslation}
          onChange={(e) => handleTranslationChange(e.target.value)}
          style={{ width: "100%", background: "var(--night)", border: "1px solid var(--night-line)", borderRadius: 8, padding: 10 }}
        >
          {!translations.some((t) => t.id === defaultTranslation) && (
            <option value={defaultTranslation}>{defaultTranslation}</option>
          )}
          {translations.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="hint-text" style={{ marginTop: 10 }}>
          NIV isn't available here — it's a commercially licensed translation, and this app
          reads from a free, no-license-restriction Bible API. BSB (Berean Standard Bible) is
          the closest widely-used free alternative, so it's the default.
        </p>
        {message && <p className="hint-text">{message}</p>}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 15, marginBottom: 10 }}>Account</h2>
        {user ? (
          <>
            <p className="hint-text" style={{ marginBottom: 14 }}>
              Signed in as {user.email}
            </p>
            <button className="btn btn-danger" onClick={handleSignOut} type="button">
              Sign out
            </button>
          </>
        ) : (
          <p className="hint-text">
            {isConfigured ? "You're not signed in." : "Supabase isn't configured for this deployment."}
          </p>
        )}
      </div>
    </div>
  );
}
