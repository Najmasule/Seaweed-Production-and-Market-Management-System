// app.js — Shared app initialization: global loader, page-level helpers.
// This is imported by every authenticated page alongside auth.js.

import { Auth } from './auth.js';
import { Toast } from './utils.js';

// Global error handler for unhandled promise rejections from API calls
window.addEventListener('unhandledrejection', (e) => {
  const err = e.reason;
  if (err && err.message) {
    // Avoid duplicate toasts for auth redirects
    if (err.status !== 401) {
      Toast.error(err.message);
    }
  }
});

// Inject global loader bar
if (!document.getElementById('global-loader')) {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  document.body.appendChild(loader);
}

export { Auth, Toast };
