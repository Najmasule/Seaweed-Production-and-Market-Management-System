// utils.js — Shared utilities for UI helpers: toast, confirm dialog, spinner, formatting, debounce, pagination

// --- Toast notifications ---
const Toast = {
  container: null,
  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', duration = 4000) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(msg, d) { this.show(msg, 'success', d); },
  error(msg, d) { this.show(msg, 'error', d || 6000); },
  warning(msg, d) { this.show(msg, 'warning', d); },
  info(msg, d) { this.show(msg, 'info', d); },
};

// --- Confirmation dialog (promise-based) ---
function confirmDialog({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-icon ${danger ? 'danger' : ''}"><i class="fa-solid ${danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i></div>
        <h3 id="confirm-title">${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost" data-action="cancel">${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const close = (val) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 250);
      resolve(val);
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
      if (e.target.dataset.action === 'confirm') close(true);
      if (e.target.dataset.action === 'cancel') close(false);
    });
    overlay.querySelector('[data-action="confirm"]').focus();
    const escHandler = (e) => { if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  });
}

// --- Modal helpers ---
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const firstInput = modal.querySelector('input, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// --- HTML escape ---
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Formatting ---
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatCurrency(value) {
  const num = Number(value || 0);
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatWeight(value) {
  const num = Number(value || 0);
  return num.toLocaleString('en-US') + ' kg';
}
function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

// --- Debounce ---
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// --- Pagination renderer ---
function renderPagination(container, { currentPage, totalPages, totalCount, onPage }) {
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  const pages = [];
  const addPage = (p, label = p, active = false, disabled = false) => {
    pages.push(`<button class="page-btn ${active ? 'active' : ''}" ${disabled ? 'disabled' : ''} data-page="${p}" ${disabled ? 'aria-disabled="true"' : ''}>${label}</button>`);
  };
  addPage(currentPage - 1, '<i class="fa-solid fa-chevron-left"></i>', false, currentPage === 1);
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  if (start > 1) { addPage(1); if (start > 2) pages.push('<span class="page-ellipsis">…</span>'); }
  for (let p = start; p <= end; p++) addPage(p, p, p === currentPage);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('<span class="page-ellipsis">…</span>'); addPage(totalPages); }
  addPage(currentPage + 1, '<i class="fa-solid fa-chevron-right"></i>', false, currentPage === totalPages);
  container.innerHTML = `<div class="pagination-info">Showing page ${currentPage} of ${totalPages} (${formatNumber(totalCount)} records)</div><div class="pagination-controls">${pages.join('')}</div>`;
  container.querySelectorAll('.page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p && p !== currentPage) onPage(p);
    });
  });
}

// --- Empty state renderer ---
function renderEmptyState(container, message = 'No data available', icon = 'fa-inbox') {
  if (container) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid ${icon}"></i><p>${escapeHtml(message)}</p></div>`;
  }
}

// --- Error state renderer ---
function renderErrorState(container, message = 'Something went wrong') {
  if (container) {
    container.innerHTML = `<div class="error-state"><i class="fa-solid fa-circle-exclamation"></i><p>${escapeHtml(message)}</p><button class="btn btn-ghost" onclick="window.location.reload()">Retry</button></div>`;
  }
}

// --- Skeleton loader ---
function renderSkeleton(container, rows = 5, cols = 4) {
  if (!container) return;
  let html = '<div class="skeleton-table">';
  for (let r = 0; r < rows; r++) {
    html += '<div class="skeleton-row">';
    for (let c = 0; c < cols; c++) html += '<div class="skeleton-cell"></div>';
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

// --- Query string helper ---
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// --- Avatar initials ---
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// --- Validation helpers ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}
function isValidUsername(value) {
  return typeof value === 'string' && USERNAME_RE.test(value.trim());
}
// Returns { score: 0-4, label, className, tips }
function passwordStrength(value) {
  if (!value) return { score: 0, label: 'Empty', className: 'pw-0', tips: 'Enter a password' };
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const labels = [
    { label: 'Very Weak', className: 'pw-1' },
    { label: 'Weak', className: 'pw-2' },
    { label: 'Fair', className: 'pw-3' },
    { label: 'Strong', className: 'pw-4' },
    { label: 'Very Strong', className: 'pw-5' },
  ];
  const tips = [];
  if (value.length < 8) tips.push('Use at least 8 characters');
  if (!/[A-Z]/.test(value)) tips.push('Add an uppercase letter');
  if (!/[a-z]/.test(value)) tips.push('Add a lowercase letter');
  if (!/\d/.test(value)) tips.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(value)) tips.push('Add a symbol');
  return { score, ...labels[score], tips: tips.length ? tips.join(' · ') : 'Looks good' };
}
function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

// Mark a field invalid and show an inline error message.
function setFieldError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add('input-error');
  inputEl.setAttribute('aria-invalid', 'true');
  let hint = inputEl.parentElement.querySelector('.form-error');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'form-error';
    inputEl.parentElement.appendChild(hint);
  }
  hint.textContent = message;
}
function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('input-error');
  inputEl.removeAttribute('aria-invalid');
  const hint = inputEl.parentElement.querySelector('.form-error');
  if (hint) hint.remove();
}

// Role display helpers
const ROLE_LABELS = { admin: 'Administrator', manager: 'Manager', staff: 'Staff' };
const ROLE_BADGE_CLASS = { admin: 'badge-error', manager: 'badge-info', staff: 'badge-neutral' };
function roleLabel(role) { return ROLE_LABELS[role?.toLowerCase()] || 'Staff'; }
function roleBadgeClass(role) { return ROLE_BADGE_CLASS[role?.toLowerCase()] || 'badge-neutral'; }

window.Utils = { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatDate, formatDateTime, formatCurrency, formatWeight, formatNumber, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton, getQueryParam, getInitials, isValidEmail, isValidUsername, isValidPassword, passwordStrength, setFieldError, clearFieldError, roleLabel, roleBadgeClass };
export { Toast, confirmDialog, openModal, closeModal, escapeHtml, formatDate, formatDateTime, formatCurrency, formatWeight, formatNumber, debounce, renderPagination, renderEmptyState, renderErrorState, renderSkeleton, getQueryParam, getInitials, isValidEmail, isValidUsername, isValidPassword, passwordStrength, setFieldError, clearFieldError, roleLabel, roleBadgeClass };
