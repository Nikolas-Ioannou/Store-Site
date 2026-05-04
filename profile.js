const CURRENT_USER_STORAGE_KEY = 'storeUserId';
const SESSION_TOKEN_STORAGE_KEY = 'storeSessionToken';

const authIntroPanel = document.getElementById('auth-intro-panel');
const authFormsPanel = document.getElementById('auth-forms-panel');
const accountPanel = document.getElementById('account-panel');
const authMessage = document.getElementById('auth-message');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const showLoginButton = document.getElementById('show-login-button');
const showRegisterButton = document.getElementById('show-register-button');
const introSignupButton = document.getElementById('intro-signup-button');
const loginSignupButton = document.getElementById('login-signup-button');
const registerLoginButton = document.getElementById('register-login-button');
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
const accountProfileSummary = document.getElementById('account-profile-summary');
const accountAddressSummary = document.getElementById('account-address-summary');
const accountInvoiceSummary = document.getElementById('account-invoice-summary');
const accountInstallmentsList = document.getElementById('account-installments-list');
const accountCouponsList = document.getElementById('account-coupons-list');
const accountFavoritesList = document.getElementById('account-favorites-list');
const personalEditButton = document.getElementById('personal-edit-button');
const personalFormCard = document.getElementById('personal-form-card');
const personalForm = document.getElementById('inline-personal-form');
const personalCancelButton = document.getElementById('personal-cancel-button');
const invoiceActionsRow = document.getElementById('invoice-actions-row');
const addressActionsRow = document.getElementById('address-actions-row');
const addressAddButton = document.getElementById('address-add-button');
const addressFormCard = document.getElementById('address-form-card');
const addressFormTitle = document.getElementById('address-form-title');
const addressForm = document.getElementById('address-form');
const addressCancelButton = document.getElementById('address-cancel-button');
const invoiceAddButton = document.getElementById('invoice-add-button');
const invoiceFormCard = document.getElementById('invoice-form-card');
const invoiceFormTitle = document.getElementById('invoice-form-title');
const invoiceForm = document.getElementById('invoice-form');
const invoiceCancelButton = document.getElementById('invoice-cancel-button');
const accountSideLinks = Array.from(document.querySelectorAll('.account-side-link[data-section]'));
const accountSubLinks = Array.from(document.querySelectorAll('.account-sub-link[data-section]'));
const profileMenuToggle = document.querySelector('[data-profile-toggle="true"]');
const profileSubNav = document.getElementById('profile-sub-nav');
const accountSections = Array.from(document.querySelectorAll('.account-hub-main > section[id]'));
const accountAvatar = document.querySelector('.account-avatar');

const profileSectionIds = ['personal-data-card', 'invoice-data-card', 'addresses-data-card'];

let currentUser = null;

