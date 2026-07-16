// api.js — Centralized API service for the Seaweed Management System.
// Uses Fetch API with JWT Bearer token handling, automatic token refresh,
// network-error recovery, and an in-memory mock backend for standalone operation.

import { Mock } from './mock.js';

// 1. ANWANI YA DJANGO BACKEND YAKO
const DEFAULT_API_URL = 'http://127.0.0.1:8000/api';

const API_BASE_URL = (() => {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  try {
    const env = import.meta.env;
    if (env && env.VITE_API_BASE_URL) return env.VITE_API_BASE_URL;
  } catch (e) {
    // Haileti error nje ya Vite/Bundlers
  }
  return DEFAULT_API_URL;
})();

// 2. KUZIMA / KUWASHA MOCK DATA
const USE_MOCK = false;

const TOKEN_KEY = 'seaweed_access_token';
const REFRESH_KEY = 'seaweed_refresh_token';
const USER_KEY = 'seaweed_current_user';

// --- Minimal JWT decoder ---
function decodeTokenPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(b64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

const Api = {
  baseUrl: API_BASE_URL,
  useMock: USE_MOCK,

  // --- Token management ---
  getAccessToken() { return localStorage.getItem(TOKEN_KEY); },
  getRefreshToken() { return localStorage.getItem(REFRESH_KEY); },
  setTokens(access, refresh) {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() { return !!this.getAccessToken(); },

  // --- Current user cache ---
  getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
  },
  setCurrentUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },

  getRole() {
    const u = this.getCurrentUser();
    if (u && u.role) return u.role;
    const payload = decodeTokenPayload(this.getAccessToken());
    return payload?.role || 'staff';
  },
  hasRole(...roles) {
    const r = this.getRole();
    return roles.map((x) => x.toLowerCase()).includes(r.toLowerCase());
  },
  isAdmin() { return this.getRole().toLowerCase() === 'admin'; },

  // --- Loading indicator ---
  _loadingCount: 0,
  _showLoading() {
    this._loadingCount++;
    const el = document.getElementById('global-loader');
    if (el) el.classList.add('active');
  },
  _hideLoading() {
    this._loadingCount = Math.max(0, this._loadingCount - 1);
    if (this._loadingCount === 0) {
      const el = document.getElementById('global-loader');
      if (el) el.classList.remove('active');
    }
  },

  // --- Core request wrapper ---
  async request(path, options = {}) {
    // 1. Prepare headers
    const headers = {
      ...(options.headers || {})
    };

    // 2. JSON body
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }

    // 3. JWT Authorization
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // --- Mock mode short-circuit ---
    if (this.useMock && Mock.isMockPath(path)) {
      const method = (options.method || 'GET').toUpperCase();
      const body = options.body && headers['Content-Type'] === 'application/json' ? JSON.parse(options.body) : options.body;
      try {
        this._showLoading();
        return await Mock.handle(method, path, body || {});
      } catch (err) {
        if (err.status === 401) {
          this.clearTokens();
          if (typeof Auth !== 'undefined' && Auth.redirectIfNotAuthenticated) Auth.redirectIfNotAuthenticated();
        }
        throw err;
      } finally {
        this._hideLoading();
      }
    }

    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    this._showLoading();

    try {
      // 4. Send fetch request
      let res = await fetch(url, {
        ...options,
        headers
      });

      if (res.status === 401 && !options._retried) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = this.getAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, { ...options, headers, _retried: true });
        }
      }
      return await this._handleResponse(res);
    } catch (err) {
      if (err.name === 'TypeError') {
        throw { message: 'Network error — please check your connection.', status: 0, networkError: true };
      }
      throw err;
    } finally {
      this._hideLoading();
    }
  },

  async _handleResponse(res) {
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else if (contentType.includes('text/')) {
      data = await res.text().catch(() => null);
    }

    if (!res.ok) {
      const message = (data && (data.detail || data.message || data.error)) || this._statusMessage(res.status);
      const error = { message, status: res.status, data };
      if (res.status === 401) {
        this.clearTokens();
        if (typeof Auth !== 'undefined' && Auth.redirectIfNotAuthenticated) Auth.redirectIfNotAuthenticated();
      }
      throw error;
    }
    return data;
  },

  _statusMessage(status) {
    const messages = {
      400: 'Bad request — the data you sent is invalid.',
      401: 'Unauthorized — please log in again.',
      403: 'Forbidden — you do not have permission for this action.',
      404: 'Not found — the requested resource does not exist.',
      405: 'Method not allowed.',
      409: 'Conflict — this item already exists.',
      429: 'Too many requests — please slow down.',
      500: 'Server error — something went wrong on our end.',
      502: 'Bad gateway — the server is unavailable.',
      503: 'Service unavailable — please try again later.',
    };
    return messages[status] || `Request failed (${status}).`;
  },

  // --- JWT Refresh Token Mechanism ---
  async refreshToken() {
    const refresh = this.getRefreshToken();

    if (!refresh) return false;
    if (this.useMock) return true;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh })
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const data = await res.json();

      if (data.access) {
        localStorage.setItem(TOKEN_KEY, data.access);
        return true;
      }
    } catch (e) {
      this.clearTokens();
    }
    return false;
  },

  // --- HTTP verb helpers ---
  get(path, params) {
    let url = path;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return this.request(url, { method: 'GET' });
  },
  post(path, body) { return this.request(path, { method: 'POST', body }); },
  put(path, body) { return this.request(path, { method: 'PUT', body }); },
  patch(path, body) { return this.request(path, { method: 'PATCH', body }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); },

  // --- Auth endpoints ---
  login(username, password) {
    return this.request("/auth/token/", {
      method: "POST",
      body: { username, password }
    });
  },
  logout() {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.request('/auth/token/logout/', { method: 'POST', body: { refresh } }).catch(() => { });
    }
    this.clearTokens();
  },
  getUser() { return this.get('/auth/me/'); },

  // --- User management (admin only) ---
  listUsers() { return this.get('/users/'); },
  createUser(payload) { return this.post('/users/', payload); },
  updateUser(id, payload) { return this.put(`/users/${id}/`, payload); },
  deleteUser(id) { return this.delete(`/users/${id}/`); },

  // --- Trader registration (public/standalone endpoint) ---
  registerTrader(payload) { return this.post('/traders/register/', payload); },
};

