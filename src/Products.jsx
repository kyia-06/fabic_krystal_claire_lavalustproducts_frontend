import { useEffect, useMemo, useState } from "react";
import api from "./api";

const empty = { product_name: "", description: "", price: "", quantity: "" };
const peso = (n) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const stock = (qty) => {
  if (qty <= 0) return { label: "Out of stock", cls: "tag-out" };
  if (qty <= 5) return { label: "Low stock", cls: "tag-low" };
  return { label: "In stock", cls: "tag-ok" };
};

export default function Products({ user }) {
  const isAdmin = user.role === "admin";
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/api/products");
      setProducts(data.data);
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Close the drawer with Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const closeDrawer = () => {
    setDrawerOpen(false);
    setForm(empty);
    setEditingId(null);
  };

  const openAdd = () => {
    setForm(empty);
    setEditingId(null);
    setDrawerOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await api.put(`/api/products/${editingId}`, form);
      else await api.post("/api/products", form);
      closeDrawer();
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      product_name: p.product_name,
      description: p.description || "",
      price: p.price,
      quantity: p.quantity,
    });
    setDrawerOpen(true);
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    setError("");
    try {
      await api.delete(`/api/products/${p.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const stats = useMemo(() => {
    const units = products.reduce((s, p) => s + Number(p.quantity), 0);
    const value = products.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0);
    return { count: products.length, units, value };
  }, [products]);

  return (
    <main className="main">
      <div className="page-head">
        <div>
          <h1>Products</h1>
          <p className="muted">
            {isAdmin ? "Manage your product catalog." : "Browse the product catalog (view only)."}
          </p>
        </div>
        <div className="head-tools">
          <input
            className="search"
            type="search"
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAdd}>
              Add product
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <section className="stats">
        <div className="card stat">
          <div className="label">Products</div>
          <div className="value">{stats.count}</div>
        </div>
        <div className="card stat">
          <div className="label">Units in stock</div>
          <div className="value">{stats.units.toLocaleString("en-PH")}</div>
        </div>
        <div className="card stat hot">
          <div className="label">Inventory value</div>
          <div className="value">{peso(stats.value)}</div>
        </div>
      </section>

      {loading ? (
        <p className="center muted pad">Loading products…</p>
      ) : visible.length === 0 ? (
        <p className="center muted pad">
          {products.length === 0 ? "No products yet." : "No products match your search."}
        </p>
      ) : (
        <section className="grid">
          {visible.map((p) => {
            const s = stock(Number(p.quantity));
            return (
              <article key={p.id} className="card product">
                <div className="product-top">
                  <span className="product-avatar" aria-hidden="true">
                    {p.product_name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h2>{p.product_name}</h2>
                    <span className={`tag ${s.cls}`}>{s.label}</span>
                  </div>
                </div>
                <p className="desc">{p.description || "No description."}</p>
                <div className="product-bottom">
                  <div>
                    <div className="price">{peso(p.price)}</div>
                    <div className="qty">{p.quantity} in stock</div>
                  </div>
                  {isAdmin && (
                    <div className="product-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => edit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {isAdmin && drawerOpen && (
        <>
          <div className="overlay" onClick={closeDrawer} />
          <form onSubmit={submit} className="drawer">
            <div className="drawer-head">
              <h2>{editingId ? "Edit product" : "Add product"}</h2>
              <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close">
                ✕
              </button>
            </div>

            {error && <div className="alert">{error}</div>}

            <label>
              Name
              <input value={form.product_name} onChange={set("product_name")} maxLength={100} required />
            </label>

            <label>
              Description
              <textarea rows="4" value={form.description} onChange={set("description")} />
            </label>

            <div className="form-grid">
              <label>
                Price (₱)
                <input type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required />
              </label>
              <label>
                Quantity
                <input type="number" min="0" step="1" value={form.quantity} onChange={set("quantity")} required />
              </label>
            </div>

            <div className="row">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeDrawer}>
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