function syncProfileNavigation(sectionId) {
  const profileActive = profileSectionIds.includes(sectionId);

  if (profileMenuToggle) {
    profileMenuToggle.classList.toggle('is-active', profileActive);
    profileMenuToggle.setAttribute('aria-expanded', String(profileActive));
  }

  if (profileSubNav) {
    profileSubNav.hidden = !profileActive;
  }

  accountSubLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function setActiveAccountSection(sectionId = 'personal-data-card') {
  accountSections.forEach((section) => {
    section.hidden = section.id !== sectionId;
  });

  accountSideLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  syncProfileNavigation(sectionId);

  if (window.location.hash !== `#${sectionId}`) {
    window.history.replaceState(null, '', `#${sectionId}`);
  }
}

function getInitialAccountSection() {
  const hashSection = window.location.hash.replace('#', '').trim();
  const matchingSection = accountSections.find((section) => section.id === hashSection);
  return matchingSection ? matchingSection.id : 'personal-data-card';
}

function setAuthMode(mode = 'login') {
  const showingRegister = mode === 'register';

  if (loginCard) {
    loginCard.hidden = showingRegister;
  }
  if (registerCard) {
    registerCard.hidden = !showingRegister;
  }
  if (showLoginButton) {
    showLoginButton.classList.toggle('is-active', !showingRegister);
    showLoginButton.setAttribute('aria-pressed', String(!showingRegister));
  }
  if (showRegisterButton) {
    showRegisterButton.classList.toggle('is-active', showingRegister);
    showRegisterButton.setAttribute('aria-pressed', String(showingRegister));
  }
}

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

function renderInstallmentPurchases(orders = []) {
  if (!accountInstallmentsList) {
    return;
  }

  const installmentOrders = orders.filter((order) => {
    const paymentStatus = String(order.payment_status || '').toLowerCase();
    const status = String(order.status || '').toLowerCase();
    return paymentStatus.includes('install') || paymentStatus.includes('partial') || status.includes('install');
  });

  if (installmentOrders.length === 0) {
    accountInstallmentsList.innerHTML = '<p class="account-empty">No installment purchases found</p>';
    return;
  }

  accountInstallmentsList.innerHTML = installmentOrders
    .slice(0, 5)
    .map(
      (order) => `
        <article class="order-line">
          <div>
            <strong>${escapeHtml(order.order_number)}</strong>
            <small>${escapeHtml(order.status || 'Pending')} / ${escapeHtml(order.payment_status || 'Installment plan')}</small>
          </div>
          <div>
            <span>${Number(order.total_amount || 0).toFixed(2)} ${escapeHtml(order.currency_code || 'EUR')}</span>
            <small>${escapeHtml(order.placed_at || 'No date yet')}</small>
          </div>
        </article>
      `,
    )
    .join('');
}

function renderCoupons() {
  if (!accountCouponsList) {
    return;
  }

  accountCouponsList.innerHTML = `
    <article class="summary-record-card">
      <div class="summary-record-head">
        <strong>No active coupons</strong>
      </div>
      <p>Your account does not have any saved coupon codes yet.</p>
    </article>
  `;
}

function renderFavorites() {
  if (!accountFavoritesList) {
    return;
  }

  accountFavoritesList.innerHTML = `
    <article class="summary-record-card">
      <div class="summary-record-head">
        <strong>Favorites live in the favorites page</strong>
      </div>
      <p>Use the favorites page to review the products you have saved.</p>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeAddressLabel(label, recipientName = '') {
  const normalizedLabel = String(label || '').trim();
  if (!normalizedLabel || normalizedLabel === 'Κύρια διεύθυνση') {
    return 'Primary address';
  }
  return normalizedLabel || recipientName || 'Saved address';
}

function renderSummaryRows(container, rows, emptyMessage) {
  if (!container) {
    return;
  }

  const validRows = rows.filter((row) => row.value);
  if (validRows.length === 0) {
    container.innerHTML = `<p class="account-empty">${escapeHtml(emptyMessage)}</p>`;
    return;
  }

  container.innerHTML = validRows
    .map(
      (row) => `
        <div class="summary-row">
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(row.value)}</strong>
        </div>
      `,
    )
    .join('');
}

function renderAddressSummary(addresses = []) {
  if (!accountAddressSummary) {
    return;
  }

  if (addresses.length === 0) {
    accountAddressSummary.innerHTML = '<p class="account-empty">No saved addresses</p>';
    return;
  }

  accountAddressSummary.innerHTML = addresses
    .map((address) => {
      const flags = [];
      if (Number(address.is_default_shipping) === 1) {
        flags.push('Default shipping');
      }
      if (Number(address.is_default_billing) === 1) {
        flags.push('Default billing');
      }

      return `
        <article class="summary-record-card profile-inline-record-card">
          <div class="summary-record-head">
            <div>
              <strong>${escapeHtml(normalizeAddressLabel(address.label, address.recipient_name))}</strong>
              ${flags.length ? `<p class="form-helper">${escapeHtml(flags.join(' / '))}</p>` : ''}
            </div>
            <div class="account-section-actions">
              <button class="button button-secondary" type="button" data-edit-address="${escapeHtml(address.id)}">Edit</button>
              <button class="button button-danger" type="button" data-delete-address="${escapeHtml(address.id)}">Remove</button>
            </div>
          </div>
          <div class="record-card-copy">
            <p>${escapeHtml([address.line_1, address.city, address.postal_code, address.region].filter(Boolean).join(', '))}</p>
          </div>
        </article>
      `;
    })
    .join('');

  accountAddressSummary.querySelectorAll('[data-edit-address]').forEach((button) => {
    button.addEventListener('click', () => openAddressEditor(Number(button.dataset.editAddress)));
  });

  accountAddressSummary.querySelectorAll('[data-delete-address]').forEach((button) => {
    button.addEventListener('click', () => handleDeleteAddress(Number(button.dataset.deleteAddress)));
  });
}

function renderInvoiceSummary(invoiceProfile) {
  if (!accountInvoiceSummary) {
    return;
  }

  if (!invoiceProfile) {
    accountInvoiceSummary.innerHTML = '<p class="account-empty">No invoice profile saved</p>';
    return;
  }

  accountInvoiceSummary.innerHTML = `
    <article class="summary-record-card profile-inline-record-card">
      <div class="summary-record-head">
        <div>
          <strong>${escapeHtml(invoiceProfile.company_name || 'Invoice profile')}</strong>
          <p class="form-helper">VAT number: ${escapeHtml(invoiceProfile.tax_id || 'Not set')}</p>
        </div>
        <div class="account-section-actions">
          <button class="button button-secondary" id="invoice-edit-button" type="button">Edit</button>
          <button class="button button-danger" id="invoice-delete-summary-button" type="button">Remove</button>
        </div>
      </div>
      <div class="record-card-copy">
        <p>${escapeHtml([invoiceProfile.tax_office, invoiceProfile.profession].filter(Boolean).join(' / ') || 'No tax office or profession saved')}</p>
        <p>${escapeHtml([invoiceProfile.line_1, invoiceProfile.city, invoiceProfile.postal_code, invoiceProfile.region].filter(Boolean).join(', ') || 'No invoice address saved')}</p>
        <p>${escapeHtml(invoiceProfile.phone || 'No invoice phone saved')}</p>
      </div>
    </article>
  `;

  const editButton = document.getElementById('invoice-edit-button');
  if (editButton) {
    editButton.addEventListener('click', openInvoiceEditor);
  }

  const deleteButton = document.getElementById('invoice-delete-summary-button');
  if (deleteButton) {
    deleteButton.addEventListener('click', handleDeleteInvoiceSummary);
  }
}

function clearAccountMessage() {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = '';
  authMessage.hidden = true;
  authMessage.classList.remove('is-error', 'is-success');
}

function openPersonalEditor() {
  if (!personalFormCard || !personalForm || !currentUser) {
    return;
  }

  clearAccountMessage();
  personalForm.elements.first_name.value = currentUser.first_name || '';
  personalForm.elements.last_name.value = currentUser.last_name || '';
  personalForm.elements.email.value = currentUser.email || '';
  personalForm.elements.phone.value = currentUser.phone || '';
  personalForm.elements.landline.value = currentUser.landline || '';
  if (accountProfileSummary) {
    accountProfileSummary.hidden = true;
  }
  if (personalEditButton) {
    personalEditButton.hidden = true;
  }
  personalFormCard.hidden = false;
}

function closePersonalEditor() {
  if (!personalFormCard || !personalForm) {
    return;
  }

  personalForm.reset();
  personalFormCard.hidden = true;
  if (accountProfileSummary) {
    accountProfileSummary.hidden = false;
  }
  if (personalEditButton) {
    personalEditButton.hidden = false;
  }
}

function openAddressEditor(addressId = null) {
  if (!addressForm || !addressFormCard) {
    return;
  }

  const address = addressId ? currentUser?.addresses?.find((item) => Number(item.id) === Number(addressId)) : null;
  clearAccountMessage();
  addressForm.reset();
  addressForm.elements.address_id.value = address ? String(address.id) : '';
  addressForm.elements.label.value = address?.label || '';
  addressForm.elements.recipient_name.value = address?.recipient_name || `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim();
  addressForm.elements.line_1.value = address?.line_1 || '';
  addressForm.elements.line_2.value = address?.line_2 || '';
  addressForm.elements.city.value = address?.city || '';
  addressForm.elements.postal_code.value = address?.postal_code || '';
  addressForm.elements.region.value = address?.region || '';
  addressForm.elements.country_code.value = address?.country_code || 'GR';
  addressForm.elements.is_default_shipping.checked = Number(address?.is_default_shipping || 0) === 1;
  addressForm.elements.is_default_billing.checked = Number(address?.is_default_billing || 0) === 1;
  if (addressFormTitle) {
    addressFormTitle.textContent = address ? 'Edit address' : 'Add address';
  }
  if (accountAddressSummary) {
    accountAddressSummary.hidden = true;
  }
  if (addressActionsRow) {
    addressActionsRow.hidden = true;
  }
  addressFormCard.hidden = false;
}

