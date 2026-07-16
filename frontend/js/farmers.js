// farmers.js — Farmers module: CRUD table with search, filter, pagination, add/edit/delete, profile view
import { Api } from './api.js';
import { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatDate, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton, getInitials } from './utils.js';

const state = { data: [], filtered: [], page: 1, perPage: 10, sortKey: 'name', sortDir: 'asc', search: '', region: '', status: '' };

async function loadFarmers() {
  const tableEl = document.getElementById('farmers-table');
  renderSkeleton(tableEl, 6, 6);
  try {
    const res = await Api.get('/farmers/');
    state.data = Array.isArray(res) ? res : (res.results || []);
    populateRegionFilter();
    applyFilters();
  } catch (err) {
    renderErrorState(tableEl, err.message || 'Failed to load farmers');
  }
}

function populateRegionFilter() {
  const select = document.getElementById('region-filter');
  const regions = [...new Set(state.data.map((f) => f.region || f.location || '').filter(Boolean))].sort();
  const current = select.value;
  select.innerHTML = '<option value="">All Regions</option>' + regions.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  select.value = current;
}

function applyFilters() {
  state.filtered = state.data.filter((f) => {
    const name = (f.name || f.farmer_name || f.username || '').toLowerCase();
    const phone = (f.phone || f.phone_number || '').toLowerCase();
    const region = (f.region || f.location || '').toLowerCase();
    const search = state.search.toLowerCase();
    const matchSearch = !search || name.includes(search) || phone.includes(search) || region.includes(search);
    const matchRegion = !state.region || (f.region || f.location) === state.region;
    const status = (f.status || 'active').toLowerCase();
    const matchStatus = !state.status || status === state.status;
    return matchSearch && matchRegion && matchStatus;
  });
  sortData();
  state.page = 1;
  renderTable();
}

