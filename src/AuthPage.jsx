import { useState } from "react";
import api, { saveTokens } from "./api";

const UserIcon = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <circle cx="12" cy="7.5" r="4.5" />
    <path d="M3 21c0-4.4 4-7 9-7s9 2.6 9 7c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1z" />
  </svg>
);

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h6V8a3 3 0 0 0-6 0v2z" />
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isRegister = mode === "register";

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await api.post("/api/auth/register", form);
      const { data } = await api.post("/api/auth/login", {
        username: form.username,
        password: form.password,
      });
      saveTokens(data);
      onAuth(data.user);
    } catch (err) {
      console.error("Auth error:", err);
      if (!err.response) {
        setError("Can't reach the server. Check that the API is running and VITE_API_URL is correct.");
      } else {
        setError(err.response.data?.error || `Server error (${err.response.status}).`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-bg">
      <form onSubmit={submit} className="login-card">
        <span className="login-avatar" aria-hidden="true">
          <UserIcon size={52} color="#fff" />
        </span>

        <div className="login-title">
          <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
          <p>{isRegister ? "Sign up to view the product catalog." : "Sign in to continue."}</p>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="pill">
          <UserIcon />
          <input
            placeholder="Username"
            aria-label="Username"
            value={form.username}
            onChange={set("username")}
            autoComplete="username"
            required
          />
        </div>

        <div className="pill">
          <LockIcon />
          <input
            type={showPw ? "text" : "password"}
            placeholder="Password"
            aria-label="Password"
            value={form.password}
            onChange={set("password")}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 6 : undefined}
            required
          />
          <button
            type="button"
            className="eye"
            onClick={() => setShowPw(!showPw)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <EyeIcon off={!showPw} />
          </button>
        </div>

        <button className="login-btn" disabled={busy}>
          {busy ? "Please wait…" : isRegister ? "Sign up" : "Login"}
        </button>

        <div className="login-foot">
          <button type="button" className="link" onClick={switchMode}>
            {isRegister ? "Already have an account? Sign in" : "No account? Create one"}
          </button>
        </div>
      </form>
    </div>
  );
}
