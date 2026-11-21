// ============================================================================
// PlanOptionsFields.jsx
// ----------------------------------------------------------------------------
// Shared reading-plan configuration fields used by both the Sidebar plan panel
// (desktop + mobile) and OnboardingModal step 2.
// ============================================================================

export default function PlanOptionsFields({
  idPrefix,
  startDate,
  onStartDateChange,
  days,
  onDaysChange,
  groups,
  onToggleGroup,
  orderMode,
  onOrderModeChange,
  chronological,
  onChronologicalChange,
  dailyPsalms,
  onDailyPsalmsChange,
  dailyProverbs,
  onDailyProverbsChange
}) {
  return (
    <>
      <label className="plan-field-label" htmlFor={`${idPrefix}-start`}>
        Start date
      </label>
      <input
        id={`${idPrefix}-start`}
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="plan-field-input"
      />

      <label className="plan-field-label" htmlFor={`${idPrefix}-days`}>
        Length (days)
      </label>
      <input
        id={`${idPrefix}-days`}
        type="number"
        min={1}
        max={730}
        value={days}
        onChange={(e) => onDaysChange(e.target.value)}
        className="plan-field-input"
      />

      <div className="plan-field-label">Books</div>
      <div className="plan-checkbox-row">
        <label>
          <input type="checkbox" checked={groups.includes("ot")} onChange={() => onToggleGroup("ot")} />
          Old Testament
        </label>
        <label>
          <input type="checkbox" checked={groups.includes("nt")} onChange={() => onToggleGroup("nt")} />
          New Testament
        </label>
      </div>

      <label className="plan-field-label" htmlFor={`${idPrefix}-order`}>
        Order
      </label>
      <select
        id={`${idPrefix}-order`}
        className="plan-field-input"
        value={orderMode}
        onChange={(e) => onOrderModeChange(e.target.value)}
      >
        <option value="overlap">Overlap (OT &amp; NT together each day)</option>
        <option value="inorder">In order (finish one, then the next)</option>
      </select>

      <div className="plan-field-label">Plan options</div>
      <div className="plan-checkbox-row">
        <label>
          <input
            type="checkbox"
            checked={chronological}
            onChange={(e) => onChronologicalChange(e.target.checked)}
          />
          Chronological order
        </label>
        <label>
          <input
            type="checkbox"
            checked={dailyPsalms}
            onChange={(e) => onDailyPsalmsChange(e.target.checked)}
          />
          Daily Psalms
        </label>
        <label>
          <input
            type="checkbox"
            checked={dailyProverbs}
            onChange={(e) => onDailyProverbsChange(e.target.checked)}
          />
          Daily Proverbs
        </label>
      </div>
    </>
  );
}
