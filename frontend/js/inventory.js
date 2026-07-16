// inventory.js — Inventory module: CRUD, stock alerts, low stock indicators, stats
import { Api } from './api.js';
import { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatWeight, formatCurrency, formatDate, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton } from './utils.js';

const state = { data: [], filtered: [], page: 1, perPage: 10, sortKey: 'name', sortDir: 'asc', search: '', type: '', stock: '' };

async function loadInventory() {
  const tableEl = document.getElementById('inventory-table');
  renderSkeleton(tableEl, 6, 6);
  try {
    const res = await Api.get('/inventory/');
    state.data = Array.isArray(res) ? res : (res.results || []);
    populateTypeFilter();
    applyFilters();
    renderStats();
  } catch (err) { renderErrorState(tableEl, err.message || 'Failed to load inventory'); }
}

function getQty(item) { return Number(item.quantity || item.stock_level || item.current_stock || 0); }
function getReorder(item) { return Number(item.reorder_level || item.min_stock || item.threshold || 10); }
function getName(item) { return item.seaweed_type || item.name || item.item_name || 'Unknown'; }
function isLow(item) { return getQty(item) <= getReorder(item) && getQty(item) > 0; }
function isOut(item) { return getQty(item) <= 0; }

function renderStats() {
  const total = state.data.length;
  const totalQty = state.data.reduce((s, i) => s + getQty(i), 0);
  const lowCount = state.data.filter(isLow).length;
  const outCount = state.data.filter(isOut).length;
  const container = document.getElementById('inv-stats');
  container.innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></div></div><div class="stat-value">${total}</div><div class="stat-label">Total Items</div></div>
    <div class="stat-card secondary"><div class="stat-card-header"><div class="stat-icon secondary"><i class="fa-solid fa-weight-hanging"></i></div></div><div class="stat-value">${formatWeight(totalQty)}</div><div class="stat-label">Total Stock</div></div>
    <div class="stat-card warning"><div class="stat-card-header"><div class="stat-icon warning"><i class="fa-solid fa-triangle-exclamation"></i></div></div><div class="stat-value">${lowCount}</div><div class="stat-label">Low Stock</div></div>
    <div class="stat-card-error"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-circle-xmark"></i></div></div><div class="stat-value">${outCount}</div><div class="stat-label">Out of Stock</div></div>`;
  const strip = document.getElementById('low-stock-strip');
  if (lowCount + outCount > 0) { document.getElementById('low-stock-count').textContent = lowCount + outCount; strip.classList.remove('hidden'); }
}

