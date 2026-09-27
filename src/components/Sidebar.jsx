import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import MiniCalendar from "./MiniCalendar";
import { useAuth } from "../context/AuthContext";
import { dataApi } from "../lib/dataApi";
import { READINGS } from "../lib/readingPlanData";

const SIDEBAR_STORAGE_KEY = "bible-plan-sidebar-open";

const navIcons = {
  calendar: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke="currentColor" strokeWidth="1.7" />
      <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  bible: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 5.5C4 4.67 4.67 4 5.5 4H12V20H5.5C4.67 20 4 19.33 4 18.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M20 5.5C20 4.67 19.33 4 18.5 4H12V20H18.5C19.33 20 20 19.33 20 18.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 4.5C5 4.22 5.22 4 5.5 4H15.5L19 7.5V19.5C19 19.78 18.78 20 18.5 20H5.5C5.22 20 5 19.78 5 19.5V4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <rect x="7.5" y="4" width="7" height="5" stroke="currentColor" strokeWidth="1.7" />
      <rect x="7.5" y="13.5" width="9" height="6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  readingPlans: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="4" y="15.3" width="16" height="3.4" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4.8" y="10.6" width="14.4" height="3.4" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="5.6" y="5.9" width="12.8" height="3.4" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 19.5C20 19.78 19.78 20 19.5 20H4.5C4.22 20 4 19.78 4 19.5V16H20V19.5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
};

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "closed");
  const [plansExpanded, setPlansExpanded] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? "open" : "closed");
  }, [open]);

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    dataApi.getProfile().then(({ data }) => setAvatarUrl(data?.avatar_url || null));
  }, [user]);

  const planStart = READINGS[0]?.date;
  const planEnd = READINGS[READINGS.length - 1]?.date;

  return (
    <>
      {open && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <svg className="sidebar-logo" viewBox="0 0 32 32">
                <line x1="16" y1="6" x2="16" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <line x1="7" y1="13" x2="25" y2="13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="sidebar-title">Bible Plan</span>
            </div>
            <button className="sidebar-toggle" type="button" onClick={() => setOpen(false)} aria-label="Close sidebar">
              <svg viewBox="0 0 24 24" fill="none">
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="sidebar-scroll-area">
            <MiniCalendar />

            <nav className="sidebar-nav">
              <NavLink to="/plan" className={({ isActive }) => `sidebar-nav-btn${isActive ? " active" : ""}`}>
                {navIcons.calendar}
                <span className="sidebar-nav-label">Calendar</span>
              </NavLink>
              <NavLink to="/bible" className={({ isActive }) => `sidebar-nav-btn${isActive ? " active" : ""}`}>
                {navIcons.bible}
                <span className="sidebar-nav-label">Bible</span>
              </NavLink>
              <NavLink to="/saves" className={({ isActive }) => `sidebar-nav-btn${isActive ? " active" : ""}`}>
                {navIcons.save}
                <span className="sidebar-nav-label">Save</span>
              </NavLink>

              <button
                className="sidebar-nav-btn reading-plans-toggle"
                type="button"
                onClick={() => setPlansExpanded((v) => !v)}
                aria-expanded={plansExpanded}
              >
                {navIcons.readingPlans}
                <span className="sidebar-nav-label">Reading Plans</span>
                <span className={`reading-plans-chevron${plansExpanded ? " open" : ""}`}>{navIcons.chevron}</span>
              </button>
            </nav>

            {plansExpanded && (
              <div className="plan-panel">
                <div className="panel-box">
                  <div className="panel-box-title">Current plan</div>
                  <p className="hint-text">
                    {planStart} – {planEnd} · {READINGS.length} days
                  </p>
                  <p className="hint-text">Old &amp; New Testament, with daily Psalms &amp; Proverbs.</p>
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <button
              className="sidebar-nav-btn"
              type="button"
              onClick={() => navigate(user ? "/profile" : "/login")}
            >
              {avatarUrl ? (
                <img className="sidebar-avatar" src={avatarUrl} alt="" />
              ) : (
                navIcons.account
              )}
              <span className="sidebar-nav-label">{user ? "Profile" : "Account"}</span>
            </button>
            <NavLink to="/settings" className="sidebar-icon-btn" title="Settings">
              {navIcons.settings}
            </NavLink>
          </div>
        </aside>
      )}

      {!open && (
        <button className="sidebar-reopen" type="button" onClick={() => setOpen(true)} aria-label="Open sidebar">
          <svg viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </>
  );
}
