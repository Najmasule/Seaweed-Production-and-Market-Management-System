// production.js — Production module: records table, history timeline, statistics charts, CRUD
import { Api } from './api.js';
import { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatWeight, formatDate, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton } from './utils.js';

const state = { data: [], filtered: [], page: 1, perPage: 10, sortKey: 'date', sortDir: 'desc', search: '', dateFrom: '', dateTo: '', type: '', farmers: [] };
let statCharts = {};

async function loadProduction() {
  const tableEl = document.getElementById('production-table');
  renderSkeleton(tableEl, 6, 6);
  try {
    const [prodRes, farmersRes] = await Promise.allSettled([Api.get('/production/'), Api.get('/farmers/')]);
    state.data = prodRes.status === 'fulfilled' ? extractArr(prodRes.value) : [];
    state.farmers = farmersRes.status === 'fulfilled' ? extractArr(farmersRes.value) : [];
    populateFarmerSelect(); populateTypeFilter();
    applyFilters(); renderStats(); renderHistory();
  } catch (err) { renderErrorState(tableEl, err.message || 'Failed to load production data'); }
}

function extractArr(v) { return Array.isArray(v) ? v : (v.results || []); }
function getQty(r) { return Number(r.quantity || r.weight || r.amount || 0); }
function getType(r) { return r.seaweed_type || r.type || r.crop_type || 'Unknown'; }
function getFarmerName(r) { return r.farmer_name || (r.farmer && (r.farmer.name || r.farmer.farmer_name || r.farmer.username)) || '—'; }
function getDate(r) { return r.date || r.production_date || r.created_at || ''; }

