const CURRENT_USER_STORAGE_KEY = 'storeUserId';
const SESSION_TOKEN_STORAGE_KEY = 'storeSessionToken';

const authFormsPanel = document.getElementById('auth-forms-panel');
const accountPanel = document.getElementById('account-panel');
const authMessage = document.getElementById('auth-message');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const accountPersonalForm = document.getElementById('account-personal-form');
const accountDetailsForm = document.getElementById('account-details-form');
const logoutButton = document.getElementById('logout-button');
const accountName = document.getElementById('account-name');
const accountEmail = document.getElementById('account-email');
const accountRole = document.getElementById('account-role');
const accountPhone = document.getElementById('account-phone');
const accountInvoiceStatus = document.getElementById('account-invoice-status');
const accountOrderCount = document.getElementById('account-order-count');
const accountOrdersList = document.getElementById('account-orders-list');
const accountAvatar = document.querySelector('.account-avatar');

let currentUser = null;

function setMessage(message = '', tone = 'success') {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = message;
  authMessage.hidden = !message;
  authMessage.classList.remove('is-error', 'is-success');
  if (message) {
    authMessage.classList.add(tone === 'error' ? 'is-error' : 'is-success');
  }
}

function getSessionToken() {
  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
}

function setSession(session) {
  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, String(session.user.id));
  window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, session.session.session_token);
}

function clearSession() {
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
}

function getInitials(firstName, lastName) {
  return `${(firstName || '').trim().charAt(0)}${(lastName || '').trim().charAt(0)}`.toUpperCase() || 'B';
}