function closeAddressEditor() {
  if (!addressFormCard || !addressForm) {
    return;
  }

  addressForm.reset();
  addressFormCard.hidden = true;
  if (accountAddressSummary) {
    accountAddressSummary.hidden = false;
  }
  if (addressActionsRow) {
    addressActionsRow.hidden = false;
  }
}

function openInvoiceEditor() {
  if (!invoiceFormCard || !invoiceForm) {
    return;
  }

  const invoice = currentUser?.invoice_profile || null;
  clearAccountMessage();
  invoiceForm.reset();
  invoiceForm.elements.company_name.value = invoice?.company_name || '';
  invoiceForm.elements.tax_id.value = invoice?.tax_id || '';
  invoiceForm.elements.tax_office.value = invoice?.tax_office || '';
  invoiceForm.elements.profession.value = invoice?.profession || '';
  invoiceForm.elements.line_1.value = invoice?.line_1 || '';
  invoiceForm.elements.city.value = invoice?.city || '';
  invoiceForm.elements.postal_code.value = invoice?.postal_code || '';
  invoiceForm.elements.region.value = invoice?.region || '';
  invoiceForm.elements.phone.value = invoice?.phone || currentUser?.phone || '';
  if (invoiceFormTitle) {
    invoiceFormTitle.textContent = invoice ? 'Edit invoice profile' : 'Add invoice profile';
  }
  if (accountInvoiceSummary) {
    accountInvoiceSummary.hidden = true;
  }
  if (invoiceActionsRow) {
    invoiceActionsRow.hidden = true;
  }
  invoiceFormCard.hidden = false;
}

