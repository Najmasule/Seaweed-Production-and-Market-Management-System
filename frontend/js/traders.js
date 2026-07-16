// traders.js — Traders module: CRUD table, profile view with transactions and purchase history
import { Api } from './api.js';
import { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatCurrency, formatDate, formatNumber, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton, getInitials } from './utils.js';

const state = { data: [], filtered: [], page: 1, perPage: 10, sortKey: 'name', sortDir: 'asc', search: '', status: '' };

async function loadTraders() {
  const tableEl = document.getElementById('traders-table');
  renderSkeleton(tableEl, 6, 6);
  try {
    const res = await Api.get('/traders/');
    state.data = Array.isArray(res) ? res : (res.results || []);
    applyFilters();
  } catch (err) { renderErrorState(tableEl, err.message || 'Failed to load traders'); }
}

function getName(t) { return t.name || t.contact_name || t.username || 'Unknown'; }
function getCompany(t) { return t.company_name || t.company || ''; }

function applyFilters() {
  state.filtered = state.data.filter((t) => {
    const name = getName(t).toLowerCase(); const company = getCompany(t).toLowerCase();
    const phone = (t.phone || t.phone_number || '').toLowerCase();
    const matchSearch = !state.search || name.includes(state.search.toLowerCase()) || company.includes(state.search.toLowerCase()) || phone.includes(state.search.toLowerCase());
    const status = (t.status || 'active').toLowerCase();
    const matchStatus = !state.status || status === state.status;
    return matchSearch && matchStatus;
  });
  sortData(); state.page = 1; renderTable();
}

function sortData() {
  state.filtered.sort((a, b) => {
    let va, vb;
    if (state.sortKey === 'name') { va = getName(a); vb = getName(b); }
    else if (state.sortKey === 'company') { va = getCompany(a); vb = getCompany(b); }
    else { va = a[state.sortKey] || ''; vb = b[state.sortKey] || ''; }
    return state.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function renderTable() {
  const tableEl = document.getElementById('traders-table');
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.perPage;
  const pageData = state.filtered.slice(start, start + state.perPage);
  if (!total) { renderEmptyState(tableEl, 'No traders found', 'fa-handshake'); renderPagination(document.getElementById('pagination'), { currentPage: 1, totalPages: 1, totalCount: 0, onPage: () => {} }); return; }
  const sortIcon = (key) => state.sortKey === key ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
  tableEl.innerHTML = `<table><thead><tr>
    <th data-sort="name">Trader <i class="fa-solid ${sortIcon('name')}"></i></th>
    <th data-sort="company">Company <i class="fa-solid ${sortIcon('company')}"></i></th>
    <th>Contact</th><th>Location</th><th data-sort="status">Status <i class="fa-solid ${sortIcon('status')}"></i></th>
    <th class="no-sort">Actions</th>
  </tr></thead><tbody>${pageData.map((t) => {
    const name = getName(t); const status = (t.status || 'active').toLowerCase();
    const statusBadge = status === 'active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>';
    return `<tr><td><div style="display:flex;align-items:center;gap:10px"><span class="user-avatar" style="width:32px;height:32px;font-size:11px">${getInitials(name)}</span><span style="font-weight:500">${escapeHtml(name)}</span></div></td>
    <td>${escapeHtml(getCompany(t) || '—')}</td><td>${escapeHtml(t.phone || t.phone_number || '—')}</td><td>${escapeHtml(t.location || t.city || '—')}</td><td>${statusBadge}</td>
    <td><div class="table-actions"><button class="action-btn view" data-view="${t.id}" aria-label="View"><i class="fa-solid fa-eye"></i></button><button class="action-btn edit" data-edit="${t.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button><button class="action-btn delete" data-delete="${t.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></div></td></tr>`;
  }).join('')}</tbody></table>`;
  renderPagination(document.getElementById('pagination'), { currentPage: state.page, totalPages, totalCount: total, onPage: (p) => { state.page = p; renderTable(); } });
  bindRowEvents(); bindSortEvents();
}

function bindRowEvents() {
  document.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => viewTrader(btn.dataset.view)));
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editTrader(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteTrader(btn.dataset.delete)));
}
function bindSortEvents() {
  document.querySelectorAll('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; else { state.sortKey = key; state.sortDir = 'asc'; }
    sortData(); renderTable();
  }));
}

