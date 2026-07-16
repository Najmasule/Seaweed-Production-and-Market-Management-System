// admin-users.js — User management module (admin only).
// CRUD for system accounts with validation, password strength meter, RBAC enforcement.
import { Api, Auth } from './api.js';
import { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatDate, formatDateTime, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton, getInitials, isValidEmail, isValidUsername, isValidPassword, passwordStrength, setFieldError, clearFieldError, roleLabel, roleBadgeClass } from './utils.js';

// --- RBAC gate: redirect non-admins immediately ---
if (!Auth.requireRole('admin')) {
  // Redirect already triggered; rest of script is inert.
} else {

const state = { data: [], filtered: [], page: 1, perPage: 10, sortKey: 'username', sortDir: 'asc', search: '', role: '', status: '' };

async function loadUsers() {
  const tableEl = document.getElementById('users-table');
  renderSkeleton(tableEl, 6, 6);
  try {
    const res = await Api.listUsers();
    state.data = Array.isArray(res) ? res : (res.results || []);
    applyFilters();
    renderStats();
  } catch (err) {
    renderErrorState(tableEl, err.message || 'Failed to load users');
  }
}

function renderStats() {
  const total = state.data.length;
  const admins = state.data.filter((u) => u.role === 'admin').length;
  const managers = state.data.filter((u) => u.role === 'manager').length;
  const staff = state.data.filter((u) => u.role === 'staff').length;
  document.getElementById('user-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-users"></i></div></div><div class="stat-value">${total}</div><div class="stat-label">Total Users</div></div>
    <div class="stat-card-error"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-user-shield"></i></div></div><div class="stat-value">${admins}</div><div class="stat-label">Administrators</div></div>
    <div class="stat-card info"><div class="stat-card-header"><div class="stat-icon info"><i class="fa-solid fa-user-tie"></i></div></div><div class="stat-value">${managers}</div><div class="stat-label">Managers</div></div>
    <div class="stat-card secondary"><div class="stat-card-header"><div class="stat-icon secondary"><i class="fa-solid fa-user"></i></div></div><div class="stat-value">${staff}</div><div class="stat-label">Staff</div></div>`;
}

function applyFilters() {
  state.filtered = state.data.filter((u) => {
    const name = (u.full_name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q = state.search.toLowerCase();
    const matchSearch = !q || name.includes(q) || username.includes(q) || email.includes(q);
    const matchRole = !state.role || u.role === state.role;
    const matchStatus = !state.status || (u.status || 'active') === state.status;
    return matchSearch && matchRole && matchStatus;
  });
  sortData();
  state.page = 1;
  renderTable();
}

function sortData() {
  state.filtered.sort((a, b) => {
    let va = a[state.sortKey] || '', vb = b[state.sortKey] || '';
    return state.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
}

function renderTable() {
  const tableEl = document.getElementById('users-table');
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.perPage;
  const pageData = state.filtered.slice(start, start + state.perPage);

  if (!total) { renderEmptyState(tableEl, 'No users found', 'fa-users'); renderPagination(document.getElementById('pagination'), { currentPage: 1, totalPages: 1, totalCount: 0, onPage: () => {} }); return; }

  const sortIcon = (key) => state.sortKey === key ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort';
  const currentUser = Api.getCurrentUser();
  tableEl.innerHTML = `<table>
    <thead><tr>
      <th data-sort="username">Username <i class="fa-solid ${sortIcon('username')}"></i></th>
      <th data-sort="full_name">Full Name <i class="fa-solid ${sortIcon('full_name')}"></i></th>
      <th data-sort="email">Email <i class="fa-solid ${sortIcon('email')}"></i></th>
      <th data-sort="role">Role <i class="fa-solid ${sortIcon('role')}"></i></th>
      <th data-sort="status">Status <i class="fa-solid ${sortIcon('status')}"></i></th>
      <th data-sort="created_at">Created <i class="fa-solid ${sortIcon('created_at')}"></i></th>
      <th class="no-sort">Actions</th>
    </tr></thead>
    <tbody>${pageData.map((u) => {
      const name = u.full_name || u.username;
      const statusBadge = (u.status || 'active') === 'active'
        ? '<span class="badge badge-success"><i class="fa-solid fa-circle"></i> Active</span>'
        : '<span class="badge badge-neutral"><i class="fa-solid fa-circle"></i> Inactive</span>';
      const isSelf = currentUser && String(currentUser.id) === String(u.id);
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:10px"><span class="user-avatar" style="width:32px;height:32px;font-size:11px">${getInitials(name)}</span><span style="font-weight:500">${escapeHtml(u.username)}</span>${isSelf ? '<span class="badge badge-info" style="font-size:10px">You</span>' : ''}</div></td>
        <td>${escapeHtml(u.full_name || '—')}</td>
        <td>${escapeHtml(u.email || '—')}</td>
        <td><span class="badge ${roleBadgeClass(u.role)}">${escapeHtml(roleLabel(u.role))}</span></td>
        <td>${statusBadge}</td>
        <td>${formatDate(u.created_at)}</td>
        <td><div class="table-actions">
          <button class="action-btn view" data-view="${u.id}" aria-label="View"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn edit" data-edit="${u.id}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" data-delete="${u.id}" aria-label="Delete" ${isSelf ? 'disabled title="You cannot delete your own account"' : ''}><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table>`;

  renderPagination(document.getElementById('pagination'), { currentPage: state.page, totalPages, totalCount: total, onPage: (p) => { state.page = p; renderTable(); } });
  bindRowEvents();
  bindSortEvents();
}

function bindRowEvents() {
  document.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => viewUser(btn.dataset.view)));
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editUser(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteUser(btn.dataset.delete)));
}
function bindSortEvents() {
  document.querySelectorAll('th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else { state.sortKey = key; state.sortDir = 'asc'; }
    sortData(); renderTable();
  }));
}

