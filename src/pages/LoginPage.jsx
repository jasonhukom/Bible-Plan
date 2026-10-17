import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { isConfigured, signInWithPassword, signUpWithPassword, user } = useAuth();
  const navigate = useNavigate();
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
        const { error: signInErr } = await signInWithPassword(loginEmail, password);
        if (signInErr) throw signInErr;
        localStorage.setItem("bible-plan-show-theme-picker", "1");
        navigate("/profile");
      } else {
        const { error: signUpErr, data } = await signUpWithPassword(loginEmail, password);
        if (signUpErr) throw signUpErr;
        if (data?.session) {
          localStorage.setItem("bible-plan-show-theme-picker", "1");
          navigate("/profile");
        } else {
          setInfo("Account created! Check your email to confirm, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell" style={{ maxWidth: 440, margin: "0 auto", padding: "40px 20px" }}>
      <div className="card login-card" style={{ padding: "28px 24px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "rgba(219, 181, 88, 0.12)", color: "var(--gold-bright)", marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 32 32">
              <line x1="16" y1="5" x2="16" y2="27" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="7" y1="12" x2="25" y2="12" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Bible Plan Account</h1>
          <p className="hint-text" style={{ fontSize: 13, margin: 0 }}>
            {mode === "sign-in" ? "Sign in to sync your reading plan" : "Create an account to backup your progress"}
          </p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab${mode === "sign-in" ? " active" : ""}`}
            onClick={() => {
              setMode("sign-in");
              setError("");
              setInfo("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`login-tab${mode === "sign-up" ? " active" : ""}`}
            onClick={() => {
              setMode("sign-up");
              setError("");
              setInfo("");
            }}
          >
            Create Account
          </button>
        </div>

        <div style={{ background: "rgba(219, 181, 88, 0.08)", border: "1px solid rgba(219, 181, 88, 0.25)", borderRadius: 8, padding: "10px 12px", marginBottom: 18, fontSize: 12.5, color: "var(--cream)" }}>
          <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>Anonymous plan saved: </span>
          Your local reading plan and progress in this browser are automatically preserved and linked when you sign in!
        </div>

        {!isConfigured && (
          <div className="card" style={{ marginBottom: 16, borderColor: "var(--rust)", background: "rgba(138, 68, 54, 0.1)" }}>
            <p className="error-text" style={{ margin: 0, fontSize: 12.5 }}>
              Supabase is not configured yet. Your plan is saved locally in this browser cache.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="auth-identifier">Email or Username</label>
            <input
              id="auth-identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. name@example.com or user123"
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p className="error-text" style={{ margin: "4px 0 12px" }}>{error}</p>}
          {info && <p className="hint-text" style={{ color: "var(--gold-bright)", margin: "4px 0 12px" }}>{info}</p>}

          <button
            className="btn"
            type="submit"
            disabled={busy || !isConfigured}
            style={{ width: "100%", marginTop: 8 }}
          >
            {busy ? "Please wait…" : mode === "sign-in" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/plan" className="hint-text" style={{ textDecoration: "none", fontSize: 13 }}>
            ← Back to Plan
          </Link>
          <Link to="/profile" className="hint-text" style={{ textDecoration: "none", fontSize: 13 }}>
            Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}
