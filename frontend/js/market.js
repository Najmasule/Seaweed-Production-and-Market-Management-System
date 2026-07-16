// market.js — Market module: current prices table, trend charts, sales overview, CRUD
import { Api } from './api.js';
import { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatCurrency, formatDate, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton } from './utils.js';

const state = { data: [], filtered: [], page: 1, perPage: 10, sortKey: 'date', sortDir: 'desc', search: '', type: '' };
let charts = {};

async function loadMarket() {
  const tableEl = document.getElementById('market-table');
  renderSkeleton(tableEl, 6, 6);
  try {
    const res = await Api.get('/market/');
    state.data = Array.isArray(res) ? res : (res.results || []);
    populateTypeFilter(); applyFilters(); renderStats(); renderSalesTable();
  } catch (err) { renderErrorState(tableEl, err.message || 'Failed to load market data'); }
}

function getType(r) { return r.seaweed_type || r.type || r.crop_type || 'Unknown'; }
function getPrice(r) { return Number(r.price || r.price_per_kg || r.unit_price || 0); }
function getDate(r) { return r.date || r.price_date || r.recorded_at || r.created_at || ''; }

function populateTypeFilter() {
  const select = document.getElementById('type-filter');
  const types = [...new Set(state.data.map(getType).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All Types</option>' + types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function renderStats() {
  const total = state.data.length;
  const avgPrice = total ? state.data.reduce((s, r) => s + getPrice(r), 0) / total : 0;
  const maxPrice = total ? Math.max(...state.data.map(getPrice)) : 0;
  const minPrice = total ? Math.min(...state.data.map(getPrice)) : 0;
  document.getElementById('market-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-tags"></i></div></div><div class="stat-value">${formatCurrency(avgPrice)}</div><div class="stat-label">Average Price / kg</div></div>
    <div class="stat-card secondary"><div class="stat-card-header"><div class="stat-icon secondary"><i class="fa-solid fa-arrow-trend-up"></i></div></div><div class="stat-value">${formatCurrency(maxPrice)}</div><div class="stat-label">Highest Price / kg</div></div>
    <div class="stat-card accent"><div class="stat-card-header"><div class="stat-icon accent"><i class="fa-solid fa-arrow-trend-down"></i></div></div><div class="stat-value">${formatCurrency(minPrice)}</div><div class="stat-label">Lowest Price / kg</div></div>
    <div class="stat-card info"><div class="stat-card-header"><div class="stat-icon info"><i class="fa-solid fa-database"></i></div></div><div class="stat-value">${total}</div><div class="stat-label">Price Records</div></div>`;
}

function applyFilters() {
  state.filtered = state.data.filter((r) => {
    const type = getType(r).toLowerCase();
    const matchSearch = !state.search || type.includes(state.search.toLowerCase());
    const matchType = !state.type || getType(r) === state.type;
    return matchSearch && matchType;
  });
  sortData(); state.page = 1; renderTable();
}

function sortData() {
  state.filtered.sort((a, b) => {
    if (state.sortKey === 'price') return state.sortDir === 'asc' ? getPrice(a) - getPrice(b) : getPrice(b) - getPrice(a);
    let va = a[state.sortKey] || '', vb = b[state.sortKey] || '';
    if (state.sortKey === 'date') { va = getDate(a); vb = getDate(b); }
    if (state.sortKey === 'type') { va = getType(a); vb = getType(b); }
    return state.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function renderTable() {
  const tableEl = document.getElementById('market-table');
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.perPage;
  const pageData = state.filtered.slice(start, start + state.perPage);
  if (!total) { renderEmptyState(tableEl, 'No market prices found', 'fa-tag'); renderPagination(document.getElementById('pagination'), { currentPage: 1, totalPages: 1, totalCount: 0, onPage: () => {} }); return; }
  const sortIcon = (key) => state.sortKey === key ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
  tableEl.innerHTML = `<table><thead><tr>
    <th data-sort="type">Seaweed Type <i class="fa-solid ${sortIcon('type')}"></i></th>
    <th data-sort="price">Price / kg <i class="fa-solid ${sortIcon('price')}"></i></th>
    <th>Market</th><th data-sort="date">Date <i class="fa-solid ${sortIcon('date')}"></i></th>
    <th class="no-sort">Actions</th>
  </tr></thead><tbody>${pageData.map((r) => `
    <tr><td style="font-weight:500">${escapeHtml(getType(r))}</td><td style="font-weight:600;color:var(--primary-700)">${formatCurrency(getPrice(r))}</td><td>${escapeHtml(r.market || r.market_location || '—')}</td><td>${formatDate(getDate(r))}</td><td><div class="table-actions"><button class="action-btn edit" data-edit="${r.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button><button class="action-btn delete" data-delete="${r.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></div></td></tr>
  `).join('')}</tbody></table>`;
  renderPagination(document.getElementById('pagination'), { currentPage: state.page, totalPages, totalCount: total, onPage: (p) => { state.page = p; renderTable(); } });
  bindRowEvents(); bindSortEvents();
}

function bindRowEvents() {
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editPrice(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deletePrice(btn.dataset.delete)));
}
function bindSortEvents() {
  document.querySelectorAll('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'; else { state.sortKey = key; state.sortDir = 'asc'; }
    sortData(); renderTable();
  }));
}

function editPrice(id) {
  const r = state.data.find((x) => String(x.id) === String(id)); if (!r) return;
  document.getElementById('price-modal-title').textContent = 'Edit Market Price';
  document.getElementById('price-id').value = r.id;
  document.getElementById('price-type').value = getType(r);
  document.getElementById('price-amount').value = getPrice(r);
  document.getElementById('price-date').value = getDate(r) ? getDate(r).split('T')[0] : '';
  document.getElementById('price-market').value = r.market || r.market_location || '';
  document.getElementById('price-notes').value = r.notes || '';
  openModal('price-modal');
}

function openAddModal() {
  document.getElementById('price-modal-title').textContent = 'Add Market Price';
  document.getElementById('price-form').reset();
  document.getElementById('price-id').value = '';
  document.getElementById('price-date').value = new Date().toISOString().split('T')[0];
  openModal('price-modal');
}

async function deletePrice(id) {
  const confirmed = await confirmDialog({ title: 'Delete Price', message: 'Delete this market price record?', confirmText: 'Delete', danger: true });
  if (!confirmed) return;
  try { await Api.delete(`/market/${id}/`); Toast.success('Price deleted.'); loadMarket(); }
  catch (err) { Toast.error(err.message || 'Failed to delete.'); }
}

document.getElementById('price-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('price-id').value;
  const payload = {
    seaweed_type: document.getElementById('price-type').value.trim(),
    price: parseFloat(document.getElementById('price-amount').value),
    date: document.getElementById('price-date').value,
    market: document.getElementById('price-market').value.trim() || null,
    notes: document.getElementById('price-notes').value.trim() || null,
  };
  const btn = document.getElementById('price-save-btn'); btn.disabled = true;
  try {
    if (id) { await Api.put(`/market/${id}/`, payload); Toast.success('Price updated.'); }
    else { await Api.post('/market/', payload); Toast.success('Price added.'); }
    closeModal('price-modal'); loadMarket();
  } catch (err) { Toast.error(err.message || 'Failed to save.'); }
  finally { btn.disabled = false; }
});

// Tabs + charts
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
  document.getElementById('tab-' + tab.dataset.tab).classList.remove('hidden');
  if (tab.dataset.tab === 'trends') renderTrendChart();
  if (tab.dataset.tab === 'sales') renderSalesCharts();
}));

function renderTrendChart() {
  loadChartJS().then(() => {
    const months = getLast12Months();
    const types = [...new Set(state.data.map(getType))].slice(0, 5);
    const datasets = types.map((t, i) => {
      const colors = ['#0F766E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
      const dataByMonth = {}; months.forEach((m) => dataByMonth[m.key] = null);
      state.data.filter((r) => getType(r) === t).forEach((r) => { const d = new Date(getDate(r)); if (!isNaN(d)) { const k = `${d.getFullYear()}-${d.getMonth()}`; if (dataByMonth[k] !== undefined) dataByMonth[k] = getPrice(r); } });
      return { label: t, data: months.map((m) => dataByMonth[m.key]), borderColor: colors[i], backgroundColor: colors[i] + '20', tension: 0.35, borderWidth: 2 };
    });
    const ctx = document.getElementById('trend-chart');
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(ctx, { type: 'line', data: { labels: months.map((m) => m.label), datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + v } } } } });
  });
}

function renderSalesCharts() {
  loadChartJS().then(() => {
    const palette = ['#0F766E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
    const months = getLast12Months(); const byMonth = {}; months.forEach((m) => byMonth[m.key] = 0);
    state.data.forEach((r) => { const d = new Date(getDate(r)); if (!isNaN(d)) { const k = `${d.getFullYear()}-${d.getMonth()}`; if (byMonth[k] !== undefined) byMonth[k] += getPrice(r) * (r.quantity_sold || r.volume || 1); } });
    const ctx1 = document.getElementById('sales-chart');
    if (charts.sales) charts.sales.destroy();
    charts.sales = new Chart(ctx1, { type: 'bar', data: { labels: months.map((m) => m.label), datasets: [{ label: 'Revenue ($)', data: months.map((m) => Math.round(byMonth[m.key])), backgroundColor: '#F59E0B', borderRadius: 6, maxBarThickness: 30 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + v } } } } });
    const byType = {}; state.data.forEach((r) => { const t = getType(r); byType[t] = (byType[t] || 0) + getPrice(r) * (r.quantity_sold || r.volume || 1); });
    const ctx2 = document.getElementById('sales-type-chart');
    if (charts.salesType) charts.salesType.destroy();
    charts.salesType = new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(byType), datasets: [{ data: Object.values(byType), backgroundColor: palette, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } } });
  });
}

function renderSalesTable() {
  const tableEl = document.getElementById('sales-table');
  if (!state.data.length) { renderEmptyState(tableEl, 'No sales data', 'fa-receipt'); return; }
  const sorted = [...state.data].sort((a, b) => new Date(getDate(b)) - new Date(getDate(a))).slice(0, 10);
  tableEl.innerHTML = `<table><thead><tr><th>Date</th><th>Type</th><th>Price/kg</th><th>Volume</th><th>Revenue</th></tr></thead><tbody>${sorted.map((r) => {
    const vol = r.quantity_sold || r.volume || 1; const rev = getPrice(r) * vol;
    return `<tr><td>${formatDate(getDate(r))}</td><td style="font-weight:500">${escapeHtml(getType(r))}</td><td>${formatCurrency(getPrice(r))}</td><td>${vol} kg</td><td style="font-weight:600;color:var(--primary-700)">${formatCurrency(rev)}</td></tr>`;
  }).join('')}</tbody></table>`;
}

function getLast12Months() { const months = []; const now = new Date(); for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }) }); } return months; }
function loadChartJS() { return new Promise((resolve) => { if (window.Chart) return resolve(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'; s.onload = () => resolve(); s.onerror = () => resolve(); document.head.appendChild(s); }); }

document.getElementById('search-input').addEventListener('input', debounce((e) => { state.search = e.target.value; applyFilters(); }, 300));
document.getElementById('type-filter').addEventListener('change', (e) => { state.type = e.target.value; applyFilters(); });
document.getElementById('clear-filters').addEventListener('click', () => { state.search = ''; state.type = ''; document.getElementById('search-input').value = ''; document.getElementById('type-filter').value = ''; applyFilters(); });
document.getElementById('add-price-btn').addEventListener('click', openAddModal);
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
window.onGlobalSearch = (val) => { state.search = val; document.getElementById('search-input').value = val; applyFilters(); };

loadMarket();
