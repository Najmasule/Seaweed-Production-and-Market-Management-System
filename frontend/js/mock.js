// mock.js — In-memory mock data and mock API for local/standalone operation.
// Activated when VITE_USE_MOCK === 'true' or when the backend is unreachable.
// Persists to localStorage so changes survive reloads.

const LS_KEY = 'seaweed_mock_db_v1';

const REGIONS = ['Zanzibar North', 'Zanzibar South', 'Pemba', 'Dar es Salaam', 'Tanga Coast', 'Mtwara', 'Lindi'];
const SEAWEED_TYPES = ['Kappaphycus', 'Eucheuma', 'Gracilaria', 'Ulva', 'Sargassum', 'Hypnea'];
const FIRST_NAMES = ['Amani', 'Fatuma', 'Juma', 'Mwajuma', 'Hassan', 'Zainab', 'Sefu', 'Neema', 'Baraka', 'Asha', 'Omar', 'Halima', 'Saidi', 'Rehema', 'Khamis', 'Tatu'];
const LAST_NAMES = ['Mwamini', 'Hassan', 'Juma', 'Ally', 'Mushi', 'Khamis', 'Said', 'Mwakasege', 'Chande', 'Kimweri', 'Mbwana', 'Sefu'];
const COMPANIES = ['Blue Ocean Traders Ltd', 'Indian Exports Co.', 'Coastal Seaweed Inc.', 'Marine Harvesters', 'Tanga Marine Supplies', 'Pemba Aqua Trade'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, dec = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dec)); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function monthsAgo(n) { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString(); }

function seed() {
  const farmers = [];
  for (let i = 1; i <= 24; i++) {
    const name = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
    farmers.push({
      id: i,
      name,
      phone: `+255 7${randInt(10, 89)} ${randInt(100, 999)} ${randInt(100, 999)}`,
      email: `farmer${i}@seaweed.co`,
      region: rand(REGIONS),
      farm_size: randFloat(0.5, 12, 1),
      status: Math.random() > 0.15 ? 'active' : 'inactive',
      address: `${randInt(1, 200)} ${rand(['Beach Rd', 'Coastal Ave', 'Marine St', 'Harbor Ln'])}, ${rand(REGIONS)}`,
      created_at: daysAgo(randInt(1, 400)),
    });
  }

  const traders = [];
  for (let i = 1; i <= 12; i++) {
    const name = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
    traders.push({
      id: i,
      name,
      company_name: rand(COMPANIES),
      phone: `+255 7${randInt(10, 89)} ${randInt(100, 999)} ${randInt(100, 999)}`,
      email: `trader${i}@trade.co`,
      location: rand(REGIONS),
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      address: `${randInt(1, 100)} Market St, ${rand(REGIONS)}`,
      created_at: daysAgo(randInt(1, 500)),
    });
  }

  const production = [];
  for (let i = 1; i <= 60; i++) {
    const farmer = rand(farmers);
    production.push({
      id: i,
      farmer: farmer.id,
      farmer_name: farmer.name,
      seaweed_type: rand(SEAWEED_TYPES),
      quantity: randFloat(20, 800, 1),
      date: daysAgo(randInt(0, 365)),
      quality: rand(['A', 'B', 'C']),
      status: rand(['completed', 'completed', 'completed', 'in_progress', 'planned']),
      notes: Math.random() > 0.7 ? 'Harvested under optimal conditions.' : null,
      created_at: daysAgo(randInt(0, 365)),
    });
  }

  const inventory = [];
  SEAWEED_TYPES.forEach((type, i) => {
    const qty = randInt(0, 500);
    inventory.push({
      id: i + 1,
      name: type,
      quantity: qty,
      reorder_level: 50,
      unit_price: randFloat(0.8, 4.5, 2),
      location: rand(['Warehouse A', 'Warehouse B', 'Cold Storage', 'Drying Yard']),
      batch_number: `B-${2025}-${randInt(100, 999)}`,
      notes: null,
      created_at: daysAgo(randInt(10, 200)),
      updated_at: daysAgo(randInt(0, 30)),
    });
  });
  for (let i = 6; i <= 10; i++) {
    inventory.push({
      id: i,
      name: `${rand(SEAWEED_TYPES)} - Premium`,
      quantity: randInt(0, 300),
      reorder_level: 40,
      unit_price: randFloat(2, 6, 2),
      location: rand(['Warehouse A', 'Warehouse B', 'Cold Storage']),
      batch_number: `B-2025-${randInt(100, 999)}`,
      notes: null,
      created_at: daysAgo(randInt(10, 200)),
      updated_at: daysAgo(randInt(0, 30)),
    });
  }

  const market = [];
  for (let i = 1; i <= 40; i++) {
    market.push({
      id: i,
      seaweed_type: rand(SEAWEED_TYPES),
      price: randFloat(0.5, 5.5, 2),
      date: daysAgo(randInt(0, 300)),
      market: rand(['Dar es Salaam Market', 'Zanzibar Central', 'Tanga Port Market', 'International Export']),
      quantity_sold: randInt(50, 500),
      notes: null,
      created_at: daysAgo(randInt(0, 300)),
    });
  }

  // System users (managed by admin)
  const users = [
    { id: 1, username: 'admin', email: 'admin@seaweed.co', password: 'admin123', full_name: 'System Administrator', role: 'admin', status: 'active', created_at: monthsAgo(12) },
    { id: 2, username: 'manager', email: 'manager@seaweed.co', password: 'manager123', full_name: 'Operations Manager', role: 'manager', status: 'active', created_at: monthsAgo(8) },
    { id: 3, username: 'staff', email: 'staff@seaweed.co', password: 'staff123', full_name: 'Field Staff', role: 'staff', status: 'active', created_at: monthsAgo(4) },
    { id: 4, username: 'juma', email: 'juma@seaweed.co', password: 'juma12345', full_name: 'Juma Mwamini', role: 'staff', status: 'active', created_at: monthsAgo(2) },
  ];

  return { farmers, traders, production, inventory, market, users, _nextId: { farmers: 25, traders: 13, production: 61, inventory: 11, market: 41, users: 5 } };
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const db = seed();
  save(db);
  return db;
}

