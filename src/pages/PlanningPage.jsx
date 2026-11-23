import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import { usePlan } from "../context/PlanContext";
import { BOOK_NAMES, BOOK_SHORT_NAMES, OT_IDS } from "../lib/bibleBooks";
import { CSV_PLANS_BY_FILENAME } from "../lib/bibleCsvBundle";
import { getPreferredTranslation } from "../lib/bible";
import {
  CANON_ORDER,
  COMPOSITION_ORDER,
  CONNECTIONS,
  ORDER_MODES,
  buildArcs,
  chronologicalOrderFromCsv,
  connectionsForBook,
  defaultOrderForPlan,
  formatRef,
  horizontalArcPath,
  otherEnd,
  thisEnd,
  verticalArcPath
} from "../lib/bibleTimeline";

// Canvas geometry (SVG user units).
const V = { top: 26, row: 22, axisX: 122, maxBulge: 210, width: 360 };
const H = { left: 26, col: 26, axisY: 250, maxBulge: 215, labelSpace: 112 };

export default function PlanningPage() {
  const { t } = useI18n();
  const { plan } = usePlan();

  const autoOrder = defaultOrderForPlan(plan);
  const [manualOrder, setManualOrder] = useState(null);
  const orderMode = manualOrder || autoOrder;
  const [orientation, setOrientation] = useState("vertical");
  const [selectedBook, setSelectedBook] = useState(null);
  const [hoverBook, setHoverBook] = useState(null);
  const [selectedArcId, setSelectedArcId] = useState(null);

  const chronological = useMemo(
    () => chronologicalOrderFromCsv(CSV_PLANS_BY_FILENAME["order-chronological.csv"]),
    []
  );
  const order = orderMode === "chronological" ? chronological : orderMode === "composition" ? COMPOSITION_ORDER : CANON_ORDER;
  const arcs = useMemo(() => buildArcs(order), [order]);
  const positions = useMemo(() => new Map(order.map((id, index) => [id, index])), [order]);

  const focusBook = hoverBook || selectedBook;
  const selectedArc = selectedArcId ? CONNECTIONS.find((c) => c.id === selectedArcId) : null;

  const isVertical = orientation === "vertical";
  const width = isVertical ? V.width : H.left * 2 + (order.length - 1) * H.col;
  const height = isVertical ? V.top * 2 + (order.length - 1) * V.row : H.axisY + H.labelSpace;

  function arcState(arc) {
    const c = arc.connection;
    if (selectedArc) return c.id === selectedArc.id ? "active" : "dim";
    if (!focusBook) return "idle";
    return c.from.book === focusBook || c.to.book === focusBook ? "active" : "dim";
  }

  function chooseBook(bookId) {
    setSelectedArcId(null);
    setSelectedBook((current) => (current === bookId ? null : bookId));
  }

  function chooseArc(arc) {
    setSelectedBook(null);
    setSelectedArcId((current) => (current === arc.id ? null : arc.id));
  }

  function nodePoint(index) {
    return isVertical
      ? { x: V.axisX, y: V.top + index * V.row }
      : { x: H.left + index * H.col, y: H.axisY };
  }

  const translationId = getPreferredTranslation();
  const detailBook = selectedBook;
  const detailConnections = detailBook ? connectionsForBook(detailBook) : [];

  function readLink(end) {
    return `/bible/${translationId}/${end.book}/${end.chapter}`;
  }

  return (
    <div className="page-shell conn-page">
      <div className="page-header page-header-sticky">
        <div className="page-header-title-row">
          <h1 className="page-title">{t("conn.title")}</h1>
          <p className="page-subtitle">{t("conn.subtitle")}</p>
        </div>
      </div>

      <div className="conn-controls">
        <span className="conn-controls-label">{t("conn.order")}</span>
        <div className="conn-segmented" role="group" aria-label={t("conn.order")}>
          {ORDER_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={orderMode === mode ? "active" : ""}
              aria-pressed={orderMode === mode}
              onClick={() => setManualOrder(mode === autoOrder ? null : mode)}
              title={mode === autoOrder ? t("conn.autoHint") : undefined}
            >
              {t(`conn.${mode}`)}
              {mode === autoOrder && <span className="conn-auto-tag">{t("conn.auto")}</span>}
            </button>
          ))}
        </div>
        <div className="conn-segmented conn-orientation" role="group" aria-label={t("conn.layout")}>
          {["vertical", "horizontal"].map((key) => (
            <button
              key={key}
              type="button"
              className={orientation === key ? "active" : ""}
              aria-pressed={orientation === key}
              onClick={() => setOrientation(key)}
            >
              {t(`conn.${key}`)}
            </button>
          ))}
        </div>
        <p className="hint-text conn-note">{t(`conn.note.${orderMode}`)}</p>
      </div>

      <div className="conn-layout">
        <div className={`conn-canvas ${isVertical ? "is-vertical" : "is-horizontal"}`}>
          <svg
            className="conn-svg"
            viewBox={`0 0 ${width} ${height}`}
            width={isVertical ? "100%" : width}
            height={isVertical ? undefined : height}
            role="group"
            aria-label={t("conn.title")}
            style={isVertical ? { maxWidth: width * 1.5 } : undefined}
          >
            <g className="conn-arcs">
              {arcs.map((arc) => {
                const d = isVertical
                  ? verticalArcPath(arc, { axisX: V.axisX, top: V.top, row: V.row, maxBulge: V.maxBulge })
                  : horizontalArcPath(arc, { left: H.left, col: H.col, axisY: H.axisY, maxBulge: H.maxBulge });
                const c = arc.connection;
                const label = `${formatRef(c.from)} – ${formatRef(c.to)}: ${c.theme}`;
                return (
                  <g key={arc.id} className={`conn-arc ${arcState(arc)}`}>
                    <path d={d} className="conn-arc-line" />
                    <path
                      d={d}
                      className="conn-arc-hit"
                      role="button"
                      tabIndex={0}
                      aria-label={label}
                      onClick={() => chooseArc(arc)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          chooseArc(arc);
                        }
                      }}
                    >
                      <title>{label}</title>
                    </path>
                  </g>
                );
              })}
            </g>

            <g className="conn-nodes">
              {order.map((bookId, index) => {
                const { x, y } = nodePoint(index);
                const isOt = OT_IDS.has(bookId);
                const connected = connectionsForBook(bookId).length > 0;
                const active = bookId === focusBook;
                const related =
                  focusBook && connectionsForBook(focusBook).some((c) => c.from.book === bookId || c.to.book === bookId);
                const dimmed = (focusBook && !active && !related) || (selectedArc && selectedArc.from.book !== bookId && selectedArc.to.book !== bookId);
                return (
                  <g
                    key={bookId}
                    className={`conn-node ${isOt ? "ot" : "nt"}${connected ? " has-links" : ""}${active ? " active" : ""}${dimmed ? " dim" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedBook === bookId}
                    aria-label={`${BOOK_NAMES[bookId]}, ${t("conn.connections", { n: connectionsForBook(bookId).length })}`}
                    onClick={() => chooseBook(bookId)}
                    onMouseEnter={() => setHoverBook(bookId)}
                    onMouseLeave={() => setHoverBook(null)}
                    onFocus={() => setHoverBook(bookId)}
                    onBlur={() => setHoverBook(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        chooseBook(bookId);
                      }
                    }}
                  >
                    {isVertical ? (
                      <>
                        <rect x={0} y={y - V.row / 2} width={V.axisX + 12} height={V.row} className="conn-node-hit" />
                        <text x={x - 12} y={y + 4} textAnchor="end" className="conn-label">
                          {BOOK_NAMES[bookId]}
                        </text>
                      </>
                    ) : (
                      <>
                        <rect x={x - H.col / 2} y={y - 6} width={H.col} height={H.labelSpace + 6} className="conn-node-hit" />
                        <text
                          x={x}
                          y={y + 16}
                          textAnchor="start"
                          className="conn-label"
                          transform={`rotate(55 ${x} ${y + 16})`}
                        >
                          {BOOK_SHORT_NAMES[bookId]}
                        </text>
                      </>
                    )}
                    <circle cx={x} cy={y} r={connected ? 5 : 3.5} className="conn-dot" />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="conn-panel card" aria-live="polite">
          <div className="conn-legend">
            <span className="conn-legend-item ot">{t("conn.ot")}</span>
            <span className="conn-legend-item nt">{t("conn.nt")}</span>
          </div>

          {selectedArc && (
            <div className="conn-detail">
              <h2>{selectedArc.theme}</h2>
              <p className="conn-detail-refs">
                {formatRef(selectedArc.from)} ↔ {formatRef(selectedArc.to)}
              </p>
              <div className="conn-read-row">
                <Link className="btn btn-ghost" to={readLink(selectedArc.from)}>
                  {t("conn.read")} {BOOK_NAMES[selectedArc.from.book]} {selectedArc.from.chapter}
                </Link>
                <Link className="btn btn-ghost" to={readLink(selectedArc.to)}>
                  {t("conn.read")} {BOOK_NAMES[selectedArc.to.book]} {selectedArc.to.chapter}
                </Link>
              </div>
            </div>
          )}

          {!selectedArc && detailBook && (
            <div className="conn-detail">
              <h2>{BOOK_NAMES[detailBook]}</h2>
              <p className="hint-text">
                {t("conn.connections", { n: detailConnections.length })}
                {positions.has(detailBook) && ` · #${positions.get(detailBook) + 1}/${order.length}`}
              </p>
              {detailConnections.length === 0 && <p className="hint-text">{t("conn.noConnections")}</p>}
              <ul className="conn-list">
                {detailConnections.map((connection) => {
                  const here = thisEnd(connection, detailBook);
                  const there = otherEnd(connection, detailBook);
                  return (
                    <li key={connection.id}>
                      <p className="conn-theme">{connection.theme}</p>
                      <p className="conn-list-refs">
                        {formatRef(here)} ↔{" "}
                        <button type="button" className="conn-link-button" onClick={() => chooseBook(there.book)}>
                          {formatRef(there)}
                        </button>
                      </p>
                      <div className="conn-read-row">
                        <Link className="btn btn-ghost" to={readLink(here)}>
                          {t("conn.read")} {here.chapter}
                        </Link>
                        <Link className="btn btn-ghost" to={readLink(there)}>
                          {t("conn.read")} {BOOK_SHORT_NAMES[there.book]} {there.chapter}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!selectedArc && !detailBook && <p className="hint-text">{t("conn.select")}</p>}

          <p className="hint-text conn-curated">{t("conn.curated")}</p>
        </aside>
      </div>
    </div>
  );
}
