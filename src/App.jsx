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
 
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark" /> Inventory
          </span>
          <div className="topbar-right">
            {user && (
              <>
                <span className="who">{user.username}</span>
                <span className={`badge ${user.role === "admin" ? "badge-admin" : ""}`}>{user.role}</span>
              </>
            )}
            <ThemeToggle />
            {user && (
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
 
      {checking ? (
        <p className="center muted">Loading…</p>
      ) : user ? (
        <Products user={user} />
      ) : (
        <AuthPage onAuth={setUser} />
      )}
    </>
  );
}