function save(db) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch (e) {}
}

let db = load();

function nextId(collection) {
  db._nextId[collection] = (db._nextId[collection] || (Math.max(0, ...db[collection].map((x) => x.id)) + 1));
  return db._nextId[collection]++;
}

// Simulate network latency
function delay(ms = 250) { return new Promise((r) => setTimeout(r, ms + Math.random() * 150)); }

function ok(data) { return delay().then(() => ({ ...data })); }
function fail(message, status = 400) { return delay().then(() => Promise.reject({ message, status })); }

// --- Mock route handlers ---
async function handle(method, path, body) {
  // Normalize path: strip trailing slash, split
  const clean = path.replace(/^\//, '').replace(/\/$/, '');
  const parts = clean.split('/');
  const collection = parts[0]; // 'farmers', 'traders', etc.

  // --- Auth endpoints ---
  if (clean === 'auth/token' && method === 'POST') {
    const user = db.users.find((u) => u.username === body.username && u.password === body.password);
    if (!user) return fail('Invalid username or password.', 401);
    if (user.status !== 'active') return fail('This account has been deactivated. Contact an administrator.', 403);
    // Fake JWT: header.payload.signature (base64url-ish)
    const payload = btoa(JSON.stringify({ user_id: user.id, username: user.username, role: user.role, exp: Date.now() + 86400000 }));
    return ok({ access: `mock.${payload}.sig`, refresh: `mock-refresh-${user.id}`, user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role, status: user.status } });
  }

  if (clean === 'auth/token/refresh' && method === 'POST') {
    return ok({ access: `mock.${btoa(JSON.stringify({ ts: Date.now() }))}.sig` });
  }

  if (clean === 'auth/token/logout' && method === 'POST') {
    return ok({ detail: 'Logged out.' });
  }

  if (clean === 'auth/me' && method === 'GET') {
    // In real app, decode token; here return first user (set by login flow via LS)
    const cur = localStorage.getItem('seaweed_current_user');
    if (!cur) return fail('Not authenticated.', 401);
    return ok(JSON.parse(cur));
  }

  // --- User management (admin only) ---
  if (collection === 'users') {
    if (parts.length === 1) {
      if (method === 'GET') return ok(db.users.map(({ password, ...u }) => u));
      if (method === 'POST') {
        if (!body.username || !body.email || !body.password) return fail('Username, email, and password are required.', 400);
        if (db.users.some((u) => u.username === body.username)) return fail('A user with this username already exists.', 409);
        if (db.users.some((u) => u.email === body.email)) return fail('A user with this email already exists.', 409);
        const id = nextId('users');
        const user = { id, username: body.username, email: body.email, password: body.password, full_name: body.full_name || body.username, role: body.role || 'staff', status: 'active', created_at: new Date().toISOString() };
        db.users.push(user);
        save(db);
        return ok({ id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role, status: user.status });
      }
    }
    if (parts.length === 2 && method === 'PUT') {
      const id = parseInt(parts[1]);
      const u = db.users.find((x) => x.id === id);
      if (!u) return fail('User not found.', 404);
      Object.assign(u, { full_name: body.full_name ?? u.full_name, email: body.email ?? u.email, role: body.role ?? u.role, status: body.status ?? u.status });
      if (body.password) u.password = body.password;
      save(db);
      return ok({ ...u, password: undefined });
    }
    if (parts.length === 2 && method === 'DELETE') {
      const id = parseInt(parts[1]);
      db.users = db.users.filter((x) => x.id !== id);
      save(db);
      return ok({ detail: 'User deleted.' });
    }
  }

  // --- Traders register endpoint ---
  if (clean === 'traders/register' && method === 'POST') {
    // Alias to creating a trader
    const id = nextId('traders');
    const t = { id, name: body.name || body.contact_name || 'New Trader', company_name: body.company_name || null, phone: body.phone || '', email: body.email || null, location: body.location || null, status: 'active', address: body.address || null, created_at: new Date().toISOString() };
    db.traders.push(t);
    save(db);
    return ok(t);
  }

  // --- Generic CRUD for farmers, traders, production, inventory, market ---
  if (['farmers', 'traders', 'production', 'inventory', 'market'].includes(collection)) {
    if (parts.length === 1) {
      if (method === 'GET') return ok(db[collection]);
      if (method === 'POST') {
        const id = nextId(collection);
        const rec = { id, ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        db[collection].push(rec);
        save(db);
        return ok(rec);
      }
    }
    if (parts.length === 2) {
      const id = parseInt(parts[1]);
      const idx = db[collection].findIndex((x) => x.id === id);
      if (idx === -1) return fail('Not found.', 404);
      if (method === 'GET') return ok(db[collection][idx]);
      if (method === 'PUT') {
        db[collection][idx] = { ...db[collection][idx], ...body, id, updated_at: new Date().toISOString() };
        save(db);
        return ok(db[collection][idx]);
      }
      if (method === 'DELETE') {
        db[collection].splice(idx, 1);
        save(db);
        return ok({ detail: 'Deleted.' });
      }
    }
    // Sub-resource (e.g. /traders/:id/transactions/)
    if (parts.length === 3 && parts[2] === 'transactions' && method === 'GET' && collection === 'traders') {
      const id = parseInt(parts[1]);
      const txns = db.market.filter((m) => m.trader_id === id).slice(0, 10);
      return ok(txns);
    }
  }

  return fail(`Mock endpoint not found: ${method} ${path}`, 404);
}

export const Mock = {
  handle,
  reset() { db = seed(); save(db); return db; },
  isMockPath(path) {
    const c = path.replace(/^\//, '').split('/')[0];
    return ['auth', 'farmers', 'traders', 'production', 'inventory', 'market', 'users'].includes(c);
  },
};
