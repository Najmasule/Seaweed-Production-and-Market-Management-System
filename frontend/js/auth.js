// auth.js — Authentication state management and route protection.
// Imported on every authenticated page; renders the sidebar, navbar, footer,
// and enforces role-based access control (RBAC) for navigation links.

import { Api, Auth } from './api.js';
import { Toast, escapeHtml, getInitials, roleLabel } from './utils.js';

// --- Navigation catalog with role permissions ---
// Each item declares which roles may see it. Admin sees everything.
const NAV_ITEMS = [
  { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard', href: 'dashboard.html', roles: ['admin', 'manager', 'staff'] },
  { id: 'farmers', icon: 'fa-tractor', label: 'Farmers', href: 'farmers.html', roles: ['admin', 'manager', 'staff'] },
  { id: 'production', icon: 'fa-seedling', label: 'Production', href: 'production.html', roles: ['admin', 'manager', 'staff'] },
  { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventory', href: 'inventory.html', roles: ['admin', 'manager', 'staff'] },
  { id: 'market', icon: 'fa-store', label: 'Market', href: 'market.html', roles: ['admin', 'manager', 'staff'] },
  { id: 'traders', icon: 'fa-handshake', label: 'Traders', href: 'traders.html', roles: ['admin', 'manager', 'staff'] },
  // Admin-only section
  { id: 'reports', icon: 'fa-chart-pie', label: 'Reports', href: 'reports.html', roles: ['admin', 'manager'], section: 'admin' },
  { id: 'admin-users', icon: 'fa-users-gear', label: 'User Management', href: 'admin-users.html', roles: ['admin'], section: 'admin' },
];

function canSee(item, role) {
  return item.roles.map((r) => r.toLowerCase()).includes(role.toLowerCase());
}

// --- Layout injection: sidebar, navbar, footer ---
async function injectLayout() {
  const activePage = (window.location.pathname.split('/').pop() || 'dashboard.html').replace('.html', '');
  const role = Api.getRole();

  const visibleItems = NAV_ITEMS.filter((item) => canSee(item, role));
  const operationalItems = visibleItems.filter((i) => !i.section);
  const adminItems = visibleItems.filter((i) => i.section === 'admin');

  const renderNav = (items) => items.map((item) => `
    <a href="${item.href}" class="nav-item ${item.id === activePage ? 'active' : ''}" aria-label="${item.label}" data-nav="${item.id}">
      <i class="fa-solid ${item.icon}"></i><span class="nav-label">${item.label}</span>
    </a>`).join('');

  let navHtml = renderNav(operationalItems);
  if (adminItems.length) {
    navHtml += `<div class="nav-section-label">Administration</div>` + renderNav(adminItems);
  }

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="fa-solid fa-water"></i>
        <span class="logo-text">Seaweed<span class="logo-accent">MS</span></span>
      </div>
      <button class="sidebar-close" id="sidebar-close" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <nav class="sidebar-nav" aria-label="Main navigation">${navHtml}</nav>
    <div class="sidebar-footer">
      <div class="sidebar-version">v1.0.0 · ${escapeHtml(roleLabel(role))}</div>
    </div>`;
  document.body.insertBefore(sidebar, document.body.firstChild);

  // Navbar
  const navbar = document.createElement('header');
  navbar.className = 'navbar';
  navbar.innerHTML = `
    <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu"><i class="fa-solid fa-bars"></i></button>
    <div class="navbar-search">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" id="global-search" placeholder="Quick search..." aria-label="Global search" />
    </div>
    <div class="navbar-actions">
      <button class="icon-btn" id="notif-btn" aria-label="Notifications"><i class="fa-solid fa-bell"></i><span class="notif-dot"></span></button>
      <div class="user-menu" id="user-menu">
        <button class="user-trigger" id="user-trigger" aria-label="User menu" aria-haspopup="true" aria-expanded="false">
          <span class="user-avatar" id="user-avatar">U</span>
          <span class="user-info"><span class="user-name" id="user-name">Loading…</span><span class="user-role" id="user-role-text">—</span></span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="user-dropdown" id="user-dropdown" role="menu">
          <button class="dropdown-item" data-action="profile" role="menuitem"><i class="fa-solid fa-user"></i> My Profile</button>
          ${Api.isAdmin() ? '<button class="dropdown-item" data-action="admin" role="menuitem"><i class="fa-solid fa-users-gear"></i> User Management</button>' : ''}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item danger" data-action="logout" role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
        </div>
      </div>
    </div>`;
  document.body.insertBefore(navbar, document.body.firstChild);

  // Main wrapper for content
  const content = document.querySelector('#app, .app-content');
  if (content) content.classList.add('main-content');

  // Footer
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `<span>&copy; 2025 Seaweed Management System</span><span class="footer-divider">·</span><span>Built for sustainable aquaculture</span>`;
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.appendChild(footer);

  // Overlay for mobile sidebar
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  bindLayoutEvents();
  loadUserInfo();
}

function bindLayoutEvents() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuToggle = document.getElementById('menu-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const userTrigger = document.getElementById('user-trigger');
  const userDropdown = document.getElementById('user-dropdown');

  const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('show'); document.body.style.overflow = 'hidden'; };
  const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); document.body.style.overflow = ''; };

  menuToggle?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  userTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = userTrigger.getAttribute('aria-expanded') === 'true';
    userTrigger.setAttribute('aria-expanded', !expanded);
    userDropdown.classList.toggle('show');
  });
  document.addEventListener('click', () => { userDropdown?.classList.remove('show'); userTrigger?.setAttribute('aria-expanded', 'false'); });

  userDropdown?.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'logout') Auth.logout();
    if (action === 'profile') Toast.info('Profile page coming soon.');
    if (action === 'admin') window.location.href = './admin-users.html';
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

  // Global search (hooks into page-specific handler if present)
  const search = document.getElementById('global-search');
  search?.addEventListener('input', (e) => {
    if (window.onGlobalSearch) window.onGlobalSearch(e.target.value);
  });
}

async function loadUserInfo() {
  const nameEl = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');
  const roleEl = document.getElementById('user-role-text');
  // Prefer cached user (set at login) for instant display.
  let user = Api.getCurrentUser();
  if (!user) {
    try { user = await Api.getUser(); Api.setCurrentUser(user); } catch (err) { /* token may be invalid */ }
  }
  if (user) {
    const name = user.full_name || user.name || user.username || 'User';
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = getInitials(name);
    if (roleEl) roleEl.textContent = roleLabel(user.role);
  }
}

// --- Init on page load ---
function initAuth() {
  Auth.redirectIfNotAuthenticated();
  injectLayout();
}

document.addEventListener('DOMContentLoaded', initAuth);

export { initAuth, injectLayout, Auth, NAV_ITEMS };