async function viewTrader(id) {
  const t = state.data.find((x) => String(x.id) === String(id)); if (!t) return;
  const name = getName(t); const body = document.getElementById('trader-profile-body');
  body.innerHTML = `<div class="profile-header"><div class="profile-avatar">${getInitials(name)}</div><div><div class="profile-name">${escapeHtml(name)}</div><div class="profile-meta"><span><i class="fa-solid fa-building"></i> ${escapeHtml(getCompany(t) || '—')}</span><span><i class="fa-solid fa-phone"></i> ${escapeHtml(t.phone || t.phone_number || '—')}</span><span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(t.location || '—')}</span></div></div></div><div class="detail-grid"><div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(t.email || '—')}</span></div><div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${escapeHtml(t.phone || t.phone_number || '—')}</span></div><div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(getCompany(t) || '—')}</span></div><div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">${escapeHtml(t.location || '—')}</span></div><div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${(t.status || 'active') === 'active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>'}</span></div><div class="detail-item"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(t.address || '—')}</span></div><div class="detail-item"><span class="detail-label">Registered</span><span class="detail-value">${formatDate(t.created_at || t.date_joined)}</span></div><div class="detail-item"><span class="detail-label">Trader ID</span><span class="detail-value">#${t.id}</span></div></div><div id="trader-transactions" style="padding:0 var(--space-6) var(--space-6)"><h4 style="margin-bottom:var(--space-4);font-size:15px;font-weight:600">Purchase History</h4><div class="spinner-center"><span class="spinner"></span></div></div>`;
  openModal('trader-profile-modal');
  try {
    const txRes = await Api.get('/traders/' + id + '/transactions/').catch(() => Api.get('/market/?trader=' + id).catch(() => null));
    const txns = txRes ? (Array.isArray(txRes) ? txRes : (txRes.results || [])) : [];
    const txEl = document.getElementById('trader-transactions');
    if (!txns.length) { renderEmptyState(txEl, 'No transactions found', 'fa-receipt'); return; }
    txEl.innerHTML = `<h4 style="margin-bottom:var(--space-4);font-size:15px;font-weight:600">Purchase History (${txns.length})</h4><table><thead><tr><th>Date</th><th>Type</th><th>Quantity</th><th>Price/kg</th><th>Total</th></tr></thead><tbody>${txns.slice(0, 10).map((tx) => {
      const qty = Number(tx.quantity || tx.weight || 0); const price = Number(tx.price || tx.price_per_kg || 0); const total = qty * price || Number(tx.total_price || tx.total || 0);
      return `<tr><td>${formatDate(tx.date || tx.transaction_date || tx.created_at)}</td><td style="font-weight:500">${escapeHtml(tx.seaweed_type || tx.type || '—')}</td><td>${formatNumber(qty)} kg</td><td>${formatCurrency(price)}</td><td style="font-weight:600">${formatCurrency(total)}</td></tr>`;
    }).join('')}</tbody></table>`;
  } catch (err) { document.getElementById('trader-transactions').innerHTML = '<p class="text-secondary">Unable to load transactions.</p>'; }
}

function editTrader(id) {
  const t = state.data.find((x) => String(x.id) === String(id)); if (!t) return;
  document.getElementById('trader-modal-title').textContent = 'Edit Trader';
  document.getElementById('trader-id').value = t.id;
  document.getElementById('trader-name').value = getName(t);
  document.getElementById('trader-company').value = getCompany(t);
  document.getElementById('trader-phone').value = t.phone || t.phone_number || '';
  document.getElementById('trader-email').value = t.email || '';
  document.getElementById('trader-location').value = t.location || t.city || '';
  document.getElementById('trader-status').value = (t.status || 'active').toLowerCase();
  document.getElementById('trader-address').value = t.address || '';
  openModal('trader-modal');
}

function openAddModal() {
  document.getElementById('trader-modal-title').textContent = 'Add Trader';
  document.getElementById('trader-form').reset();
  document.getElementById('trader-id').value = '';
  openModal('trader-modal');
}

async function deleteTrader(id) {
  const t = state.data.find((x) => String(x.id) === String(id));
  const confirmed = await confirmDialog({ title: 'Delete Trader', message: `Delete "${getName(t)}"? This cannot be undone.`, confirmText: 'Delete', danger: true });
  if (!confirmed) return;
  try { await Api.delete(`/traders/${id}/`); Toast.success('Trader deleted.'); loadTraders(); }
  catch (err) { Toast.error(err.message || 'Failed to delete.'); }
}

document.getElementById('trader-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('trader-id').value;
  const payload = {
    name: document.getElementById('trader-name').value.trim(),
    company_name: document.getElementById('trader-company').value.trim() || null,
    phone: document.getElementById('trader-phone').value.trim(),
    email: document.getElementById('trader-email').value.trim() || null,
    location: document.getElementById('trader-location').value.trim() || null,
    status: document.getElementById('trader-status').value,
    address: document.getElementById('trader-address').value.trim() || null,
  };
  const btn = document.getElementById('trader-save-btn'); btn.disabled = true;
  try {
    if (id) { await Api.put(`/traders/${id}/`, payload); Toast.success('Trader updated.'); }
    else { await Api.post('/traders/', payload); Toast.success('Trader added.'); }
    closeModal('trader-modal'); loadTraders();
  } catch (err) { Toast.error(err.message || 'Failed to save.'); }
  finally { btn.disabled = false; }
});

document.getElementById('search-input').addEventListener('input', debounce((e) => { state.search = e.target.value; applyFilters(); }, 300));
document.getElementById('status-filter').addEventListener('change', (e) => { state.status = e.target.value; applyFilters(); });
document.getElementById('clear-filters').addEventListener('click', () => { state.search = ''; state.status = ''; document.getElementById('search-input').value = ''; document.getElementById('status-filter').value = ''; applyFilters(); });
document.getElementById('add-trader-btn').addEventListener('click', openAddModal);
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
window.onGlobalSearch = (val) => { state.search = val; document.getElementById('search-input').value = val; applyFilters(); };

loadTraders();
