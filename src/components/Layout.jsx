import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { CalendarViewProvider } from "../context/CalendarViewContext";
import { PlanProvider } from "../context/PlanContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function ThemeWelcomeModal() {
  const { user } = useAuth();
  const { mode, setMode, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user && localStorage.getItem("bible-plan-show-theme-picker") === "1") {
      localStorage.removeItem("bible-plan-show-theme-picker");
      setOpen(true);
    }
  }, [user]);

  if (!open) return null;
  const choose = (id) => { setMode(id); setOpen(false); };
  return (
    <div className="theme-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="theme-modal card" role="dialog" aria-modal="true" aria-labelledby="theme-welcome-title">
        <h2 id="theme-welcome-title">Choose your theme</h2>
        <p className="hint-text">Make Bible Plan feel like yours. You can change this any time in Settings.</p>
        {!showAll ? (
          <div className="theme-welcome-actions">
            <button className="theme-option theme-option-swatch" onClick={() => choose("dark")}>
              <span className="theme-swatch"><span style={{background:"#1e303c"}}/><span style={{background:"#b3862e"}}/></span>
              <span>Original</span>
            </button>
            <button className="theme-option theme-option-swatch" onClick={() => choose("light")}>
              <span className="theme-swatch"><span style={{background:"#f1e7d2"}}/><span style={{background:"#96690b"}}/></span>
              <span>Original (Light)</span>
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAll(true)}>More themes</button>
          </div>
        ) : (
          <>
            <div className="theme-modal-list">
              {themes.map((theme) => (
                <button key={theme.id} className={"theme-option theme-option-swatch" + (mode === theme.id ? " active" : "")} onClick={() => choose(theme.id)}>
                  <span className="theme-swatch" aria-hidden="true">{theme.swatches.map((color) => <span key={color} style={{background:color}} />)}</span>
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" style={{marginTop:12}} onClick={() => setShowAll(false)}>Back</button>
          </>
        )}
        <button className="theme-modal-close" onClick={() => setOpen(false)} aria-label="Close theme picker">Not now</button>
      </section>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const isCalendarRoute = location.pathname === "/plan";
  const isBibleRoute = location.pathname.startsWith("/bible");

  return (
    <CalendarViewProvider>
      <PlanProvider>
        <div className="app-shell">
          <Sidebar />
          <main className={`main-content${isCalendarRoute ? " main-content-flush" : ""}${isBibleRoute ? " main-content-bible" : ""}`}>
            <Outlet />
          </main>
        </div>
        <ThemeWelcomeModal />
      </PlanProvider>
    </CalendarViewProvider>
  );
}
