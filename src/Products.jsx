import { useEffect, useState } from "react";
import api from "./api";
 
const empty = { product_name: "", description: "", price: "", quantity: "" };
const peso = (n) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
 
export default function Products({ user }) {
  const isAdmin = user.role === "admin";
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
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
 
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
 
  const reset = () => { setForm(empty); setEditingId(null); };
 
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await api.put(`/api/products/${editingId}`, form);
      else await api.post("/api/products", form);
      reset();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
 
  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1>Products</h1>
          <p className="muted">
            {isAdmin ? "Manage your product catalog." : "Browse the product catalog (view only)."}
          </p>
        </div>
      </div>
 
      {error && <div className="alert">{error}</div>}
 
      {isAdmin && (
        <form onSubmit={submit} className="card form-grid">
          <h2 className="span-2">{editingId ? "Edit product" : "Add product"}</h2>
 
          <label className="span-2">
            Name
            <input value={form.product_name} onChange={set("product_name")} maxLength={100} required />
          </label>
 
          <label className="span-2">
            Description
            <textarea rows="3" value={form.description} onChange={set("description")} />
          </label>
 
          <label>
            Price (₱)
            <input type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required />
          </label>
 
          <label>
            Quantity
            <input type="number" min="0" step="1" value={form.quantity} onChange={set("quantity")} required />
          </label>
 
          <div className="span-2 row">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update product" : "Add product"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
 
      <div className="card table-card">
        {loading ? (
          <p className="center muted pad">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="center muted pad">No products yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th className="num">Price</th>
                <th className="num">Qty</th>
                {isAdmin && <th className="actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td data-label="Name" className="strong">{p.product_name}</td>
                  <td data-label="Description" className="muted">{p.description || "—"}</td>
                  <td data-label="Price" className="num">{peso(p.price)}</td>
                  <td data-label="Qty" className="num">{p.quantity}</td>
                  {isAdmin && (
                    <td data-label="Actions" className="actions-col">
                      <button className="btn btn-ghost btn-sm" onClick={() => edit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