function viewUser(id) {
  const u = state.data.find((x) => String(x.id) === String(id));
  if (!u) return;
  const body = document.getElementById('user-view-body');
  body.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${getInitials(u.full_name || u.username)}</div>
      <div>
        <div class="profile-name">${escapeHtml(u.full_name || u.username)}</div>
        <div class="profile-meta">
          <span><i class="fa-solid fa-at"></i> ${escapeHtml(u.username)}</span>
          <span><i class="fa-solid fa-envelope"></i> ${escapeHtml(u.email || '—')}</span>
          <span><i class="fa-solid fa-calendar"></i> Created ${formatDateTime(u.created_at)}</span>
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">Username</span><span class="detail-value">${escapeHtml(u.username)}</span></div>
      <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">${escapeHtml(u.full_name || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(u.email || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Role</span><span class="detail-value"><span class="badge ${roleBadgeClass(u.role)}">${escapeHtml(roleLabel(u.role))}</span></span></div>
      <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${(u.status || 'active') === 'active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-neutral">Inactive</span>'}</span></div>
      <div class="detail-item"><span class="detail-label">User ID</span><span class="detail-value">#${u.id}</span></div>
      <div class="detail-item"><span class="detail-label">Created</span><span class="detail-value">${formatDateTime(u.created_at)}</span></div>
    </div>`;
  openModal('user-view-modal');
}

function editUser(id) {
  const u = state.data.find((x) => String(x.id) === String(id));
  if (!u) return;
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('user-id').value = u.id;
  document.getElementById('user-username').value = u.username || '';
  document.getElementById('user-email').value = u.email || '';
  document.getElementById('user-fullname').value = u.full_name || '';
  document.getElementById('user-role').value = u.role || 'staff';
  document.getElementById('user-status').value = u.status || 'active';
  // Password optional on edit
  const pwField = document.getElementById('user-password');
  pwField.value = '';
  pwField.required = false;
  pwField.placeholder = 'Leave blank to keep current password';
  updatePwStrength('');
  clearAllErrors();
  openModal('user-modal');
}

function openAddModal() {
  document.getElementById('user-modal-title').textContent = 'Add System User';
  document.getElementById('user-form').reset();
  document.getElementById('user-id').value = '';
  const pwField = document.getElementById('user-password');
  pwField.required = true;
  pwField.placeholder = '';
  updatePwStrength('');
  clearAllErrors();
  openModal('user-modal');
}

async function deleteUser(id) {
  const u = state.data.find((x) => String(x.id) === String(id));
  if (!u) return;
  const currentUser = Api.getCurrentUser();
  if (currentUser && String(currentUser.id) === String(id)) {
    Toast.warning('You cannot delete your own account.');
    return;
  }
  const confirmed = await confirmDialog({
    title: 'Delete User',
    message: `Delete "${u.username}" (${u.full_name || '—'})? This action cannot be undone and the user will immediately lose access.`,
    confirmText: 'Delete',
    danger: true,
  });
  if (!confirmed) return;
  try {
    await Api.deleteUser(id);
    Toast.success('User deleted successfully.');
    loadUsers();
  } catch (err) { Toast.error(err.message || 'Failed to delete user.'); }
}

// --- Validation ---
function validateForm() {
  clearAllErrors();
  let valid = true;
  const id = document.getElementById('user-id').value;
  const username = document.getElementById('user-username').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const fullName = document.getElementById('user-fullname').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;

  if (!username) { setFieldError(document.getElementById('user-username'), 'Username is required.'); valid = false; }
  else if (!isValidUsername(username)) { setFieldError(document.getElementById('user-username'), 'Username must be 3–30 characters: letters, numbers, dot, dash, underscore.'); valid = false; }
  else {
    // Check uniqueness against local cache (mock mode). Backend will enforce too.
    const dup = state.data.find((u) => u.username.toLowerCase() === username.toLowerCase() && String(u.id) !== String(id));
    if (dup) { setFieldError(document.getElementById('user-username'), 'This username is already taken.'); valid = false; }
  }

  if (!email) { setFieldError(document.getElementById('user-email'), 'Email is required.'); valid = false; }
  else if (!isValidEmail(email)) { setFieldError(document.getElementById('user-email'), 'Please enter a valid email address.'); valid = false; }
  else {
    const dup = state.data.find((u) => (u.email || '').toLowerCase() === email.toLowerCase() && String(u.id) !== String(id));
    if (dup) { setFieldError(document.getElementById('user-email'), 'This email is already registered.'); valid = false; }
  }

  if (!fullName) { setFieldError(document.getElementById('user-fullname'), 'Full name is required.'); valid = false; }

  if (!id) {
    // Create mode: password required
    if (!password) { setFieldError(document.getElementById('user-password'), 'Password is required.'); valid = false; }
    else if (!isValidPassword(password)) { setFieldError(document.getElementById('user-password'), 'Password must be at least 8 characters.'); valid = false; }
  } else {
    // Edit mode: password optional, but if provided must be valid
    if (password && !isValidPassword(password)) { setFieldError(document.getElementById('user-password'), 'Password must be at least 8 characters.'); valid = false; }
  }

  if (!role) { setFieldError(document.getElementById('user-role'), 'Please select a role.'); valid = false; }
  return valid;
}

function clearAllErrors() {
  document.querySelectorAll('.input-error').forEach((el) => clearFieldError(el));
}

// --- Password strength meter ---
function updatePwStrength(value) {
  const s = passwordStrength(value);
  const meter = document.getElementById('pw-strength');
  meter.className = 'pw-strength ' + s.className;
  meter.querySelector('.pw-strength-label').textContent = value ? s.label : 'Enter a password';
  meter.querySelector('.pw-strength-tips').textContent = value ? s.tips : '';
}

document.getElementById('user-password').addEventListener('input', (e) => updatePwStrength(e.target.value));
document.getElementById('pw-toggle').addEventListener('click', () => {
  const input = document.getElementById('user-password');
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';
  document.getElementById('pw-toggle').innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
});

// Clear individual field errors on input
['user-username', 'user-email', 'user-fullname', 'user-password'].forEach((id) => {
  document.getElementById(id).addEventListener('input', (e) => clearFieldError(e.target));
});

// --- Form submission ---
document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) { Toast.error('Please fix the highlighted fields.'); return; }
  const id = document.getElementById('user-id').value;
  const payload = {
    username: document.getElementById('user-username').value.trim(),
    email: document.getElementById('user-email').value.trim(),
    full_name: document.getElementById('user-fullname').value.trim(),
    role: document.getElementById('user-role').value,
    status: document.getElementById('user-status').value,
  };
  const password = document.getElementById('user-password').value;
  if (password) payload.password = password;

  const btn = document.getElementById('user-save-btn');
  btn.disabled = true;
  try {
    if (id) {
      await Api.updateUser(id, payload);
      Toast.success('User updated successfully.');
    } else {
      await Api.createUser(payload);
      Toast.success('User created successfully. They can now sign in with their credentials.');
    }
    closeModal('user-modal');
    loadUsers();
  } catch (err) {
    Toast.error(err.message || 'Failed to save user.');
  } finally {
    btn.disabled = false;
  }
});

// --- Filters ---
document.getElementById('search-input').addEventListener('input', debounce((e) => { state.search = e.target.value; applyFilters(); }, 300));
document.getElementById('role-filter').addEventListener('change', (e) => { state.role = e.target.value; applyFilters(); });
document.getElementById('status-filter').addEventListener('change', (e) => { state.status = e.target.value; applyFilters(); });
document.getElementById('clear-filters').addEventListener('click', () => {
  state.search = ''; state.role = ''; state.status = '';
  document.getElementById('search-input').value = '';
  document.getElementById('role-filter').value = '';
  document.getElementById('status-filter').value = '';
  applyFilters();
});
document.getElementById('add-user-btn').addEventListener('click', openAddModal);
document.getElementById('refresh-btn').addEventListener('click', () => { Toast.info('Refreshing users…'); loadUsers(); });
document.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
window.onGlobalSearch = (val) => { state.search = val; document.getElementById('search-input').value = val; applyFilters(); };

loadUsers();

} // end RBAC gate