function populateFarmerSelect() {
  const sel = document.getElementById('prod-farmer');
  sel.innerHTML = '<option value="">Select farmer…</option>' + state.farmers.map((f) => {
    const name = f.name || f.farmer_name || f.username || 'Unknown';
    return `<option value="${f.id}">${escapeHtml(name)}</option>`;
  }).join('');
}
function populateTypeFilter() {
  const select = document.getElementById('type-filter');
  const types = [...new Set(state.data.map(getType).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All Types</option>' + types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function renderStats() {
  const total = state.data.length;
  const totalQty = state.data.reduce((s, r) => s + getQty(r), 0);
  const completed = state.data.filter((r) => (r.status || 'completed') === 'completed').length;
  const now = new Date();
  const thisMonth = state.data.filter((r) => { const d = new Date(getDate(r)); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  document.getElementById('prod-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-seedling"></i></div></div><div class="stat-value">${total}</div><div class="stat-label">Total Records</div></div>
    <div class="stat-card secondary"><div class="stat-card-header"><div class="stat-icon secondary"><i class="fa-solid fa-weight-hanging"></i></div></div><div class="stat-value">${formatWeight(totalQty)}</div><div class="stat-label">Total Production</div></div>
    <div class="stat-card accent"><div class="stat-card-header"><div class="stat-icon accent"><i class="fa-solid fa-circle-check"></i></div></div><div class="stat-value">${completed}</div><div class="stat-label">Completed</div></div>
    <div class="stat-card info"><div class="stat-card-header"><div class="stat-icon info"><i class="fa-solid fa-calendar"></i></div></div><div class="stat-value">${thisMonth}</div><div class="stat-label">This Month</div></div>`;
}

function applyFilters() {
  state.filtered = state.data.filter((r) => {
    const type = getType(r).toLowerCase(); const farmer = getFarmerName(r).toLowerCase();
    const matchSearch = !state.search || type.includes(state.search.toLowerCase()) || farmer.includes(state.search.toLowerCase());
    const matchType = !state.type || getType(r) === state.type;
    const d = new Date(getDate(r)); const matchFrom = !state.dateFrom || d >= new Date(state.dateFrom); const matchTo = !state.dateTo || d <= new Date(state.dateTo + 'T23:59:59');
    return matchSearch && matchType && matchFrom && matchTo;
  });
  sortData(); state.page = 1; renderTable();
}

function sortData() {
  state.filtered.sort((a, b) => {
    if (state.sortKey === 'quantity') { return state.sortDir === 'asc' ? getQty(a) - getQty(b) : getQty(b) - getQty(a); }
    let va = a[state.sortKey] || '', vb = b[state.sortKey] || '';
    if (state.sortKey === 'date') { va = getDate(a); vb = getDate(b); }
    return state.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function renderTable() {
  const tableEl = document.getElementById('production-table');
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.perPage;
  const pageData = state.filtered.slice(start, start + state.perPage);
  if (!total) { renderEmptyState(tableEl, 'No production records found', 'fa-seedling'); renderPagination(document.getElementById('pagination'), { currentPage: 1, totalPages: 1, totalCount: 0, onPage: () => {} }); return; }
  const sortIcon = (key) => state.sortKey === key ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
  tableEl.innerHTML = `<table><thead><tr>
    <th data-sort="date">Date <i class="fa-solid ${sortIcon('date')}"></i></th>
    <th>Farmer</th><th data-sort="type">Type <i class="fa-solid ${sortIcon('type')}"></i></th>
    <th data-sort="quantity">Quantity <i class="fa-solid ${sortIcon('quantity')}"></i></th>
    <th>Quality</th><th>Status</th><th class="no-sort">Actions</th>
  </tr></thead><tbody>${pageData.map((r) => {
    const status = (r.status || 'completed'); const statusBadge = status === 'completed' ? '<span class="badge badge-success">Completed</span>' : status === 'in_progress' ? '<span class="badge badge-warning">In Progress</span>' : '<span class="badge badge-info">Planned</span>';
    const quality = r.quality || r.quality_grade || '—';
    return `<tr><td>${formatDate(getDate(r))}</td><td>${escapeHtml(getFarmerName(r))}</td><td style="font-weight:500">${escapeHtml(getType(r))}</td><td>${formatWeight(getQty(r))}</td><td>${quality !== '—' ? '<span class="badge badge-neutral">Grade ' + escapeHtml(quality) + '</span>' : '—'}</td><td>${statusBadge}</td><td><div class="table-actions"><button class="action-btn edit" data-edit="${r.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button><button class="action-btn delete" data-delete="${r.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></div></td></tr>`;
  }).join('')}</tbody></table>`;
  renderPagination(document.getElementById('pagination'), { currentPage: state.page, totalPages, totalCount: total, onPage: (p) => { state.page = p; renderTable(); } });
  bindRowEvents(); bindSortEvents();
}

function bindRowEvents() {
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editRecord(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteRecord(btn.dataset.delete)));
}
function bindSortEvents() {
  document.querySelectorAll('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; else { state.sortKey = key; state.sortDir = 'asc'; }
    sortData(); renderTable();
  }));
}

function renderHistory() {
  const body = document.getElementById('history-body');
  const sorted = [...state.data].sort((a, b) => new Date(getDate(b)) - new Date(getDate(a))).slice(0, 20);
  if (!sorted.length) { renderEmptyState(body, 'No production history', 'fa-clock-rotate-left'); return; }
  body.innerHTML = `<div class="accordion">${sorted.map((r, i) => `
    <div class="accordion-item"><div class="accordion-header"><span><i class="fa-solid fa-seedling" style="color:var(--secondary-500);margin-right:8px"></i> ${escapeHtml(getType(r))} — ${formatWeight(getQty(r))}</span><i class="fa-solid fa-chevron-down"></i></div>
    <div class="accordion-body"><div class="accordion-body-inner">
      <div class="detail-grid" style="padding:0">
        <div class="detail-item"><span class="detail-label">Date</span><span class="detail-value">${formatDate(getDate(r))}</span></div>
        <div class="detail-item"><span class="detail-label">Farmer</span><span class="detail-value">${escapeHtml(getFarmerName(r))}</span></div>
        <div class="detail-item"><span class="detail-label">Quality</span><span class="detail-value">${r.quality || r.quality_grade || '—'}</span></div>
        <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${r.status || 'completed'}</span></div>
        ${r.notes ? `<div class="detail-item" style="grid-column:1/-1"><span class="detail-label">Notes</span><span class="detail-value">${escapeHtml(r.notes)}</span></div>` : ''}
      </div>
    </div></div></div>`).join('')}</div>`;
  bindAccordion();
}

function bindAccordion() {
  document.querySelectorAll('.accordion-header').forEach((h) => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
}

function editRecord(id) {
  const r = state.data.find((x) => String(x.id) === String(id)); if (!r) return;
  document.getElementById('prod-modal-title').textContent = 'Edit Production Record';
  document.getElementById('prod-id').value = r.id;
  document.getElementById('prod-farmer').value = r.farmer || r.farmer_id || '';
  document.getElementById('prod-type').value = getType(r);
  document.getElementById('prod-quantity').value = getQty(r);
  document.getElementById('prod-date').value = getDate(r) ? getDate(r).split('T')[0] : '';
  document.getElementById('prod-quality').value = r.quality || r.quality_grade || 'A';
  document.getElementById('prod-status').value = r.status || 'completed';
  document.getElementById('prod-notes').value = r.notes || '';
  openModal('production-modal');
}

function openAddModal() {
  document.getElementById('prod-modal-title').textContent = 'Record Production';
  document.getElementById('production-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-date').value = new Date().toISOString().split('T')[0];
  openModal('production-modal');
}

async function deleteRecord(id) {
  const confirmed = await confirmDialog({ title: 'Delete Record', message: 'Delete this production record? This cannot be undone.', confirmText: 'Delete', danger: true });
  if (!confirmed) return;
  try { await Api.delete(`/production/${id}/`); Toast.success('Record deleted.'); loadProduction(); }
  catch (err) { Toast.error(err.message || 'Failed to delete record.'); }
}

document.getElementById('production-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const payload = {
    farmer: parseInt(document.getElementById('prod-farmer').value) || null,
    seaweed_type: document.getElementById('prod-type').value.trim(),
    quantity: parseFloat(document.getElementById('prod-quantity').value),
    date: document.getElementById('prod-date').value,
    quality: document.getElementById('prod-quality').value,
    status: document.getElementById('prod-status').value,
    notes: document.getElementById('prod-notes').value.trim() || null,
  };
  const btn = document.getElementById('prod-save-btn'); btn.disabled = true;
  try {
    if (id) { await Api.put(`/production/${id}/`, payload); Toast.success('Record updated.'); }
    else { await Api.post('/production/', payload); Toast.success('Production recorded.'); }
    closeModal('production-modal'); loadProduction();
  } catch (err) { Toast.error(err.message || 'Failed to save record.'); }
  finally { btn.disabled = false; }
});

// Tabs
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
  document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
  if (tab.dataset.tab === 'statistics') renderStatCharts();
}));

function renderStatCharts() {
  loadChartJS().then(() => {
    const palette = ['#0F766E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
    // Monthly chart
    const months = getLast12Months(); const byMonth = {}; months.forEach((m) => byMonth[m.key] = 0);
    state.data.forEach((r) => { const d = new Date(getDate(r)); if (!isNaN(d)) { const k = `${d.getFullYear()}-${d.getMonth()}`; if (byMonth[k] !== undefined) byMonth[k] += getQty(r); } });
    const ctx1 = document.getElementById('stat-monthly');
    if (statCharts.monthly) statCharts.monthly.destroy();
    statCharts.monthly = new Chart(ctx1, { type: 'line', data: { labels: months.map((m) => m.label), datasets: [{ label: 'Production (kg)', data: months.map((m) => Math.round(byMonth[m.key])), borderColor: '#0F766E', backgroundColor: 'rgba(15,118,110,0.1)', fill: true, tension: 0.35, borderWidth: 2.5 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    // By type chart
    const byType = {}; state.data.forEach((r) => { const t = getType(r); byType[t] = (byType[t] || 0) + getQty(r); });
    const ctx2 = document.getElementById('stat-by-type');
    if (statCharts.byType) statCharts.byType.destroy();
    statCharts.byType = new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(byType), datasets: [{ data: Object.values(byType), backgroundColor: palette, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } } });
  });
}

function getLast12Months() { const months = []; const now = new Date(); for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }) }); } return months; }
function loadChartJS() { return new Promise((resolve) => { if (window.Chart) return resolve(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'; s.onload = () => resolve(); s.onerror = () => resolve(); document.head.appendChild(s); }); }

document.getElementById('search-input').addEventListener('input', debounce((e) => { state.search = e.target.value; applyFilters(); }, 300));
document.getElementById('date-from').addEventListener('change', (e) => { state.dateFrom = e.target.value; applyFilters(); });
document.getElementById('date-to').addEventListener('change', (e) => { state.dateTo = e.target.value; applyFilters(); });
document.getElementById('type-filter').addEventListener('change', (e) => { state.type = e.target.value; applyFilters(); });
document.getElementById('clear-filters').addEventListener('click', () => { state.search = ''; state.dateFrom = ''; state.dateTo = ''; state.type = ''; ['search-input', 'date-from', 'date-to', 'type-filter'].forEach((id) => document.getElementById(id).value = ''); applyFilters(); });
document.getElementById('add-production-btn').addEventListener('click', openAddModal);
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
window.onGlobalSearch = (val) => { state.search = val; document.getElementById('search-input').value = val; applyFilters(); };

loadProduction();
