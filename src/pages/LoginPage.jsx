import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, isConfigured, signInWithPassword, signUpWithPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("sign-in"); // "sign-in" | "sign-up"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/plan" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        navigate("/plan");
      } else {
        const { error, data } = await signUpWithPassword(email, password);
        if (error) throw error;
        if (data.session) {
          navigate("/plan");
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
    <div className="login-shell">
      <div className="card login-card">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <svg width="34" height="34" viewBox="0 0 32 32" style={{ color: "var(--gold-bright)" }}>
            <line x1="16" y1="6" x2="16" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="7" y1="13" x2="25" y2="13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <h1 style={{ marginTop: 10 }}>Bible Plan</h1>
        </div>

        {!isConfigured && (
          <p className="error-text">
            Supabase isn't configured for this deployment yet — set VITE_SUPABASE_URL and
            VITE_SUPABASE_ANON_KEY (see .env.example).
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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

          <button className="btn" type="submit" disabled={busy || !isConfigured} style={{ width: "100%" }}>
            {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
