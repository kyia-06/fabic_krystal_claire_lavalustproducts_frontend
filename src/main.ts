const API = 'http://127.0.0.1:3000/api';
let token = '';
let role = '';

const app = document.getElementById('app')!;

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function loginView() {
  app.innerHTML = `
    <h2>Login</h2>
    <input id="u" placeholder="Username"><br>
    <input id="p" type="password" placeholder="Password"><br>
    <button id="go">Sign in</button>
    <p id="msg"></p>`;
  document.getElementById('go')!.onclick = async () => {
    const r = await api('/auth/login', 'POST', {
      username: (document.getElementById('u') as HTMLInputElement).value,
      password: (document.getElementById('p') as HTMLInputElement).value,
    });
    if (!r.access_token) {
      document.getElementById('msg')!.textContent = r.error || 'Login failed';
      return;
    }
    token = r.access_token;
    const me = await api('/auth/me');
    role = me.role ?? me.data?.role ?? me.user?.role ?? '';
    productsView();
  };
}

async function productsView() {
  const r = await api('/products');
  const rows = r.data ?? [];
  const isAdmin = role === 'admin';
  app.innerHTML = `
    <h2>Products (${role})</h2>
    ${isAdmin ? '<button id="add">Add</button>' : ''}
    <table border="1" cellpadding="6">
      ${rows.map((p: any) => `
        <tr>
          <td>${p.id}</td><td>${p.name}</td><td>${p.price}</td>
          ${isAdmin ? `<td><button data-e="${p.id}">Edit</button>
                           <button data-d="${p.id}">Delete</button></td>` : ''}
        </tr>`).join('')}
    </table>`;

  if (isAdmin) {
    document.getElementById('add')!.onclick = async () => {
      const name = prompt('Name?'); const price = prompt('Price?');
      if (name && price) { await api('/products', 'POST', { name, price: Number(price) }); productsView(); }
    };
    app.querySelectorAll<HTMLButtonElement>('[data-e]').forEach(b => b.onclick = async () => {
      const name = prompt('New name?'); const price = prompt('New price?');
      if (name && price) { await api(`/products/${b.dataset.e}`, 'PUT', { name, price: Number(price) }); productsView(); }
    });
    app.querySelectorAll<HTMLButtonElement>('[data-d]').forEach(b => b.onclick = async () => {
      if (confirm('Delete?')) { await api(`/products/${b.dataset.d}`, 'DELETE'); productsView(); }
    });
  }
}

loginView();