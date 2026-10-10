import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal({ onClose, onSuccess }) {
  const { isConfigured, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState("sign-in");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const loginEmail = identifier.includes("@") ? identifier : `${identifier}@bibleplan.local`;
      
      if (mode === "sign-in") {
        const { error } = await signInWithPassword(loginEmail, password);
        if (error) throw error;
        onSuccess?.();
        onClose();
      } else {
        const { error, data } = await signUpWithPassword(loginEmail, password);
        if (error) throw error;
        if (data.session) {
          onSuccess?.();
          onClose();
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cal-overlay" style={{ zIndex: 100 }}>
      <div className="cal-popup login-card">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <svg width="34" height="34" viewBox="0 0 32 32" style={{ color: "var(--gold-bright)" }}>
            <line x1="16" y1="6" x2="16" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="7" y1="13" x2="25" y2="13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <h2 style={{ marginTop: 10 }}>Bible Plan</h2>
        </div>

        {!isConfigured && (
          <p className="error-text" style={{ marginBottom: 12 }}>
            Supabase isn't configured for this deployment yet.
          </p>
        )}

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab${mode === "sign-in" ? " active" : ""}`}
            onClick={() => setMode("sign-in")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`login-tab${mode === "sign-up" ? " active" : ""}`}
            onClick={() => setMode("sign-up")}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="identifier">Email / Username</label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p className="error-text">{error}</p>}
          {info && <p className="hint-text">{info}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn btn-ghost" type="button" onClick={onClose} style={{ flex: 1 }}>
              Skip
            </button>
            <button className="btn" type="submit" disabled={busy || !isConfigured} style={{ flex: 1 }}>
              {busy ? "Wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