// Auth module — auth state, route protection, redirect
const Auth = {
  init() {
    const isLoginPage = window.location.pathname.includes('login.html') ||
      window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
    if (isLoginPage) {
      if (Api.isAuthenticated()) {
        window.location.href = './dashboard.html';
        return;
      }
    } else {
      this.redirectIfNotAuthenticated();
    }
  },
  redirectIfNotAuthenticated() {
    if (!Api.isAuthenticated()) {
      const current = window.location.pathname.split('/').pop() || 'dashboard.html';
      if (current !== 'login.html' && current !== 'index.html') {
        sessionStorage.setItem('redirect_after_login', current);
      }
      window.location.href = './login.html';
    }
  },
  async handleLogin(username, password) {
    const data = await Api.login(username, password);
    if (data.access) {
      Api.setTokens(data.access, data.refresh);
      if (data.user) Api.setCurrentUser(data.user);
      const redirect = sessionStorage.getItem('redirect_after_login') || 'dashboard.html';
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = './' + redirect;
      return true;
    }
    throw { message: 'Login failed — no access token returned.' };
  },
  logout() {
    Api.logout();
    window.location.href = './login.html';
  },
  getUser() { return Api.getUser(); },
  hasRole(...roles) { return Api.hasRole(...roles); },
  isAdmin() { return Api.isAdmin(); },
  requireRole(...roles) {
    if (!Api.isAuthenticated()) { this.redirectIfNotAuthenticated(); return false; }
    if (!Api.hasRole(...roles)) {
      window.location.href = './dashboard.html';
      return false;
    }
    return true;
  },
};

window.Api = Api;
window.Auth = Auth;
export { Api, Auth };