function sortData() {
  const key = state.sortKey;
  state.filtered.sort((a, b) => {
    let va = a[key] || a[fieldAlias(key)] || '';
    let vb = b[key] || b[fieldAlias(key)] || '';
    if (typeof va === 'number' && typeof vb === 'number') return state.sortDir === 'asc' ? va - vb : vb - va;
    return state.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function fieldAlias(key) {
  const aliases = { name: 'farmer_name', phone: 'phone_number', region: 'location', farm_size: 'farm_size_acres' };
  return aliases[key] || key;
}

function renderTable() {
  const tableEl = document.getElementById('farmers-table');
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.perPage;
  const pageData = state.filtered.slice(start, start + state.perPage);

  if (!total) { renderEmptyState(tableEl, 'No farmers found', 'fa-tractor'); renderPagination(document.getElementById('pagination'), { currentPage: 1, totalPages: 1, totalCount: 0, onPage: () => {} }); return; }

  const sortIcon = (key) => state.sortKey === key ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
  tableEl.innerHTML = `<table>
    <thead><tr>
      <th data-sort="name">Farmer <i class="fa-solid ${sortIcon('name')}"></i></th>
      <th data-sort="phone">Contact <i class="fa-solid ${sortIcon('phone')}"></i></th>
      <th data-sort="region">Region <i class="fa-solid ${sortIcon('region')}"></i></th>
      <th data-sort="farm_size">Farm Size <i class="fa-solid ${sortIcon('farm_size')}"></i></th>
      <th data-sort="status">Status <i class="fa-solid ${sortIcon('status')}"></i></th>
      <th data-sort="created_at">Registered <i class="fa-solid ${sortIcon('created_at')}"></i></th>
      <th class="no-sort">Actions</th>
    </tr></thead>
    <tbody>${pageData.map((f) => {
      const name = f.name || f.farmer_name || f.username || 'Unknown';
      const phone = f.phone || f.phone_number || '—';
      const region = f.region || f.location || '—';
      const farmSize = f.farm_size || f.farm_size_acres || '—';
      const status = (f.status || 'active').toLowerCase();
      const statusBadge = status === 'active' ? '<span class="badge badge-success"><i class="fa-solid fa-circle"></i> Active</span>' : '<span class="badge badge-neutral"><i class="fa-solid fa-circle"></i> Inactive</span>';
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:10px"><span class="user-avatar" style="width:32px;height:32px;font-size:11px">${getInitials(name)}</span><span style="font-weight:500">${escapeHtml(name)}</span></div></td>
        <td>${escapeHtml(phone)}</td>
        <td>${escapeHtml(region)}</td>
        <td>${farmSize !== '—' ? farmSize + ' ac' : '—'}</td>
        <td>${statusBadge}</td>
        <td>${formatDate(f.created_at || f.date_joined)}</td>
        <td><div class="table-actions">
          <button class="action-btn view" data-view="${f.id}" aria-label="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn edit" data-edit="${f.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-delete="${f.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;

  renderPagination(document.getElementById('pagination'), { currentPage: state.page, totalPages, totalCount: total, onPage: (p) => { state.page = p; renderTable(); } });
  bindRowEvents();
  bindSortEvents();
}

function bindRowEvents() {
  document.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => viewFarmer(btn.dataset.view)));
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editFarmer(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteFarmer(btn.dataset.delete)));
}

function bindSortEvents() {
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      sortData(); renderTable();
    });
  });
}

function viewFarmer(id) {
  const f = state.data.find((x) => String(x.id) === String(id));
  if (!f) return;
  const name = f.name || f.farmer_name || f.username || 'Unknown';
  const body = document.getElementById('farmer-profile-body');
  body.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${getInitials(name)}</div>
      <div><div class="profile-name">${escapeHtml(name)}</div>
      <div class="profile-meta">
        <span><i class="fa-solid fa-phone"></i> ${escapeHtml(f.phone || f.phone_number || '—')}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(f.region || f.location || '—')}</span>
        <span><i class="fa-solid fa-calendar"></i> Joined ${formatDate(f.created_at || f.date_joined)}</span>
      </div></div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(f.email || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${escapeHtml(f.phone || f.phone_number || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Region</span><span class="detail-value">${escapeHtml(f.region || f.location || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Farm Size</span><span class="detail-value">${f.farm_size || f.farm_size_acres || '—'} ${f.farm_size ? 'acres' : ''}</span></div>
      <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${(f.status || 'active') === 'active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>'}</span></div>
      <div class="detail-item"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(f.address || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Registered</span><span class="detail-value">${formatDate(f.created_at || f.date_joined)}</span></div>
      <div class="detail-item"><span class="detail-label">Farmer ID</span><span class="detail-value">#${f.id}</span></div>
    </div>`;
  openModal('farmer-profile-modal');
}

function editFarmer(id) {
  const f = state.data.find((x) => String(x.id) === String(id));
  if (!f) return;
  document.getElementById('farmer-modal-title').textContent = 'Edit Farmer';
  document.getElementById('farmer-id').value = f.id;
  document.getElementById('farmer-name').value = f.name || f.farmer_name || '';
  document.getElementById('farmer-phone').value = f.phone || f.phone_number || '';
  document.getElementById('farmer-email').value = f.email || '';
  document.getElementById('farmer-region').value = f.region || f.location || '';
  document.getElementById('farmer-farm-size').value = f.farm_size || f.farm_size_acres || '';
  document.getElementById('farmer-status').value = (f.status || 'active').toLowerCase();
  document.getElementById('farmer-address').value = f.address || '';
  openModal('farmer-modal');
}

function openAddModal() {
  document.getElementById('farmer-modal-title').textContent = 'Add Farmer';
  document.getElementById('farmer-form').reset();
  document.getElementById('farmer-id').value = '';
  openModal('farmer-modal');
}

async function deleteFarmer(id) {
  const f = state.data.find((x) => String(x.id) === String(id));
  const name = f ? (f.name || f.farmer_name || 'this farmer') : 'this farmer';
  const confirmed = await confirmDialog({ title: 'Delete Farmer', message: `Are you sure you want to delete "${name}"? This action cannot be undone.`, confirmText: 'Delete', danger: true });
  if (!confirmed) return;
  try {
    await Api.delete(`/farmers/${id}/`);
    Toast.success('Farmer deleted successfully.');
    loadFarmers();
  } catch (err) { Toast.error(err.message || 'Failed to delete farmer.'); }
}

// Form submission
document.getElementById('farmer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('farmer-id').value;
  const payload = {
    name: document.getElementById('farmer-name').value.trim(),
    phone: document.getElementById('farmer-phone').value.trim(),
    email: document.getElementById('farmer-email').value.trim() || null,
    region: document.getElementById('farmer-region').value.trim(),
    farm_size: parseFloat(document.getElementById('farmer-farm-size').value) || null,
    status: document.getElementById('farmer-status').value,
    address: document.getElementById('farmer-address').value.trim() || null,
  };
  const btn = document.getElementById('farmer-save-btn');
  btn.disabled = true;
  try {
    if (id) { await Api.put(`/farmers/${id}/`, payload); Toast.success('Farmer updated successfully.'); }
    else { await Api.post('/farmers/', payload); Toast.success('Farmer added successfully.'); }
    closeModal('farmer-modal');
    loadFarmers();
  } catch (err) { Toast.error(err.message || 'Failed to save farmer.'); }
  finally { btn.disabled = false; }
});

// Filters
document.getElementById('search-input').addEventListener('input', debounce((e) => { state.search = e.target.value; applyFilters(); }, 300));
document.getElementById('region-filter').addEventListener('change', (e) => { state.region = e.target.value; applyFilters(); });
document.getElementById('status-filter').addEventListener('change', (e) => { state.status = e.target.value; applyFilters(); });
document.getElementById('clear-filters').addEventListener('click', () => {
  state.search = ''; state.region = ''; state.status = '';
  document.getElementById('search-input').value = '';
  document.getElementById('region-filter').value = '';
  document.getElementById('status-filter').value = '';
  applyFilters();
});
document.getElementById('add-farmer-btn').addEventListener('click', openAddModal);
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));

// Global search hook
window.onGlobalSearch = (val) => { state.search = val; document.getElementById('search-input').value = val; applyFilters(); };

loadFarmers();