function closeInvoiceEditor() {
  if (!invoiceFormCard || !invoiceForm) {
    return;
  }

  invoiceForm.reset();
  invoiceFormCard.hidden = true;
  if (accountInvoiceSummary) {
    accountInvoiceSummary.hidden = false;
  }
  if (invoiceActionsRow) {
    invoiceActionsRow.hidden = false;
  }
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

  const orders = Array.isArray(userPayload.orders) ? userPayload.orders : [];
  if (accountOrderCount) {
    accountOrderCount.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
  }
  renderOrders(orders);
  renderInstallmentPurchases(orders);
  renderCoupons();
  renderFavorites();
  renderSummaryRows(
    accountProfileSummary,
    [
      { label: 'First name', value: userPayload.first_name || '' },
      { label: 'Last name', value: userPayload.last_name || '' },
      { label: 'Email', value: userPayload.email || '' },
      { label: 'Phone', value: userPayload.phone || 'No phone saved' },
      { label: 'Landline', value: userPayload.landline || 'No landline saved' },
    ],
    'No profile details available yet',
  );
  renderAddressSummary(Array.isArray(userPayload.addresses) ? userPayload.addresses : []);
  renderInvoiceSummary(userPayload.invoice_profile);
  if (personalForm && !personalFormCard?.hidden) {
    openPersonalEditor();
  }
  if (addressForm && !addressFormCard?.hidden) {
    const addressId = String(addressForm.elements.address_id.value || '').trim();
    openAddressEditor(addressId ? Number(addressId) : null);
  }
  if (invoiceForm && !invoiceFormCard?.hidden) {
    openInvoiceEditor();
  }
  populateAccountPersonalForm(userPayload);
  populateAccountDetailsForm(userPayload);
}

