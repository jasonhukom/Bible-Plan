import { useMemo, useState } from "react";
import { useI18n } from "../context/I18nContext";

export default function LanguageSettings() {
  const { language, setLanguage, languages, t } = useI18n();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (item) =>
        item.englishName.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.code.toLowerCase() === q
    );
  }, [languages, query]);

  async function choose(code) {
    if (busy || code === language) return;
    setBusy(true);
    setStatus("");
    const result = await setLanguage(code);
    setBusy(false);
    if (result.status === "switched") setStatus(t("lang.bibleSwitched", { name: result.name }));
    else if (result.status === "kept") setStatus(t("lang.bibleKept"));
    else setStatus(t("lang.bibleNone"));
  }

  return (
    <div className="card language-settings" style={{ marginBottom: 20 }}>
      <div className="language-settings-head">
        <h2 style={{ fontSize: 15 }}>{t("settings.language")}</h2>
        <span className="hint-text">{t("lang.count", { n: languages.length })}</span>
      </div>
      <p className="hint-text" style={{ margin: "8px 0 12px" }}>{t("lang.hint")}</p>

      <input
        className="language-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("common.search")}
        aria-label={t("common.search")}
        autoComplete="off"
      />

      <div className="language-list" role="group" aria-label={t("settings.language")}>
        {filtered.map((item) => (
          <button
            key={item.code}
            type="button"
            className={`language-option${item.code === language ? " active" : ""}`}
            onClick={() => choose(item.code)}
            aria-pressed={item.code === language}
            disabled={busy}
            lang={item.code}
            dir={item.dir}
          >
            <span className="language-native">{item.nativeName}</span>
            <span className="language-english">{item.englishName}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="hint-text language-empty">{t("lang.none")}</p>}
      </div>

      <p className="hint-text language-status" role="status" aria-live="polite">
        {busy ? t("common.loading") : status}
      </p>
    </div>
  );
}
