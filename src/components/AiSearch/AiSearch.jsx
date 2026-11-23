import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../context/I18nContext";
import { AiSearchError, MAX_QUESTION_LENGTH, askGemini } from "../../lib/aiSearch";

const sparkle = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" fill="currentColor" />
  </svg>
);

/** Renders **bold**, and turns "- " / "* " lines into list items, without raw HTML. */
function renderInline(text, keyBase) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={`${keyBase}-${index}`}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

function AnswerText({ text }) {
  const blocks = [];
  let list = [];

  function flushList() {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {list.map((item, index) => (
            <li key={index}>{renderInline(item, `li-${blocks.length}-${index}`)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  }

  text.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      return;
    }
    flushList();
    if (!line) return;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push(
        <p key={`h-${blocks.length}`} className="ai-answer-heading">
          {renderInline(heading[1], `h-${blocks.length}`)}
        </p>
      );
      return;
    }
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line, `p-${blocks.length}`)}</p>);
  });
  flushList();

  return <div className="ai-answer">{blocks}</div>;
}

export default function AiSearch() {
  const { t, language, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const textareaRef = useRef(null);
  const triggerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    textareaRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function closeModal() {
    abortRef.current?.abort();
    setLoading(false);
    setOpen(false);
    triggerRef.current?.focus();
  }

  async function submit(text) {
    const value = (text ?? question).trim();
    if (!value || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setAnswer("");
    setErrorKey("");
    try {
      const englishName = languages.find((item) => item.code === language)?.englishName;
      const result = await askGemini({ question: value, language: englishName, signal: controller.signal });
      setAnswer(result);
    } catch (error) {
      if (error?.name === "AbortError") return;
      if (error instanceof AiSearchError && error.code === "not-configured") setErrorKey("ai.notConfigured");
      else if (error instanceof AiSearchError && error.code === "too-long") setErrorKey("ai.tooLong");
      else setErrorKey("ai.error");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  function pickExample(key) {
    const text = t(key);
    setQuestion(text);
    submit(text);
  }

  const modal = open && (
    <div className="ai-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
      <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-search-title">
        <div className="ai-modal-head">
          <h2 id="ai-search-title">
            {sparkle}
            {t("nav.aiSearch")}
          </h2>
          <button type="button" className="ai-close" onClick={closeModal} aria-label={t("common.close")}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form
          className="ai-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={t("ai.placeholder")}
            aria-label={t("ai.placeholder")}
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
          />
          <div className="ai-form-row">
            <span className="hint-text">{question.length}/{MAX_QUESTION_LENGTH}</span>
            <button className="btn" type="submit" disabled={loading || !question.trim()}>
              {loading ? t("common.loading") : t("ai.ask")}
            </button>
          </div>
        </form>

        <div className="ai-body" aria-live="polite">
          {!loading && !answer && !errorKey && (
            <div className="ai-examples">
              <p className="hint-text">{t("ai.examples")}</p>
              {["ai.example1", "ai.example2", "ai.example3"].map((key) => (
                <button key={key} type="button" className="ai-example" onClick={() => pickExample(key)}>
                  {t(key)}
                </button>
              ))}
            </div>
          )}
          {loading && <p className="hint-text">{t("common.loading")}</p>}
          {errorKey && <p className="error-text">{t(errorKey)}</p>}
          {answer && <AnswerText text={answer} />}
        </div>

        <p className="hint-text ai-disclaimer">{t("ai.hint")}</p>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="ai-search-button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        title={t("nav.aiSearch")}
      >
        {sparkle}
        <span className="ai-search-label">{t("nav.aiSearch")}</span>
      </button>
      {modal && createPortal(modal, document.body)}
    </>
  );
}