async function fetchJson(path, options = {}) {
  const response = await fetch(path, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

function renderOrders(orders = []) {
  if (!accountOrdersList) {
    return;
  }

  accountOrdersList.innerHTML = '';
  if (orders.length === 0) {
    accountOrdersList.innerHTML = '<p class="account-empty">No orders yet</p>';
    return;
  }

  orders.slice(0, 5).forEach((order) => {
    const row = document.createElement('article');
    row.className = 'order-line';
    row.innerHTML = `
      <div>
        <strong>${order.order_number}</strong>
        <small>${order.status} / ${order.payment_status}</small>
      </div>
      <div>
        <span>${Number(order.total_amount || 0).toFixed(2)} ${order.currency_code || 'EUR'}</span>
        <small>${order.placed_at || 'No date yet'}</small>
      </div>
    `;
    accountOrdersList.appendChild(row);
  });
}

function formDataToProfilePayload(formData) {
  return {
    phone: String(formData.get('phone') || '').trim(),
    line_1: String(formData.get('line_1') || '').trim(),
    postal_code: String(formData.get('postal_code') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    region: String(formData.get('region') || '').trim(),
    invoice_requested: formData.get('invoice_requested') === '1',
    company_name: String(formData.get('company_name') || '').trim(),
    tax_id: String(formData.get('tax_id') || '').trim(),
    tax_office: String(formData.get('tax_office') || '').trim(),
    profession: String(formData.get('profession') || '').trim(),
  };
}

function populateAccountDetailsForm(userPayload) {
  if (!accountDetailsForm) {
    return;
  }

  const address = userPayload.primary_address || {};
  const invoiceProfile = userPayload.invoice_profile || {};
  accountDetailsForm.elements.phone.value = userPayload.phone || '';
  accountDetailsForm.elements.line_1.value = address.line_1 || invoiceProfile.line_1 || '';
  accountDetailsForm.elements.postal_code.value = address.postal_code || invoiceProfile.postal_code || '';
  accountDetailsForm.elements.city.value = address.city || invoiceProfile.city || '';
  accountDetailsForm.elements.region.value = address.region || invoiceProfile.region || '';
  accountDetailsForm.elements.invoice_requested.checked = Boolean(invoiceProfile.company_name);
  accountDetailsForm.elements.company_name.value = invoiceProfile.company_name || '';
  accountDetailsForm.elements.tax_id.value = invoiceProfile.tax_id || '';
  accountDetailsForm.elements.tax_office.value = invoiceProfile.tax_office || '';
  accountDetailsForm.elements.profession.value = invoiceProfile.profession || '';
}

function populateAccountPersonalForm(userPayload) {
  if (!accountPersonalForm) {
    return;
  }

  accountPersonalForm.elements.first_name.value = userPayload.first_name || '';
  accountPersonalForm.elements.last_name.value = userPayload.last_name || '';
  accountPersonalForm.elements.email.value = userPayload.email || '';
  accountPersonalForm.elements.phone.value = userPayload.phone || '';
}

function applyUserDetails(userPayload) {
  currentUser = userPayload;

  if (accountName) {
    accountName.textContent = `${userPayload.first_name} ${userPayload.last_name}`.trim() || 'Bluehaven Customer';
  }
  if (accountEmail) {
    accountEmail.textContent = userPayload.email || '';
  }
  if (accountAvatar) {
    accountAvatar.textContent = getInitials(userPayload.first_name, userPayload.last_name);
  }

  if (accountPhone) {
    accountPhone.textContent = userPayload.phone || 'No phone saved';
  }
  if (accountInvoiceStatus) {
    accountInvoiceStatus.textContent = userPayload.invoice_profile ? 'Ενεργό τιμολόγιο' : 'Χωρίς τιμολόγιο';
  }

  const orders = Array.isArray(userPayload.orders) ? userPayload.orders : [];
  if (accountOrderCount) {
    accountOrderCount.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
  }
  renderOrders(orders);
  populateAccountPersonalForm(userPayload);
  populateAccountDetailsForm(userPayload);
}

function formDataToPersonalPayload(formData) {
  return {
    first_name: String(formData.get('first_name') || '').trim(),
    last_name: String(formData.get('last_name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
  };
}

function renderLoggedOut() {
  if (authFormsPanel) {
    authFormsPanel.hidden = false;
  }
  if (accountPanel) {
    accountPanel.hidden = true;
  }
}

function renderLoggedIn(sessionPayload) {
  const { user } = sessionPayload;
  if (authFormsPanel) {
    authFormsPanel.hidden = true;
  }
  if (accountPanel) {
    accountPanel.hidden = false;
  }

  if (accountName) {
    accountName.textContent = `${user.first_name} ${user.last_name}`;
  }
  if (accountEmail) {
    accountEmail.textContent = user.email;
  }
  if (accountRole) {
    accountRole.textContent = user.role || 'customer';
  }
  if (accountPhone) {
    accountPhone.textContent = user.phone || 'No phone saved';
  }
  if (accountAvatar) {
    accountAvatar.textContent = getInitials(user.first_name, user.last_name);
  }

  fetchJson(`/api/users/${encodeURIComponent(user.id)}`)
    .then((userPayload) => {
      applyUserDetails(userPayload);
    })
    .catch(() => {
      if (accountOrderCount) {
        accountOrderCount.textContent = '0 orders';
      }
      renderOrders([]);
    });
}

async function restoreSession() {
  const token = getSessionToken();
  if (!token) {
    renderLoggedOut();
    return;
  }

  try {
    const sessionPayload = await fetchJson(`/api/auth/session?token=${encodeURIComponent(token)}`);
    renderLoggedIn(sessionPayload);
  } catch {
    clearSession();
    renderLoggedOut();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  try {
    const sessionPayload = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
      }),
    });
    setSession(sessionPayload);
    setMessage('You are now logged in');
    renderLoggedIn(sessionPayload);
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  try {
    const sessionPayload = await fetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: String(formData.get('first_name') || '').trim(),
        last_name: String(formData.get('last_name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        line_1: String(formData.get('line_1') || '').trim(),
        postal_code: String(formData.get('postal_code') || '').trim(),
        city: String(formData.get('city') || '').trim(),
        region: String(formData.get('region') || '').trim(),
        invoice_requested: formData.get('invoice_requested') === '1',
        company_name: String(formData.get('company_name') || '').trim(),
        tax_id: String(formData.get('tax_id') || '').trim(),
        tax_office: String(formData.get('tax_office') || '').trim(),
        profession: String(formData.get('profession') || '').trim(),
        password: String(formData.get('password') || ''),
      }),
    });
    setSession(sessionPayload);
    setMessage('Your account has been created');
    renderLoggedIn(sessionPayload);
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleAccountDetailsSave(event) {
  event.preventDefault();
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId) {
    setMessage('Please log in first', 'error');
    return;
  }

  const formData = new FormData(event.currentTarget);
  try {
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataToProfilePayload(formData)),
    });
    applyUserDetails(updatedUser);
    setMessage('Τα στοιχεία αποθηκεύτηκαν');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleAccountPersonalSave(event) {
  event.preventDefault();
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId) {
    setMessage('Please log in first', 'error');
    return;
  }

  const formData = new FormData(event.currentTarget);
  try {
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataToPersonalPayload(formData)),
    });
    applyUserDetails(updatedUser);
    setMessage('Το προφίλ ενημερώθηκε');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleLogout() {
  const token = getSessionToken();
  try {
    if (token) {
      await fetchJson('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      });
    }
  } catch {
  } finally {
    clearSession();
    setMessage('You have been logged out');
    renderLoggedOut();
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

if (logoutButton) {
  logoutButton.addEventListener('click', handleLogout);
}

if (accountDetailsForm) {
  accountDetailsForm.addEventListener('submit', handleAccountDetailsSave);
}

if (accountPersonalForm) {
  accountPersonalForm.addEventListener('submit', handleAccountPersonalSave);
}

restoreSession();