function populateTypeFilter() {
  const select = document.getElementById('type-filter');
  const types = [...new Set(state.data.map(getName).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All Types</option>' + types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function applyFilters() {
  state.filtered = state.data.filter((item) => {
    const name = getName(item).toLowerCase();
    const matchSearch = !state.search || name.includes(state.search.toLowerCase());
    const matchType = !state.type || getName(item) === state.type;
    let matchStock = true;
    if (state.stock === 'low') matchStock = isLow(item);
    else if (state.stock === 'out') matchStock = isOut(item);
    else if (state.stock === 'in') matchStock = !isLow(item) && !isOut(item);
    return matchSearch && matchType && matchStock;
  });
  sortData(); state.page = 1; renderTable();
}

function sortData() {
  state.filtered.sort((a, b) => {
    let va, vb;
    if (state.sortKey === 'quantity') { va = getQty(a); vb = getQty(b); return state.sortDir === 'asc' ? va - vb : vb - va; }
    va = a[state.sortKey] || ''; vb = b[state.sortKey] || '';
    return state.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function renderTable() {
  const tableEl = document.getElementById('inventory-table');
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.perPage;
  const pageData = state.filtered.slice(start, start + state.perPage);

  if (!total) { renderEmptyState(tableEl, 'No inventory items found', 'fa-box-open'); renderPagination(document.getElementById('pagination'), { currentPage: 1, totalPages: 1, totalCount: 0, onPage: () => {} }); return; }

  const sortIcon = (key) => state.sortKey === key ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
  tableEl.innerHTML = `<table>
    <thead><tr>
      <th data-sort="name">Item <i class="fa-solid ${sortIcon('name')}"></i></th>
      <th data-sort="quantity">Quantity <i class="fa-solid ${sortIcon('quantity')}"></i></th>
      <th data-sort="reorder_level">Reorder Level <i class="fa-solid ${sortIcon('reorder_level')}"></i></th>
      <th>Unit Price</th>
      <th>Location</th>
      <th>Status</th>
      <th data-sort="updated_at">Updated <i class="fa-solid ${sortIcon('updated_at')}"></i></th>
      <th class="no-sort">Actions</th>
    </tr></thead>
    <tbody>${pageData.map((item) => {
      const qty = getQty(item); const reorder = getReorder(item);
      const status = isOut(item) ? '<span class="badge badge-error">Out of Stock</span>' : isLow(item) ? '<span class="badge badge-warning">Low Stock</span>' : '<span class="badge badge-success">In Stock</span>';
      const rowClass = isOut(item) ? 'style="background:rgba(239,68,68,0.03)"' : isLow(item) ? 'style="background:rgba(245,158,11,0.03)"' : '';
      return `<tr ${rowClass}>
        <td style="font-weight:500">${escapeHtml(getName(item))}</td>
        <td>${formatWeight(qty)}</td>
        <td>${formatWeight(reorder)}</td>
        <td>${item.unit_price || item.price ? formatCurrency(item.unit_price || item.price) : '—'}</td>
        <td>${escapeHtml(item.location || item.storage_location || '—')}</td>
        <td>${status}</td>
        <td>${formatDate(item.updated_at || item.created_at)}</td>
        <td><div class="table-actions">
          <button class="action-btn edit" data-edit="${item.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-delete="${item.id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;

  renderPagination(document.getElementById('pagination'), { currentPage: state.page, totalPages, totalCount: total, onPage: (p) => { state.page = p; renderTable(); } });
  bindRowEvents(); bindSortEvents();
}

function bindRowEvents() {
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editItem(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteItem(btn.dataset.delete)));
}
function bindSortEvents() {
  document.querySelectorAll('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else { state.sortKey = key; state.sortDir = 'asc'; }
    sortData(); renderTable();
  }));
}

function editItem(id) {
  const item = state.data.find((x) => String(x.id) === String(id));
  if (!item) return;
  document.getElementById('inv-modal-title').textContent = 'Edit Inventory';
  document.getElementById('inv-id').value = item.id;
  document.getElementById('inv-name').value = getName(item);
  document.getElementById('inv-quantity').value = getQty(item);
  document.getElementById('inv-reorder').value = getReorder(item);
  document.getElementById('inv-unit-price').value = item.unit_price || item.price || '';
  document.getElementById('inv-location').value = item.location || item.storage_location || '';
  document.getElementById('inv-batch').value = item.batch_number || item.batch || '';
  document.getElementById('inv-notes').value = item.notes || '';
  openModal('inventory-modal');
}

function openAddModal() {
  document.getElementById('inv-modal-title').textContent = 'Add Inventory';
  document.getElementById('inventory-form').reset();
  document.getElementById('inv-id').value = '';
  document.getElementById('inv-reorder').value = '10';
  openModal('inventory-modal');
}

async function deleteItem(id) {
  const item = state.data.find((x) => String(x.id) === String(id));
  const confirmed = await confirmDialog({ title: 'Delete Inventory Item', message: `Delete "${getName(item)}"? This cannot be undone.`, confirmText: 'Delete', danger: true });
  if (!confirmed) return;
  try { await Api.delete(`/inventory/${id}/`); Toast.success('Item deleted.'); loadInventory(); }
  catch (err) { Toast.error(err.message || 'Failed to delete item.'); }
}

document.getElementById('inventory-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('inv-id').value;
  const payload = {
    name: document.getElementById('inv-name').value.trim(),
    quantity: parseFloat(document.getElementById('inv-quantity').value),
    reorder_level: parseFloat(document.getElementById('inv-reorder').value) || 10,
    unit_price: parseFloat(document.getElementById('inv-unit-price').value) || null,
    location: document.getElementById('inv-location').value.trim() || null,
    batch_number: document.getElementById('inv-batch').value.trim() || null,
    notes: document.getElementById('inv-notes').value.trim() || null,
  };
  const btn = document.getElementById('inv-save-btn'); btn.disabled = true;
  try {
    if (id) { await Api.put(`/inventory/${id}/`, payload); Toast.success('Inventory updated.'); }
    else { await Api.post('/inventory/', payload); Toast.success('Inventory added.'); }
    closeModal('inventory-modal'); loadInventory();
  } catch (err) { Toast.error(err.message || 'Failed to save inventory.'); }
  finally { btn.disabled = false; }
});

document.getElementById('search-input').addEventListener('input', debounce((e) => { state.search = e.target.value; applyFilters(); }, 300));
document.getElementById('type-filter').addEventListener('change', (e) => { state.type = e.target.value; applyFilters(); });
document.getElementById('stock-filter').addEventListener('change', (e) => { state.stock = e.target.value; applyFilters(); });
document.getElementById('clear-filters').addEventListener('click', () => {
  state.search = ''; state.type = ''; state.stock = '';
  document.getElementById('search-input').value = ''; document.getElementById('type-filter').value = ''; document.getElementById('stock-filter').value = '';
  applyFilters();
});
document.getElementById('add-inventory-btn').addEventListener('click', openAddModal);
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
window.onGlobalSearch = (val) => { state.search = val; document.getElementById('search-input').value = val; applyFilters(); };

loadInventory();
