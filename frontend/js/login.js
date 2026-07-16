// login.js — Login page logic: form submission, JWT auth, inline validation, error handling
import { Api, Auth } from './api.js';
import { Toast, setFieldError, clearFieldError } from './utils.js';

// Redirect to dashboard if already logged in
if (Api.isAuthenticated()) {
  window.location.href = './dashboard.html';
}

const form = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorBox = document.getElementById('login-error');
const errorMsg = document.getElementById('login-error-msg');
const loginBtn = document.getElementById('login-btn');
const btnText = document.getElementById('login-btn-text');
const btnSpinner = document.getElementById('login-btn-spinner');
const passwordToggle = document.getElementById('password-toggle');

function showError(msg) {
  if (errorMsg) errorMsg.textContent = msg;
  if (errorBox) errorBox.classList.add('show');
}

function hideError() {
  if (errorBox) errorBox.classList.remove('show');
}

function setLoading(loading) {
  // Ulinzi wa hali ya juu: Tunahakikisha kila element ipo na si null kabla ya kuitumia
  if (loginBtn) {
    loginBtn.disabled = loading;
  }
  if (btnText && btnText.classList) {
    btnText.classList.toggle('hidden', loading);
  }
  if (btnSpinner && btnSpinner.classList) {
    btnSpinner.classList.toggle('hidden', !loading);
  }
}

// Password visibility toggle
if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener('click', () => {
    const isPwd = passwordInput.type === 'password';
    passwordInput.type = isPwd ? 'text' : 'password';
    passwordToggle.innerHTML = isPwd ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  });
}

// Clear errors on input
[usernameInput, passwordInput].forEach((el) => {
  if (el) {
    el.addEventListener('input', () => {
      hideError();
      clearFieldError(el);
    });
  }
});

function validate() {
  let valid = true;
  if (usernameInput && !usernameInput.value.trim()) {
    setFieldError(usernameInput, 'Username is required.');
    valid = false;
  }
  if (passwordInput && !passwordInput.value) {
    setFieldError(passwordInput, 'Password is required.');
    valid = false;
  }
  return valid;
}

// Handle form submit
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    if (!validate()) return;

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    setLoading(true);
    try {
      await Auth.handleLogin(username, password);
      Toast.success('Welcome back! Redirecting…');
    } catch (err) {
      setLoading(false);
      const msg = err.message || 'Login failed. Please check your credentials.';
      showError(msg);
    }
  });
}

if (usernameInput) {
  usernameInput.focus();
}