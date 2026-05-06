const CURRENT_USER_STORAGE_KEY = 'storeUserId';
const SESSION_TOKEN_STORAGE_KEY = 'storeSessionToken';

const accountMessage = document.getElementById('account-message');
const logoutButton = document.getElementById('logout-button');
const profileDetailsForm = document.getElementById('profile-details-form');
const addressForm = document.getElementById('address-form');
const addressList = document.getElementById('address-list');
const addressFormCard = document.getElementById('address-form-card');
const addressFormTitle = document.getElementById('address-form-title');
const addressCancelButton = document.getElementById('address-cancel-button');
const addressCreateButton = document.getElementById('add-address-button');
const invoiceForm = document.getElementById('invoice-form');
const invoiceFormCard = document.getElementById('invoice-form-card');
const invoiceFormTitle = document.getElementById('invoice-form-title');
const invoiceCancelButton = document.getElementById('invoice-cancel-button');
const invoiceOpenButton = document.getElementById('invoice-open-button');
const invoiceDeleteButton = document.getElementById('invoice-delete-button');
const invoiceList = document.getElementById('invoice-list');
const sidebarAvatar = document.getElementById('sidebar-avatar');
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');

let currentUser = null;

function setMessage(message = '', tone = 'success') {
  if (!accountMessage) {
    return;
  }

  accountMessage.textContent = message;
  accountMessage.hidden = !message;
  accountMessage.classList.remove('is-error', 'is-success');
  if (message) {
    accountMessage.classList.add(tone === 'error' ? 'is-error' : 'is-success');
  }
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

function getSessionToken() {
  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
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

function updateSidebar(userPayload) {
  if (sidebarAvatar) {
    sidebarAvatar.textContent = getInitials(userPayload.first_name, userPayload.last_name);
  }
  if (sidebarName) {
    sidebarName.textContent = `${userPayload.first_name} ${userPayload.last_name}`.trim() || 'Bluehaven Customer';
  }
  if (sidebarEmail) {
    sidebarEmail.textContent = userPayload.email || '';
  }
}

function populateProfileForm(userPayload) {
  if (!profileDetailsForm) {
    return;
  }

  profileDetailsForm.elements.first_name.value = userPayload.first_name || '';
  profileDetailsForm.elements.last_name.value = userPayload.last_name || '';
  profileDetailsForm.elements.email.value = userPayload.email || '';
  profileDetailsForm.elements.phone.value = userPayload.phone || '';
  profileDetailsForm.elements.landline.value = userPayload.landline || '';
}

function renderAddresses(addresses = []) {
  if (!addressList) {
    return;
  }

  if (addresses.length === 0) {
    addressList.innerHTML = `
      <article class="empty-state-card">
        <strong>No delivery addresses yet</strong>
        <p>Add your first address so orders can be shipped faster at checkout.</p>
      </article>
    `;
    return;
  }

  addressList.innerHTML = '';
  addresses.forEach((address) => {
    const card = document.createElement('article');
    card.className = 'record-card';

    const pills = [];
    if (Number(address.is_default_shipping) === 1) {
      pills.push('<span class="record-pill">Default shipping</span>');
    }
    if (Number(address.is_default_billing) === 1) {
      pills.push('<span class="record-pill">Default billing</span>');
    }

    card.innerHTML = `
      <div class="record-card-top">
        <div class="record-card-copy">
          <strong>${escapeHtml(normalizeAddressLabel(address.label, address.recipient_name))}</strong>
        </div>
        <div class="record-pills">${pills.join('')}</div>
      </div>
      <div class="record-card-copy">
        <p>${escapeHtml(address.line_1 || '')}</p>
        <p>${escapeHtml([address.line_2, address.city, address.postal_code, address.region, address.country_code].filter(Boolean).join(', '))}</p>
      </div>
      <div class="record-actions">
        <button class="button button-secondary" type="button" data-edit-address="${address.id}">Edit</button>
        <button class="button button-danger" type="button" data-delete-address="${address.id}">Delete</button>
      </div>
    `;

    addressList.appendChild(card);
  });

  addressList.querySelectorAll('[data-edit-address]').forEach((button) => {
    button.addEventListener('click', () => openAddressEditor(Number(button.dataset.editAddress)));
  });
  addressList.querySelectorAll('[data-delete-address]').forEach((button) => {
    button.addEventListener('click', () => handleDeleteAddress(Number(button.dataset.deleteAddress)));
  });
}

function renderInvoice(invoiceProfile) {
  if (!invoiceList) {
    return;
  }

  if (!invoiceProfile) {
    invoiceList.innerHTML = `
      <article class="empty-state-card">
        <strong>No invoice profile yet</strong>
        <p>Add invoice details if you want to use business billing for eligible purchases.</p>
      </article>
    `;
    if (invoiceDeleteButton) {
      invoiceDeleteButton.hidden = true;
    }
    return;
  }

  invoiceList.innerHTML = `
    <article class="record-card">
      <div class="record-card-top">
        <div class="record-card-copy">
          <strong>${escapeHtml(invoiceProfile.company_name)}</strong>
          <p>VAT number: ${escapeHtml(invoiceProfile.tax_id || '')}</p>
        </div>
        <div class="record-pills"><span class="record-pill">Invoice active</span></div>
      </div>
      <div class="record-card-copy">
        <p>${escapeHtml([invoiceProfile.line_1, invoiceProfile.city, invoiceProfile.postal_code, invoiceProfile.region].filter(Boolean).join(', '))}</p>
        <p>${escapeHtml([invoiceProfile.tax_office, invoiceProfile.profession, invoiceProfile.phone].filter(Boolean).join(' | '))}</p>
      </div>
    </article>
  `;

  if (invoiceDeleteButton) {
    invoiceDeleteButton.hidden = false;
  }
}

function openAddressEditor(addressId = null) {
  if (!addressForm || !addressFormCard) {
    return;
  }

  const address = addressId ? currentUser?.addresses?.find((item) => Number(item.id) === Number(addressId)) : null;
  addressForm.reset();
  addressForm.elements.address_id.value = address ? String(address.id) : '';
  addressForm.elements.label.value = address?.label || '';
  addressForm.elements.line_1.value = address?.line_1 || '';
  addressForm.elements.line_2.value = address?.line_2 || '';
  addressForm.elements.city.value = address?.city || '';
  addressForm.elements.postal_code.value = address?.postal_code || '';
  addressForm.elements.region.value = address?.region || '';
  addressForm.elements.country_code.value = address?.country_code || 'GR';
  if (addressFormTitle) {
    addressFormTitle.textContent = address ? 'Edit address' : 'Add address';
  }
  addressFormCard.hidden = false;
  addressFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeAddressEditor() {
  if (!addressFormCard || !addressForm) {
    return;
  }

  addressForm.reset();
  addressFormCard.hidden = true;
}

function openInvoiceEditor() {
  if (!invoiceFormCard || !invoiceForm) {
    return;
  }

  const invoice = currentUser?.invoice_profile || null;
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
  invoiceFormCard.hidden = false;
  invoiceFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeInvoiceEditor() {
  if (!invoiceFormCard || !invoiceForm) {
    return;
  }

  invoiceForm.reset();
  invoiceFormCard.hidden = true;
}

async function reloadCurrentUser(message = '') {
  const userId = currentUser?.id || window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!userId) {
    window.location.href = 'profile.html';
    return;
  }

  currentUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
  updateSidebar(currentUser);
  populateProfileForm(currentUser);
  renderAddresses(Array.isArray(currentUser.addresses) ? currentUser.addresses : []);
  renderInvoice(currentUser.invoice_profile || null);
  if (message) {
    setMessage(message);
  }
}

async function handleProfileSave(event) {
  event.preventDefault();
  const userId = currentUser?.id;
  if (!userId) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  try {
    await fetchJson(`/api/users/${encodeURIComponent(userId)}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: String(formData.get('first_name') || '').trim(),
        last_name: String(formData.get('last_name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        landline: String(formData.get('landline') || '').trim(),
      }),
    });
    await reloadCurrentUser('Profile details updated');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleAddressSave(event) {
  event.preventDefault();
  const userId = currentUser?.id;
  if (!userId) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const addressId = String(formData.get('address_id') || '').trim();
  const payload = {
    label: String(formData.get('label') || '').trim(),
    line_1: String(formData.get('line_1') || '').trim(),
    line_2: String(formData.get('line_2') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    postal_code: String(formData.get('postal_code') || '').trim(),
    region: String(formData.get('region') || '').trim(),
    country_code: String(formData.get('country_code') || 'GR').trim(),
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
    closeAddressEditor();
    await reloadCurrentUser(addressId ? 'Address updated' : 'Address added');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleDeleteAddress(addressId) {
  if (!currentUser?.id || !addressId || !window.confirm('Delete this address?')) {
    return;
  }

  try {
    await fetchJson(`/api/users/${encodeURIComponent(currentUser.id)}/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
    });
    closeAddressEditor();
    await reloadCurrentUser('Address deleted');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleInvoiceSave(event) {
  event.preventDefault();
  const userId = currentUser?.id;
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
    closeInvoiceEditor();
    await reloadCurrentUser('Invoice profile saved');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleDeleteInvoice() {
  if (!currentUser?.id || !currentUser?.invoice_profile || !window.confirm('Delete the invoice profile?')) {
    return;
  }

  try {
    await fetchJson(`/api/users/${encodeURIComponent(currentUser.id)}/invoice-profile`, {
      method: 'DELETE',
    });
    closeInvoiceEditor();
    await reloadCurrentUser('Invoice profile deleted');
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
    window.location.href = 'profile.html';
  }
}

async function restoreAccountSession() {
  const token = getSessionToken();
  if (!token) {
    window.location.href = 'profile.html';
    return;
  }

  try {
    const sessionPayload = await fetchJson(`/api/auth/session?token=${encodeURIComponent(token)}`);
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, String(sessionPayload.user.id));
    currentUser = await fetchJson(`/api/users/${encodeURIComponent(sessionPayload.user.id)}`);
    updateSidebar(currentUser);
    populateProfileForm(currentUser);
    renderAddresses(Array.isArray(currentUser.addresses) ? currentUser.addresses : []);
    renderInvoice(currentUser.invoice_profile || null);
    closeAddressEditor();
    closeInvoiceEditor();
  } catch {
    clearSession();
    window.location.href = 'profile.html';
  }
}

if (logoutButton) {
  logoutButton.addEventListener('click', handleLogout);
}

if (profileDetailsForm) {
  profileDetailsForm.addEventListener('submit', handleProfileSave);
}

if (addressForm) {
  addressForm.addEventListener('submit', handleAddressSave);
}

if (addressCancelButton) {
  addressCancelButton.addEventListener('click', closeAddressEditor);
}

if (addressCreateButton) {
  addressCreateButton.addEventListener('click', () => openAddressEditor());
}

if (invoiceForm) {
  invoiceForm.addEventListener('submit', handleInvoiceSave);
}

if (invoiceCancelButton) {
  invoiceCancelButton.addEventListener('click', closeInvoiceEditor);
}

if (invoiceOpenButton) {
  invoiceOpenButton.addEventListener('click', openInvoiceEditor);
}

if (invoiceDeleteButton) {
  invoiceDeleteButton.addEventListener('click', handleDeleteInvoice);
}

restoreAccountSession();