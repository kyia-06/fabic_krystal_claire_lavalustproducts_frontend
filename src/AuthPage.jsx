import { useState } from "react";
import api, { saveTokens } from "./api";
 
export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
    <div className="auth-wrap">
      <form onSubmit={submit} className="card auth-card">
        <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
        <p className="muted">
          {isRegister ? "Sign up to view the product catalog." : "Sign in to continue."}
        </p>
 
        {error && <div className="alert">{error}</div>}
 
        <label>
          Username
          <input value={form.username} onChange={set("username")} autoComplete="username" required />
        </label>
 
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 6 : undefined}
            required
          />
        </label>
 
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
 
        <button type="button" className="link" onClick={switchMode}>
          {isRegister ? "Already have an account? Sign in" : "No account? Create one"}
        </button>
      </form>
    </div>
  );
}
