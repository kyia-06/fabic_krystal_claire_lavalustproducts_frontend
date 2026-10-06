import { useEffect, useState } from "react";
import api, { clearTokens } from "./api";
import AuthPage from "./AuthPage";
import Products from "./Products";
import ThemeToggle from "./ThemeToggle";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!localStorage.getItem("access_token"));

  // On page load, ask the API who we are (keeps the role accurate)
  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    api
      .get("/api/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {
        refresh_token: localStorage.getItem("refresh_token"),
      });
    } catch {
      /* ignore: we clear local tokens regardless */
    }
    clearTokens();
    setUser(null);
  };

  if (checking) return <p className="center muted pad">Loading…</p>;

  if (!user) {
    return (
      <>
        <div className="auth-theme">
          <ThemeToggle />
        </div>
        <AuthPage onAuth={setUser} />
      </>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <span className="brand">
          <span className="brand-mark" /> Inventory
        </span>

        <nav className="nav">
          <span className="nav-item active">Products</span>
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar">{user.username.charAt(0).toUpperCase()}</span>
            <div className="user-meta">
              <span className="who">{user.username}</span>
              <span className={`badge ${user.role === "admin" ? "badge-admin" : ""}`}>{user.role}</span>
            </div>
          </div>
          <div className="foot-actions">
            <ThemeToggle />
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <Products user={user} />
    </div>
  );
}
