import { useState } from "react";
import { BOOK_NAMES } from "../lib/bibleBooks";
import { usePlan } from "../context/PlanContext";
import { useAuth } from "../context/AuthContext";
import LoginModal from "./LoginModal";

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [readBooks, setReadBooks] = useState(new Set());
  const [removeBooks, setRemoveBooks] = useState(false);
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [days, setDays] = useState(360);
  const [groups, setGroups] = useState(["ot", "nt"]);
  const [orderMode, setOrderMode] = useState("overlap");

  const { regenerate, generating, error } = usePlan();
  const { user } = useAuth();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  function toggleBook(id) {
    setReadBooks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSkip() {
    setReadBooks(new Set());
    setRemoveBooks(false);
    setStep(2);
  }

  function toggleGroup(g) {
    setGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function handleApply(e) {
    e.preventDefault();
    const excludeBooks = removeBooks ? Array.from(readBooks) : [];
    const preCompletedBooks = removeBooks ? [] : Array.from(readBooks);
    const config = {
      name: "My reading plan",
      start_date: startDate,
      days: Number(days),
      book_groups: groups,
      order_mode: orderMode
    };
    
    if (user?.is_anonymous) {
      setPendingPlan({ config, excludeBooks, preCompletedBooks });
      setShowLoginModal(true);
    } else {
      regenerate(config, { excludeBooks, preCompletedBooks }).then(() => onClose());
    }
  }

  function handleLoginModalClose() {
    setShowLoginModal(false);
    if (pendingPlan) {
      regenerate(pendingPlan.config, { 
        excludeBooks: pendingPlan.excludeBooks, 
        preCompletedBooks: pendingPlan.preCompletedBooks 
      }).then(() => onClose());
    } else {
      onClose();
    }
  }

  function handleLoginModalSuccess() {
    setShowLoginModal(false);
    if (pendingPlan) {
      regenerate(pendingPlan.config, { 
        excludeBooks: pendingPlan.excludeBooks, 
        preCompletedBooks: pendingPlan.preCompletedBooks 
      }).then(() => onClose());
    } else {
      onClose();
    }
  }

  if (step === 1) {
    return (
      <div className="cal-overlay">
        <div className="cal-popup" style={{ maxWidth: 500, width: "90%" }}>
          <div className="cal-popup-header">
            <h2>Which books have you read?</h2>
          </div>
          <div className="popup-book-list" style={{ maxHeight: "40vh", overflowY: "auto", padding: "4px" }}>
            {Object.entries(BOOK_NAMES).map(([id, name]) => (
               <label key={id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid var(--night-line)", cursor: "pointer", alignItems: "center" }}>
                 <span>{name}</span>
                 <input type="checkbox" checked={readBooks.has(id)} onChange={() => toggleBook(id)} style={{ width: 18, height: 18 }} />
               </label>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn btn-ghost" type="button" onClick={handleSkip}>Skip</button>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--cream)", cursor: "pointer" }}>
                <input type="checkbox" checked={removeBooks} onChange={e => setRemoveBooks(e.target.checked)} />
                Remove books from plan
              </label>
            </div>
            <button className="btn" type="button" onClick={() => setStep(2)}>Confirm</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cal-overlay">
      <div className="cal-popup" style={{ maxWidth: 400, width: "90%" }}>
        <div className="cal-popup-header">
          <h2>Plan Settings</h2>
        </div>
        <form onSubmit={handleApply} style={{ padding: 4 }}>
          <label className="plan-field-label">Start Date</label>
          <input className="plan-field-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />

          <label className="plan-field-label">Length (days)</label>
          <input className="plan-field-input" type="number" min={1} max={730} value={days} onChange={e => setDays(e.target.value)} />
          
          <div className="plan-field-label">Books</div>
          <div className="plan-checkbox-row">
            <label><input type="checkbox" checked={groups.includes("ot")} onChange={() => toggleGroup("ot")} /> Old Testament</label>
            <label><input type="checkbox" checked={groups.includes("nt")} onChange={() => toggleGroup("nt")} /> New Testament</label>
            <label><input type="checkbox" checked={groups.includes("dc")} onChange={() => toggleGroup("dc")} /> Deuterocanonical</label>
          </div>

          <label className="plan-field-label">Order</label>
          <select className="plan-field-input" value={orderMode} onChange={e => setOrderMode(e.target.value)}>
            <option value="overlap">Overlap (a bit of each book each day)</option>
            <option value="inorder">In order (finish one, then the next)</option>
          </select>
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
             <button className="btn" type="submit" disabled={generating || groups.length === 0}>
               {generating ? "Generating…" : "Apply Plan"}
             </button>
          </div>
        </form>
      </div>
      {showLoginModal && (
        <LoginModal onClose={handleLoginModalClose} onSuccess={handleLoginModalSuccess} />
      )}
    </div>
  );
}