function formDataToPersonalPayload(formData) {
  return {
    first_name: String(formData.get('first_name') || '').trim(),
    last_name: String(formData.get('last_name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    landline: String(formData.get('landline') || '').trim(),
  };
}

async function handleDeleteAddress(addressId) {
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId || !addressId || !window.confirm('Delete this address?')) {
    return;
  }

  try {
    await fetchJson(`/api/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
    });
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
    closeAddressEditor();
    applyUserDetails(updatedUser);
  } catch (error) {
    console.error(error);
  }
}

async function handleDeleteInvoiceSummary() {
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId || !currentUser?.invoice_profile || !window.confirm('Delete the invoice profile?')) {
    return;
  }

  try {
    await fetchJson(`/api/users/${encodeURIComponent(userId)}/invoice-profile`, {
      method: 'DELETE',
    });
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
    closeInvoiceEditor();
    applyUserDetails(updatedUser);
  } catch (error) {
    console.error(error);
  }
}

function renderLoggedOut() {
  setAuthMode('login');
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }
  if (authIntroPanel) {
    authIntroPanel.hidden = false;
  }
  if (authFormsPanel) {
    authFormsPanel.hidden = false;
  }
  if (accountPanel) {
    accountPanel.hidden = true;
  }
}

function renderLoggedIn(sessionPayload) {
  const { user } = sessionPayload;
  if (authIntroPanel) {
    authIntroPanel.hidden = true;
  }
  if (authFormsPanel) {
    authFormsPanel.hidden = true;
  }
  if (accountPanel) {
    accountPanel.hidden = false;
  }
  clearAccountMessage();

  setActiveAccountSection(getInitialAccountSection());

  if (accountName) {
    accountName.textContent = `${user.first_name} ${user.last_name}`;
  }
  if (accountEmail) {
    accountEmail.textContent = user.email;
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
      renderInstallmentPurchases([]);
      renderCoupons();
      renderFavorites();
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
        landline: String(formData.get('landline') || '').trim(),
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
    setMessage('Details saved');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleAccountPersonalSave(event) {
  event.preventDefault();
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId) {
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
    closePersonalEditor();
  } catch (error) {
    console.error(error);
  }
}

async function handleAddressSave(event) {
  event.preventDefault();
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const addressId = String(formData.get('address_id') || '').trim();
  const payload = {
    label: String(formData.get('label') || '').trim(),
    recipient_name: String(formData.get('recipient_name') || '').trim(),
    line_1: String(formData.get('line_1') || '').trim(),
    line_2: String(formData.get('line_2') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    postal_code: String(formData.get('postal_code') || '').trim(),
    region: String(formData.get('region') || '').trim(),
    country_code: String(formData.get('country_code') || 'GR').trim(),
    is_default_shipping: formData.get('is_default_shipping') === '1',
    is_default_billing: formData.get('is_default_billing') === '1',
  };

  try {
    await fetchJson(
      addressId
        ? `/api/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(addressId)}`
        : `/api/users/${encodeURIComponent(userId)}/addresses`,
      {
        method: addressId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
    closeAddressEditor();
    applyUserDetails(updatedUser);
  } catch (error) {
    console.error(error);
  }
}

async function handleInvoiceSave(event) {
  event.preventDefault();
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  try {
    await fetchJson(`/api/users/${encodeURIComponent(userId)}/invoice-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_requested: true,
        company_name: String(formData.get('company_name') || '').trim(),
        tax_id: String(formData.get('tax_id') || '').trim(),
        tax_office: String(formData.get('tax_office') || '').trim(),
        profession: String(formData.get('profession') || '').trim(),
        line_1: String(formData.get('line_1') || '').trim(),
        city: String(formData.get('city') || '').trim(),
        postal_code: String(formData.get('postal_code') || '').trim(),
        region: String(formData.get('region') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
      }),
    });
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
    closeInvoiceEditor();
    applyUserDetails(updatedUser);
  } catch (error) {
    console.error(error);
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

if (showLoginButton) {
  showLoginButton.addEventListener('click', () => setAuthMode('login'));
}

if (showRegisterButton) {
  showRegisterButton.addEventListener('click', () => setAuthMode('register'));
}

if (introSignupButton) {
  introSignupButton.addEventListener('click', () => setAuthMode('register'));
}

if (loginSignupButton) {
  loginSignupButton.addEventListener('click', () => setAuthMode('register'));
}

if (registerLoginButton) {
  registerLoginButton.addEventListener('click', () => setAuthMode('login'));
}

if (registerForm) {
  registerForm.addEventListener('submit', handleRegister);
}

if (logoutButton) {
  logoutButton.addEventListener('click', handleLogout);
}

if (personalEditButton) {
  personalEditButton.addEventListener('click', openPersonalEditor);
}

if (personalCancelButton) {
  personalCancelButton.addEventListener('click', closePersonalEditor);
}

if (addressAddButton) {
  addressAddButton.addEventListener('click', () => openAddressEditor());
}

if (addressCancelButton) {
  addressCancelButton.addEventListener('click', closeAddressEditor);
}

if (invoiceAddButton) {
  invoiceAddButton.addEventListener('click', openInvoiceEditor);
}

if (invoiceCancelButton) {
  invoiceCancelButton.addEventListener('click', closeInvoiceEditor);
}

accountSideLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setActiveAccountSection(link.dataset.section || 'personal-data-card');
  });
});

accountSubLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    setActiveAccountSection(link.dataset.section || 'personal-data-card');
  });
});

if (profileMenuToggle) {
  profileMenuToggle.addEventListener('click', () => {
    setActiveAccountSection('personal-data-card');
  });
}

window.addEventListener('hashchange', () => {
  if (!accountPanel || accountPanel.hidden) {
    return;
  }
  setActiveAccountSection(getInitialAccountSection());
});

if (accountDetailsForm) {
  accountDetailsForm.addEventListener('submit', handleAccountDetailsSave);
}

if (accountPersonalForm) {
  accountPersonalForm.addEventListener('submit', handleAccountPersonalSave);
}

if (addressForm) {
  addressForm.addEventListener('submit', handleAddressSave);
}

if (invoiceForm) {
  invoiceForm.addEventListener('submit', handleInvoiceSave);
}

restoreSession();
