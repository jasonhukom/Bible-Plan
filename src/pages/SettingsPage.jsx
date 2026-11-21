import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { deviceStorage } from "../lib/deviceStorage";
import { listTranslations, getPreferredTranslation, setPreferredTranslation } from "../lib/bible";

export default function SettingsPage() {
  const { mode, setMode, themes } = useTheme();

  const [translations, setTranslations] = useState([]);
  const [defaultTranslation, setDefaultTranslation] = useState(() => getPreferredTranslation());
  const [preferences, setPreferences] = useState(() => deviceStorage.getSettings().preferences || {});
  const [numberPosition, setNumberPosition] = useState(
    () => deviceStorage.getSettings().preferences?.dateNumberPosition || "right"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    listTranslations().then(setTranslations).catch(() => setTranslations([]));
  }, []);

  function handleNumberPositionChange(position) {
    setNumberPosition(position);
    const nextPreferences = { ...preferences, dateNumberPosition: position };
    setPreferences(nextPreferences);
    deviceStorage.saveSettings({ preferences: nextPreferences });
  }

  function handleTranslationChange(id) {
    setDefaultTranslation(id);
    setPreferredTranslation(id);
    deviceStorage.saveSettings({ translation: id });
    setMessage("Saved.");
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="page-shell">
      <div className="page-header page-header-sticky">
        <div className="page-header-title-row">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Appearance and preferences</p>
        </div>
        <div className="page-header-actions">
        </div>
      </div>

      <div className="page-container-narrow" style={{ paddingBottom: 40 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Appearance</h2>
          <div className="theme-options theme-options-grid">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`theme-option theme-option-swatch${mode === theme.id ? " active" : ""}`}
                onClick={() => setMode(theme.id)}
                aria-pressed={mode === theme.id}
              >
                <span className="theme-swatch" aria-hidden="true">
                  {theme.swatches.map((color) => <span key={color} style={{ background: color }} />)}
                </span>
                <span>{theme.label}</span>
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

        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Default translation</h2>
          <select
            value={defaultTranslation}
            onChange={(e) => handleTranslationChange(e.target.value)}
            style={{ width: "100%", background: "var(--night)", border: "1px solid var(--night-line)", borderRadius: 8, padding: 10 }}
          >
            {!translations.some((t) => t.id === defaultTranslation) && (
              <option value={defaultTranslation}>{translations.find(t => t.id === defaultTranslation)?.label || defaultTranslation}</option>
            )}
            {translations.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="hint-text" style={{ marginTop: 10 }}>
            To view copyright and licensing information for the translations used in this app,
            please see the <Link to="/licenses" style={{ textDecoration: "underline" }}>Licenses page</Link>.
          </p>
          {message && <p className="hint-text">{message}</p>}
        </div>
      </div>
    </div>
  );
}
