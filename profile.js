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
const accountPersonalForm = document.getElementById('inline-personal-form');
const accountDetailsForm = document.getElementById('account-details-form');
const logoutButton = document.getElementById('logout-button');
const accountName = document.getElementById('account-name');
const accountEmail = document.getElementById('account-email');
const accountRole = document.getElementById('account-role');
const accountPhone = document.getElementById('account-phone');
const accountInvoiceStatus = document.getElementById('account-invoice-status');
const accountOrdersPendingList = document.getElementById('account-orders-pending-list');
const accountOrdersCompletedList = document.getElementById('account-orders-completed-list');
const accountProfileSummary = document.getElementById('account-profile-summary');
const accountAddressSummary = document.getElementById('account-address-summary');
const accountInvoiceSummary = document.getElementById('account-invoice-summary');
const accountInstallmentsPendingList = document.getElementById('account-installments-pending-list');
const accountInstallmentsCompletedList = document.getElementById('account-installments-completed-list');
const installmentsPendingPagination = document.getElementById('installments-pending-pagination');
const installmentsCompletedPagination = document.getElementById('installments-completed-pagination');
const accountCouponsList = document.getElementById('account-coupons-list');
const accountFavoritesList = document.getElementById('account-favorites-list');
const favoritesResultsSummary = document.getElementById('favorites-results-summary');
const favoritesSearchInput = document.getElementById('favorites-search-input');
const favoritesFilterChips = document.getElementById('favorites-filter-chips');
const favoritesPagination = document.getElementById('favorites-pagination');
const ordersSearchInput = document.getElementById('orders-search-input');
const ordersDateFilter = document.getElementById('orders-date-filter');
const ordersPendingPagination = document.getElementById('orders-pending-pagination');
const ordersCompletedPagination = document.getElementById('orders-completed-pagination');
const personalEditButton = document.getElementById('personal-edit-button');
const personalFormCard = document.getElementById('personal-form-card');
const personalForm = document.getElementById('inline-personal-form');
const personalCancelButton = document.getElementById('personal-cancel-button');
const invoiceActionsRow = document.getElementById('invoice-actions-row');
const addressActionsRow = document.getElementById('address-actions-row');
const addressAddButton = document.getElementById('address-add-button');
const addressFormCard = document.getElementById('address-form-card');
const addressForm = document.getElementById('address-form');
const addressCancelButton = document.getElementById('address-cancel-button');
const invoiceAddButton = document.getElementById('invoice-add-button');
const invoiceFormCard = document.getElementById('invoice-form-card');
const invoiceForm = document.getElementById('invoice-form');
const invoiceCancelButton = document.getElementById('invoice-cancel-button');
const accountSideLinks = Array.from(document.querySelectorAll('.account-side-link[data-section]'));
const accountSubLinks = Array.from(document.querySelectorAll('.account-sub-link[data-section]'));
const profileMenuToggle = document.querySelector('[data-profile-toggle="true"]');
const profileSubNav = document.getElementById('profile-sub-nav');
const ordersMenuToggle = document.querySelector('[data-orders-toggle="true"]');
const ordersSubNav = document.getElementById('orders-sub-nav');
const installmentsMenuToggle = document.querySelector('[data-installments-toggle="true"]');
const installmentsSubNav = document.getElementById('installments-sub-nav');
const accountSections = Array.from(document.querySelectorAll('.account-hub-main > section[id]'));
const accountAvatar = document.querySelector('.account-avatar');
const storeSite = window.StoreSite || null;

const profileSectionIds = ['personal-data-card', 'invoice-data-card', 'addresses-data-card'];
const orderSectionIds = ['pending-orders-card', 'completed-orders-card'];
const installmentSectionIds = ['installments-pending-card', 'installments-completed-card'];

let currentUser = null;
let productsCatalog = null;
let activeProfileUserId = null;
const MAX_ADDRESS_COUNT = 5;
const MAX_INVOICE_COUNT = 5;
const favoritesState = {
  items: [],
  query: '',
  category: 'all',
  page: 1,
  pageSize: 20,
};
const ordersState = {
  items: [],
  pendingPage: 1,
  pendingPageSize: 20,
  completedPage: 1,
  completedPageSize: 20,
  completedQuery: '',
  completedDateWindowDays: 'all',
};

const installmentsState = {
  items: [],
  pendingPage: 1,
  pendingPageSize: 20,
  completedPage: 1,
  completedPageSize: 20,
};

function renderPendingOrdersPagination(totalItems) {
  if (!ordersPendingPagination) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / ordersState.pendingPageSize));
  ordersState.pendingPage = Math.min(ordersState.pendingPage, totalPages);
  ordersPendingPagination.hidden = totalItems === 0 || totalPages === 1;

  if (ordersPendingPagination.hidden) {
    ordersPendingPagination.innerHTML = '';
    return;
  }

  const buttons = [];
  buttons.push(`
    <button class="button button-secondary" type="button" data-pending-page-nav="prev" ${ordersState.pendingPage === 1 ? 'disabled' : ''}>Previous</button>
  `);

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    buttons.push(`
      <button class="${pageNumber === ordersState.pendingPage ? 'button button-primary' : 'button button-secondary'}" type="button" data-pending-page-number="${pageNumber}">${pageNumber}</button>
    `);
  }

  buttons.push(`
    <button class="button button-secondary" type="button" data-pending-page-nav="next" ${ordersState.pendingPage === totalPages ? 'disabled' : ''}>Next</button>
  `);

  ordersPendingPagination.innerHTML = buttons.join('');

  ordersPendingPagination.querySelectorAll('[data-pending-page-number]').forEach((button) => {
    button.addEventListener('click', () => {
      ordersState.pendingPage = Number(button.dataset.pendingPageNumber);
      renderOrders(ordersState.items);
    });
  });

  ordersPendingPagination.querySelectorAll('[data-pending-page-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      ordersState.pendingPage += button.dataset.pendingPageNav === 'next' ? 1 : -1;
      renderOrders(ordersState.items);
    });
  });
}

function renderCompletedOrdersPagination(totalItems) {
  if (!ordersCompletedPagination) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / ordersState.completedPageSize));
  ordersState.completedPage = Math.min(ordersState.completedPage, totalPages);
  ordersCompletedPagination.hidden = totalItems === 0 || totalPages === 1;

  if (ordersCompletedPagination.hidden) {
    ordersCompletedPagination.innerHTML = '';
    return;
  }

  const buttons = [];
  buttons.push(`
    <button class="button button-secondary" type="button" data-completed-page-nav="prev" ${ordersState.completedPage === 1 ? 'disabled' : ''}>Previous</button>
  `);

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    buttons.push(`
      <button class="${pageNumber === ordersState.completedPage ? 'button button-primary' : 'button button-secondary'}" type="button" data-completed-page-number="${pageNumber}">${pageNumber}</button>
    `);
  }

  buttons.push(`
    <button class="button button-secondary" type="button" data-completed-page-nav="next" ${ordersState.completedPage === totalPages ? 'disabled' : ''}>Next</button>
  `);

  ordersCompletedPagination.innerHTML = buttons.join('');

  ordersCompletedPagination.querySelectorAll('[data-completed-page-number]').forEach((button) => {
    button.addEventListener('click', () => {
      ordersState.completedPage = Number(button.dataset.completedPageNumber);
      renderOrders(ordersState.items);
    });
  });

  ordersCompletedPagination.querySelectorAll('[data-completed-page-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      ordersState.completedPage += button.dataset.completedPageNav === 'next' ? 1 : -1;
      renderOrders(ordersState.items);
    });
  });
}

function renderInstallmentsPendingPagination(totalItems) {
  if (!installmentsPendingPagination) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / installmentsState.pendingPageSize));
  installmentsState.pendingPage = Math.min(installmentsState.pendingPage, totalPages);
  installmentsPendingPagination.hidden = totalItems === 0 || totalPages === 1;
  if (installmentsPendingPagination.hidden) { installmentsPendingPagination.innerHTML = ''; return; }
  const buttons = [];
  buttons.push(`<button class="button button-secondary" type="button" data-inst-pending-nav="prev" ${installmentsState.pendingPage === 1 ? 'disabled' : ''}>Previous</button>`);
  for (let p = 1; p <= totalPages; p++) {
    buttons.push(`<button class="${p === installmentsState.pendingPage ? 'button button-primary' : 'button button-secondary'}" type="button" data-inst-pending-page="${p}">${p}</button>`);
  }
  buttons.push(`<button class="button button-secondary" type="button" data-inst-pending-nav="next" ${installmentsState.pendingPage === totalPages ? 'disabled' : ''}>Next</button>`);
  installmentsPendingPagination.innerHTML = buttons.join('');
  installmentsPendingPagination.querySelectorAll('[data-inst-pending-page]').forEach((btn) => {
    btn.addEventListener('click', () => { installmentsState.pendingPage = Number(btn.dataset.instPendingPage); renderInstallmentPurchases(); });
  });
  installmentsPendingPagination.querySelectorAll('[data-inst-pending-nav]').forEach((btn) => {
    btn.addEventListener('click', () => { installmentsState.pendingPage += btn.dataset.instPendingNav === 'next' ? 1 : -1; renderInstallmentPurchases(); });
  });
}

function renderInstallmentsCompletedPagination(totalItems) {
  if (!installmentsCompletedPagination) return;
  const totalPages = Math.max(1, Math.ceil(totalItems / installmentsState.completedPageSize));
  installmentsState.completedPage = Math.min(installmentsState.completedPage, totalPages);
  installmentsCompletedPagination.hidden = totalItems === 0 || totalPages === 1;
  if (installmentsCompletedPagination.hidden) { installmentsCompletedPagination.innerHTML = ''; return; }
  const buttons = [];
  buttons.push(`<button class="button button-secondary" type="button" data-inst-completed-nav="prev" ${installmentsState.completedPage === 1 ? 'disabled' : ''}>Previous</button>`);
  for (let p = 1; p <= totalPages; p++) {
    buttons.push(`<button class="${p === installmentsState.completedPage ? 'button button-primary' : 'button button-secondary'}" type="button" data-inst-completed-page="${p}">${p}</button>`);
  }
  buttons.push(`<button class="button button-secondary" type="button" data-inst-completed-nav="next" ${installmentsState.completedPage === totalPages ? 'disabled' : ''}>Next</button>`);
  installmentsCompletedPagination.innerHTML = buttons.join('');
  installmentsCompletedPagination.querySelectorAll('[data-inst-completed-page]').forEach((btn) => {
    btn.addEventListener('click', () => { installmentsState.completedPage = Number(btn.dataset.instCompletedPage); renderInstallmentPurchases(); });
  });
  installmentsCompletedPagination.querySelectorAll('[data-inst-completed-nav]').forEach((btn) => {
    btn.addEventListener('click', () => { installmentsState.completedPage += btn.dataset.instCompletedNav === 'next' ? 1 : -1; renderInstallmentPurchases(); });
  });
}

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

function syncOrderNavigation(sectionId) {
  const ordersActive = orderSectionIds.includes(sectionId);

  if (ordersMenuToggle) {
    ordersMenuToggle.classList.toggle('is-active', ordersActive);
    ordersMenuToggle.setAttribute('aria-expanded', String(ordersActive));
  }

  if (ordersSubNav) {
    ordersSubNav.hidden = !ordersActive;
  }
}

function syncInstallmentsNavigation(sectionId) {
  const installmentsActive = installmentSectionIds.includes(sectionId);

  if (installmentsMenuToggle) {
    installmentsMenuToggle.classList.toggle('is-active', installmentsActive);
    installmentsMenuToggle.setAttribute('aria-expanded', String(installmentsActive));
  }

  if (installmentsSubNav) {
    installmentsSubNav.hidden = !installmentsActive;
  }
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
  syncOrderNavigation(sectionId);
  syncInstallmentsNavigation(sectionId);

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

function getActiveUserId() {
  return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) || String(currentUser?.id || '').trim() || null;
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

function isCompletedOrder(order) {
  const status = String(order?.status || '').toLowerCase();
  return status === 'completed';
}

function isOrderWithinDateWindow(order, dateWindowDays) {
  if (dateWindowDays === 'all') {
    return true;
  }

  const placedAt = Date.parse(order?.placed_at || '');
  if (!placedAt) {
    return false;
  }

  const windowDays = Number(dateWindowDays);
  if (!windowDays) {
    return true;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Date.now() - placedAt <= windowDays * millisecondsPerDay;
}

function getFilteredCompletedOrders(orders = []) {
  const query = ordersState.completedQuery.trim().toLowerCase();

  return orders.filter((order) => {
    const haystack = [
      order.order_number,
      order.status,
      order.payment_status,
      order.fulfillment_status,
      order.tracking_number,
      order.carrier_name,
      ...(Array.isArray(order.items) ? order.items.map((item) => item.product_name) : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (!query || haystack.includes(query)) && isOrderWithinDateWindow(order, ordersState.completedDateWindowDays);
  });
}

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function getOrderProgressCopy(order) {
  const fulfillmentStatus = String(order?.fulfillment_status || '').trim();
  const orderStatus = String(order?.status || '').trim();
  const paymentStatus = String(order?.payment_status || '').trim();
  const installmentPlan = order?.installment_plan;

  if (installmentPlan && installmentPlan.status === 'active') {
    const paidCount = Number(installmentPlan.paid_count || 0);
    const totalCount = Number(installmentPlan.installment_count || 1);
    return {
      badge: 'Instalments Active',
      detail: `${paidCount} of ${totalCount} instalments paid.`,
    };
  }

  if (installmentPlan && installmentPlan.status === 'completed') {
    return {
      badge: 'Instalments Complete',
      detail: 'All instalments paid.',
    };
  }

  if (fulfillmentStatus) {
    const normalized = fulfillmentStatus.toLowerCase();

    if (normalized.includes('deliver')) {
      return {
        badge: 'Delivered',
        detail: 'Your order has been delivered.',
      };
    }

    if (normalized.includes('ship') || normalized.includes('transit')) {
      return {
        badge: 'On the way',
        detail: 'Your order is on the way.',
      };
    }

    if (normalized.includes('pack') || normalized.includes('ready')) {
      return {
        badge: 'Preparing',
        detail: 'Your order is being prepared for shipment.',
      };
    }

    return {
      badge: toTitleCase(fulfillmentStatus),
      detail: `Current status: ${toTitleCase(fulfillmentStatus)}.`,
    };
  }

  if (orderStatus && orderStatus.toLowerCase() === 'completed') {
    return {
      badge: 'Completed',
      detail: 'This order has been completed.',
    };
  }

  if (paymentStatus && paymentStatus.toLowerCase().includes('paid')) {
    return {
      badge: 'Confirmed',
      detail: 'Payment received. We are preparing your order.',
    };
  }

  return {
    badge: 'Pending',
    detail: 'We received your order and are waiting for the next update.',
  };
}

function getOrderStatusVisual(order) {
  const progress = getOrderProgressCopy(order);
  const normalizedStatus = `${order?.fulfillment_status || ''} ${order?.status || ''}`.toLowerCase();
  const isInTransit = normalizedStatus.includes('ship') || normalizedStatus.includes('transit') || normalizedStatus.includes('deliver');

  return {
    ...progress,
    iconSrc: isInTransit ? 'Photos/delivery-truck.png' : 'Photos/box.png',
  };
}

function getPrimaryShipment(order) {
  if (Array.isArray(order?.shipments) && order.shipments.length > 0) {
    return order.shipments[0];
  }

  if (order?.carrier_name || order?.tracking_number || order?.shipment_status) {
    return {
      carrier_name: order.carrier_name,
      tracking_number: order.tracking_number,
      status: order.shipment_status,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
    };
  }

  return null;
}

function formatOrderAddress(address) {
  if (!address) {
    return 'No shipping address saved yet';
  }

  const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
  return [address.recipient_name, address.line_1, address.line_2, cityLine, address.region, address.country_code].filter(Boolean).join(', ');
}

function renderOrderAddressHtml(address) {
  if (!address) {
    return '<span class="order-addr-empty">No shipping address saved</span>';
  }

  const lines = [
    address.label ? `<span class="order-addr-label">${escapeHtml(address.label)}</span>` : null,
    address.recipient_name ? `<span class="order-addr-name">${escapeHtml(address.recipient_name)}</span>` : null,
    address.line_1 ? `<span>${escapeHtml(address.line_1)}</span>` : null,
    address.line_2 ? `<span>${escapeHtml(address.line_2)}</span>` : null,
    (address.postal_code || address.city)
      ? `<span>${escapeHtml([address.postal_code, address.city].filter(Boolean).join(' '))}</span>`
      : null,
    address.region ? `<span>${escapeHtml(address.region)}</span>` : null,
    address.country_code ? `<span>${escapeHtml(address.country_code)}</span>` : null,
  ].filter(Boolean);

  return lines.length ? lines.join('') : '<span class="order-addr-empty">No shipping address saved</span>';
}

function renderOrderProducts(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) {
    return '<p class="order-detail-copy">No products available yet.</p>';
  }

  return `
    <ul class="order-product-list">
      ${items
        .map(
          (item) => `
            <li class="order-product-row">
              <div>
                <strong>${escapeHtml(item.product_name || item.sku || 'Product')}</strong>
                <small>${escapeHtml(item.sku || 'No SKU')} / Qty ${Number(item.quantity || 0)}</small>
              </div>
              <span>${escapeHtml(formatCurrency(item.line_total || item.unit_price || 0, order.currency_code || 'EUR'))}</span>
            </li>
          `,
        )
        .join('')}
    </ul>
  `;
}

function getOrderItemNames(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) {
    return 'No products available yet';
  }

  const visibleNames = items.slice(0, 3).map((item) => item.product_name || item.sku || 'Product');
  const remainingCount = items.length - visibleNames.length;
  return remainingCount > 0 ? `${visibleNames.join(', ')} and ${remainingCount} more` : visibleNames.join(', ');
}

function renderOrderSummaryCard(order) {
  const visual = getOrderStatusVisual(order);
  const shippingAddress = order?.shipping_address || order?.billing_address || null;
  const paymentLabel = [order?.payment_provider, toTitleCase(order?.payment_status || '')].filter(Boolean).join(' / ');
  const orderUrl = `order.html?orderId=${encodeURIComponent(order.order_id || order.id || '')}`;

  return `
    <article class="order-summary-card" data-order-url="${escapeHtml(orderUrl)}" tabindex="0" role="link" aria-label="Open order ${escapeHtml(
      order.order_number || 'details',
    )}">
      <div class="order-summary-head">
        <div class="order-summary-copy">
          <p class="eyebrow">Order</p>
          <strong>${escapeHtml(order.order_number || 'Order')}</strong>
          <small>${escapeHtml(order.placed_at || 'No date yet')}</small>
        </div>
        <div class="order-summary-status">
          <img class="order-status-icon" src="${escapeHtml(visual.iconSrc)}" alt="" />
          <div>
            <span class="record-pill">${escapeHtml(visual.badge)}</span>
            <small>${escapeHtml(paymentLabel || visual.detail)}</small>
          </div>
        </div>
      </div>
      <div class="order-summary-grid">
        <div class="order-summary-section">
          <span>Products</span>
          <strong>${escapeHtml(getOrderItemNames(order))}</strong>
        </div>
        <div class="order-summary-section">
          <span>Ship to</span>
          <address class="order-summary-addr">${renderOrderAddressHtml(shippingAddress)}</address>
        </div>
        <div class="order-summary-section">
          <span>Contact</span>
          <strong>${escapeHtml(order?.customer_phone || 'No phone saved')}</strong>
        </div>
      </div>
      <div class="order-summary-footer">
        <div class="order-summary-total">
          <span>Total cost</span>
          <strong>${escapeHtml(formatCurrency(order.total_amount || 0, order.currency_code || 'EUR'))}</strong>
        </div>
      </div>
    </article>
  `;
}

function bindOrderSummaryLinks(container) {
  if (!container) {
    return;
  }

  container.querySelectorAll('[data-order-url]').forEach((card) => {
    const openOrder = () => {
      if (card.dataset.orderUrl) {
        window.location.href = card.dataset.orderUrl;
      }
    };

    card.addEventListener('click', openOrder);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openOrder();
      }
    });
  });
}

function renderOrders(orders = []) {
  if (!accountOrdersPendingList || !accountOrdersCompletedList) {
    return;
  }

  ordersState.items = Array.isArray(orders) ? orders.slice() : [];

  const pendingOrders = ordersState.items.filter((order) => !isCompletedOrder(order));
  const allCompletedOrders = getFilteredCompletedOrders(ordersState.items.filter((order) => isCompletedOrder(order)));

  // Pending pagination
  const totalPendingPages = Math.max(1, Math.ceil(pendingOrders.length / ordersState.pendingPageSize));
  ordersState.pendingPage = Math.min(ordersState.pendingPage, totalPendingPages);
  const pendingStartIndex = (ordersState.pendingPage - 1) * ordersState.pendingPageSize;
  const visiblePendingOrders = pendingOrders.slice(pendingStartIndex, pendingStartIndex + ordersState.pendingPageSize);

  // Completed pagination
  const totalCompletedPages = Math.max(1, Math.ceil(allCompletedOrders.length / ordersState.completedPageSize));
  ordersState.completedPage = Math.min(ordersState.completedPage, totalCompletedPages);
  const completedStartIndex = (ordersState.completedPage - 1) * ordersState.completedPageSize;
  const visibleCompletedOrders = allCompletedOrders.slice(completedStartIndex, completedStartIndex + ordersState.completedPageSize);

  accountOrdersPendingList.innerHTML = '';
  accountOrdersCompletedList.innerHTML = '';

  if (orders.length === 0) {
    accountOrdersPendingList.innerHTML = '<p class="account-empty">No pending orders</p>';
    accountOrdersCompletedList.innerHTML = '<p class="account-empty">No completed orders</p>';
    renderPendingOrdersPagination(0);
    renderCompletedOrdersPagination(0);
    return;
  }

  if (pendingOrders.length === 0) {
    accountOrdersPendingList.innerHTML = '<p class="account-empty">No pending orders</p>';
    renderPendingOrdersPagination(0);
  } else {
    accountOrdersPendingList.innerHTML = visiblePendingOrders.map((order) => renderOrderSummaryCard(order)).join('');
    bindOrderSummaryLinks(accountOrdersPendingList);
    renderPendingOrdersPagination(pendingOrders.length);
  }

  if (allCompletedOrders.length === 0) {
    accountOrdersCompletedList.innerHTML = '<p class="account-empty">No completed orders match the current filters</p>';
    renderCompletedOrdersPagination(0);
    return;
  }

  accountOrdersCompletedList.innerHTML = visibleCompletedOrders.map((order) => renderOrderSummaryCard(order)).join('');
  bindOrderSummaryLinks(accountOrdersCompletedList);
  renderCompletedOrdersPagination(allCompletedOrders.length);
}

function renderInstallmentPurchases() {
  if (!accountInstallmentsPendingList && !accountInstallmentsCompletedList) {
    return;
  }

  const userId = getActiveUserId();
  if (!userId) {
    if (accountInstallmentsPendingList) accountInstallmentsPendingList.innerHTML = '<p class="account-empty">No pending installments</p>';
    if (accountInstallmentsCompletedList) accountInstallmentsCompletedList.innerHTML = '<p class="account-empty">No completed installments</p>';
    return;
  }

  fetch(`/api/installments?user_id=${encodeURIComponent(userId)}`)
    .then((r) => r.json())
    .then((data) => {
      const all = Array.isArray(data.items) ? data.items : [];
      installmentsState.items = all;

      // Pending = active, sorted soonest next_due_date first
      const pending = all
        .filter((p) => p.status === 'active')
        .sort((a, b) => {
          if (!a.next_due_date) return 1;
          if (!b.next_due_date) return -1;
          return a.next_due_date < b.next_due_date ? -1 : 1;
        });

      // Completed = everything else (completed / defaulted / cancelled)
      const completed = all.filter((p) => p.status !== 'active');

      // ── Render pending ───────────────────────────────────────────────
      if (accountInstallmentsPendingList) {
        if (pending.length === 0) {
          accountInstallmentsPendingList.innerHTML = '<p class="account-empty">No pending installments</p>';
          if (installmentsPendingPagination) { installmentsPendingPagination.hidden = true; installmentsPendingPagination.innerHTML = ''; }
        } else {
          const start = (installmentsState.pendingPage - 1) * installmentsState.pendingPageSize;
          const page = pending.slice(start, start + installmentsState.pendingPageSize);
          accountInstallmentsPendingList.innerHTML = page.map((plan) => renderInstallmentCard(plan)).join('');
          bindInstallmentPayButtons(accountInstallmentsPendingList);
          renderInstallmentsPendingPagination(pending.length);
        }
      }

      // ── Render completed ─────────────────────────────────────────────
      if (accountInstallmentsCompletedList) {
        if (completed.length === 0) {
          accountInstallmentsCompletedList.innerHTML = '<p class="account-empty">No completed installments</p>';
          if (installmentsCompletedPagination) { installmentsCompletedPagination.hidden = true; installmentsCompletedPagination.innerHTML = ''; }
        } else {
          const start = (installmentsState.completedPage - 1) * installmentsState.completedPageSize;
          const page = completed.slice(start, start + installmentsState.completedPageSize);
          accountInstallmentsCompletedList.innerHTML = page.map((plan) => renderInstallmentCard(plan)).join('');
          renderInstallmentsCompletedPagination(completed.length);
        }
      }
    })
    .catch(() => {
      if (accountInstallmentsPendingList) accountInstallmentsPendingList.innerHTML = '<p class="account-empty">Could not load installments</p>';
      if (accountInstallmentsCompletedList) accountInstallmentsCompletedList.innerHTML = '';
    });
}

function renderInstallmentCard(plan) {
  const paidCount = Number(plan.paid_count || 0);
  const total = Number(plan.installment_count || 1);
  const remaining = total - paidCount;
  const amount = Number(plan.installment_amount || 0);
  const currency = escapeHtml(plan.currency_code || 'EUR');
  const isActive = plan.status === 'active';
  const progressPct = Math.round((paidCount / total) * 100);

  const statusLabel = { active: 'Active', completed: 'Completed', defaulted: 'Defaulted', cancelled: 'Cancelled' }[plan.status] || escapeHtml(plan.status);
  const statusClass = { active: 'installment-badge--active', completed: 'installment-badge--done', defaulted: 'installment-badge--warn', cancelled: 'installment-badge--warn' }[plan.status] || '';

  const productList = Array.isArray(plan.order_items)
    ? plan.order_items.map((item) => `<span class="installment-product-tag">${escapeHtml(item.product_name)} ×${item.quantity}</span>`).join('')
    : '';

  const paymentsRows = Array.isArray(plan.payments)
    ? plan.payments.map((p) => {
        const isPaid = p.status === 'paid';
        const paidOn = isPaid && p.paid_at ? p.paid_at.slice(0, 10) : null;
        return `
        <li class="installment-schedule-row ${isPaid ? 'is-paid' : ''}">
          <span class="installment-schedule-num">#${p.installment_number}</span>
          <span class="installment-schedule-amount">${formatCurrency(p.amount, plan.currency_code)}</span>
          <span class="installment-schedule-date">${escapeHtml(p.due_date || '—')}</span>
          <span class="installment-schedule-status">
            ${isPaid ? `<span class="inst-paid-check">✓ Paid</span>${paidOn ? `<span class="inst-paid-on">on ${escapeHtml(paidOn)}</span>` : ''}` : escapeHtml(p.status)}
          </span>
        </li>`;
      }).join('')
    : '';

  return `
  <article class="installment-plan-card installment-plan-card--link" data-plan-id="${plan.id}" data-order-href="order.html?orderId=${encodeURIComponent(plan.order_id)}" role="link" tabindex="0">
    <div class="installment-plan-head">
      <div class="installment-plan-title">
        <strong class="installment-order-ref">Order ${escapeHtml(plan.order_number)}</strong>
        <span class="installment-badge ${statusClass}">${statusLabel}</span>
      </div>
    </div>
    <div class="installment-products">${productList}</div>
    <div class="installment-progress-block">
      <div class="installment-progress-labels">
        <span><strong>${paidCount}</strong> of <strong>${total}</strong> paid</span>
        <span>${remaining > 0 ? `${remaining} remaining` : 'All paid'}</span>
      </div>
      <div class="installment-progress-track" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100">
        <div class="installment-progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="installment-amount-line">
        ${formatCurrency(amount, plan.currency_code)} per installment
        · Total: ${formatCurrency(plan.total_amount, plan.currency_code)}
        ${isActive && plan.next_due_date ? `· Next due: <strong>${escapeHtml(plan.next_due_date)}</strong>` : ''}
      </div>
    </div>
    <details class="installment-schedule" onclick="event.stopPropagation()">
      <summary class="installment-schedule-toggle">Payment schedule</summary>
      <ul class="installment-schedule-list">${paymentsRows}</ul>
    </details>
    ${isActive && remaining > 0 ? `
    <div class="installment-actions">
      <button class="button installment-pay-btn" data-plan-id="${plan.id}" data-amount="${amount}" data-currency="${currency}">
        Pay next installment — ${formatCurrency(amount, plan.currency_code)}
      </button>
    </div>` : ''}
  </article>`;
}

function bindInstallmentPayButtons(container) {
  // Make the whole card navigate to the order (except interactive children)
  container.querySelectorAll('.installment-plan-card--link').forEach((card) => {
    const href = card.dataset.orderHref;
    if (!href) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('button, a, details, summary')) return;
      window.location.href = href;
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, a, details, summary')) {
        window.location.href = href;
      }
    });
  });

  container.querySelectorAll('.installment-pay-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.planId;
      btn.disabled = true;
      btn.textContent = 'Processing…';

      fetch(`/api/installments/${planId}/pay`, { method: 'POST' })
        .then((r) => r.json())
        .then((res) => {
          if (res.error) {
            btn.disabled = false;
            btn.textContent = `Pay next installment — ${formatCurrency(btn.dataset.amount, btn.dataset.currency)}`;
            alert(res.error);
            return;
          }
          renderInstallmentPurchases();
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = `Pay next installment — ${formatCurrency(btn.dataset.amount, btn.dataset.currency)}`;
        });
    });
  });
}

function renderCoupons() {
  if (!accountCouponsList) {
    return;
  }

  const userId = getActiveUserId();
  if (!userId) {
    accountCouponsList.innerHTML = '<p class="account-empty">No coupons available yet</p>';
    return;
  }

  fetch(`/api/coupons?user_id=${encodeURIComponent(userId)}`)
    .then((r) => r.json())
    .then((data) => {
      const coupons = (Array.isArray(data.items) ? data.items : []).filter((c) => !c.used_at);
      if (coupons.length === 0) {
        accountCouponsList.innerHTML = '<p class="account-empty">No coupons available yet</p>';
        return;
      }

      accountCouponsList.innerHTML = coupons.map((c) => {
        const isExpired = c.valid_until && c.valid_until < new Date().toISOString().slice(0, 10);
        const isInactive = !c.is_active || isExpired;

        const stateClass = isInactive ? 'coupon-card--expired' : 'coupon-card--active';
        const stateLabel = isExpired ? 'Expired' : !c.is_active ? 'Inactive' : 'Active';
        const stateBadgeClass = isInactive ? 'coupon-badge--expired' : 'coupon-badge--active';

        const discountDisplay = c.discount_type === 'percent'
          ? `${Number(c.discount_value)}% off`
          : `${formatCurrency(c.discount_value, c.currency_code)} off`;

        const minOrder = c.min_order_amount
          ? `Min. order ${formatCurrency(c.min_order_amount, c.currency_code)}`
          : 'No minimum order';

        const validUntil = c.valid_until ? `Valid until ${escapeHtml(c.valid_until)}` : 'No expiry';

        return `
        <article class="coupon-card ${stateClass}">
          <div class="coupon-discount-strip">
            <span class="coupon-discount-value">${discountDisplay}</span>
            <span class="coupon-badge ${stateBadgeClass}">${stateLabel}</span>
          </div>
          <div class="coupon-body">
            <div class="coupon-code-row">
              <span class="coupon-code">${escapeHtml(c.code)}</span>
              ${!isInactive ? `<button class="coupon-copy-btn" data-code="${escapeHtml(c.code)}" title="Copy code">Copy</button>` : ''}
            </div>
            <p class="coupon-description">${escapeHtml(c.description || '')}</p>
            <ul class="coupon-meta-list">
              <li>${minOrder}</li>
              <li>${validUntil}</li>
            </ul>
          </div>
        </article>`;
      }).join('');

      accountCouponsList.querySelectorAll('.coupon-copy-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.code).then(() => {
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = original; }, 1800);
          });
        });
      });
    })
    .catch(() => {
      accountCouponsList.innerHTML = '<p class="account-empty">Could not load coupons</p>';
    });
}

function formatCurrency(value, currencyCode = 'EUR') {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function truncateText(text, maxLength = 120) {
  if (!text) {
    return '';
  }

  const normalizedText = String(text).trim();
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trimEnd()}...`;
}

function syncInvoiceActions(invoiceProfiles = currentUser?.invoice_profiles || []) {
  if (!invoiceActionsRow) {
    return;
  }

  invoiceActionsRow.hidden = (Array.isArray(invoiceProfiles) ? invoiceProfiles.length : 0) >= MAX_INVOICE_COUNT;
}

function syncAddressActions(addresses = currentUser?.addresses || []) {
  if (!addressActionsRow) {
    return;
  }

  addressActionsRow.hidden = (Array.isArray(addresses) ? addresses.length : 0) >= MAX_ADDRESS_COUNT;
}

function getFavoriteCategories(products = []) {
  return [...new Set(products.map((product) => String(product.category_name || '').trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function getFilteredFavoriteProducts() {
  const query = favoritesState.query.trim().toLowerCase();

  return favoritesState.items.filter((product) => {
    const matchesCategory = favoritesState.category === 'all' || (product.category_name || '') === favoritesState.category;
    const haystack = [product.product_name, product.brand, product.category_name, product.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesQuery;
  });
}

function renderFavoriteFilters(products = []) {
  if (!favoritesFilterChips) {
    return;
  }

  const filters = [{ label: 'All', value: 'all' }, ...getFavoriteCategories(products).map((category) => ({ label: category, value: category }))];

  favoritesFilterChips.innerHTML = '';
  filters.forEach((filter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.textContent = filter.label;
    button.classList.toggle('is-active', favoritesState.category === filter.value);
    button.addEventListener('click', () => {
      favoritesState.category = filter.value;
      favoritesState.page = 1;
      renderFavorites(favoritesState.items);
    });
    favoritesFilterChips.appendChild(button);
  });
}

function renderFavoritePagination(totalItems) {
  if (!favoritesPagination) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / favoritesState.pageSize));
  favoritesState.page = Math.min(favoritesState.page, totalPages);
  favoritesPagination.hidden = totalItems === 0 || totalPages === 1;

  if (favoritesPagination.hidden) {
    favoritesPagination.innerHTML = '';
    return;
  }

  const buttons = [];
  buttons.push(`
    <button class="button button-secondary" type="button" data-page-nav="prev" ${favoritesState.page === 1 ? 'disabled' : ''}>Previous</button>
  `);

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    buttons.push(`
      <button class="${pageNumber === favoritesState.page ? 'button button-primary' : 'button button-secondary'}" type="button" data-page-number="${pageNumber}">${pageNumber}</button>
    `);
  }

  buttons.push(`
    <button class="button button-secondary" type="button" data-page-nav="next" ${favoritesState.page === totalPages ? 'disabled' : ''}>Next</button>
  `);

  favoritesPagination.innerHTML = buttons.join('');

  favoritesPagination.querySelectorAll('[data-page-number]').forEach((button) => {
    button.addEventListener('click', () => {
      favoritesState.page = Number(button.dataset.pageNumber);
      renderFavorites(favoritesState.items);
    });
  });

  favoritesPagination.querySelectorAll('[data-page-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      favoritesState.page += button.dataset.pageNav === 'next' ? 1 : -1;
      renderFavorites(favoritesState.items);
    });
  });
}

function renderFavorites(favoriteProducts = []) {
  if (!accountFavoritesList) {
    return;
  }

  favoritesState.items = favoriteProducts.slice();
  renderFavoriteFilters(favoriteProducts);

  const filteredProducts = getFilteredFavoriteProducts();
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / favoritesState.pageSize));
  favoritesState.page = Math.min(favoritesState.page, totalPages);
  const startIndex = (favoritesState.page - 1) * favoritesState.pageSize;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + favoritesState.pageSize);

  if (favoritesResultsSummary) {
    favoritesResultsSummary.textContent = `${totalProducts} product${totalProducts === 1 ? '' : 's'}`;
  }

  if (favoriteProducts.length === 0) {
    accountFavoritesList.innerHTML = '<p class="account-empty">No favorite products saved yet</p>';
    renderFavoritePagination(0);
    return;
  }

  if (filteredProducts.length === 0) {
    accountFavoritesList.innerHTML = '<p class="account-empty">No favorite products match the current search or filter</p>';
    renderFavoritePagination(0);
    return;
  }

  accountFavoritesList.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="summary-record-card profile-inline-record-card favorite-summary-card">
          <div class="summary-record-head">
            <div>
              <strong>${escapeHtml(product.product_name)}</strong>
              <p class="form-helper">${escapeHtml(product.category_name || 'Uncategorized')} / ${escapeHtml(product.brand || 'Bluehaven Select')}</p>
            </div>
            <div class="account-section-actions">
              <span class="summary-pill">${escapeHtml(formatCurrency(product.cost, product.currency_code))}</span>
              <button class="button button-secondary" type="button" data-remove-favorite="${escapeHtml(product.product_id ?? product.id)}">Remove</button>
            </div>
          </div>
          <div class="record-card-copy">
            <p>${escapeHtml(truncateText(product.description || ''))}</p>
          </div>
        </article>
      `,
    )
    .join('');

  renderFavoritePagination(totalProducts);

  accountFavoritesList.querySelectorAll('[data-remove-favorite]').forEach((button) => {
    button.addEventListener('click', () => {
      storeSite?.toggleFavoriteProduct?.(Number(button.dataset.removeFavorite));
    });
  });
}

async function getProductsCatalog() {
  if (Array.isArray(productsCatalog)) {
    return productsCatalog;
  }

  const response = await fetchJson('/api/products');
  productsCatalog = Array.isArray(response.items) ? response.items : [];
  return productsCatalog;
}

async function refreshFavorites() {
  if (!accountFavoritesList) {
    return;
  }

  const favoriteIds = storeSite?.getFavoriteProductIds?.() || [];
  if (favoriteIds.length === 0) {
    favoritesState.page = 1;
    renderFavorites([]);
    return;
  }

  accountFavoritesList.innerHTML = '<p class="account-empty">Loading favorite products</p>';

  try {
    const products = await getProductsCatalog();
    const productsById = new Map(products.map((product) => [Number(product.product_id ?? product.id), product]));
    const favoriteProducts = favoriteIds.map((id) => productsById.get(id)).filter(Boolean);
    renderFavorites(favoriteProducts);
  } catch {
    accountFavoritesList.innerHTML = '<p class="account-empty">Unable to load favorite products right now</p>';
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

  syncAddressActions(addresses);

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
        <article class="summary-record-card profile-inline-record-card address-summary-card">
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
          <div class="address-summary-list">
            <div class="summary-row">
              <span>Address line 1</span>
              <strong>${escapeHtml(address.line_1 || 'Not set')}</strong>
            </div>
            ${address.line_2 ? `
              <div class="summary-row">
                <span>Address line 2</span>
                <strong>${escapeHtml(address.line_2)}</strong>
              </div>
            ` : ''}
            <div class="summary-row">
              <span>City</span>
              <strong>${escapeHtml(address.city || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Postal code</span>
              <strong>${escapeHtml(address.postal_code || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Region</span>
              <strong>${escapeHtml(address.region || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Country code</span>
              <strong>${escapeHtml(address.country_code || 'Not set')}</strong>
            </div>
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

function renderInvoiceSummary(invoiceProfiles = []) {
  if (!accountInvoiceSummary) {
    return;
  }

  const items = (Array.isArray(invoiceProfiles) ? invoiceProfiles : []).slice().sort((left, right) => {
    const leftCreatedAt = Date.parse(left?.created_at || '') || 0;
    const rightCreatedAt = Date.parse(right?.created_at || '') || 0;

    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return Number(left?.id || 0) - Number(right?.id || 0);
  });

  if (items.length === 0) {
    accountInvoiceSummary.innerHTML = '<p class="account-empty">No invoice profiles saved</p>';
    syncInvoiceActions([]);
    return;
  }

  accountInvoiceSummary.innerHTML = items
    .map(
      (invoiceProfile) => `
        <article class="summary-record-card profile-inline-record-card invoice-summary-card">
          <div class="summary-record-head">
            <div>
              <strong>${escapeHtml(invoiceProfile.company_name || 'Invoice profile')}</strong>
            </div>
            <div class="account-section-actions">
              <button class="button button-secondary" type="button" data-edit-invoice="${escapeHtml(invoiceProfile.id)}">Edit</button>
              <button class="button button-danger" type="button" data-delete-invoice="${escapeHtml(invoiceProfile.id)}">Remove</button>
            </div>
          </div>
          <div class="invoice-summary-list">
            <div class="summary-row">
              <span>VAT number</span>
              <strong>${escapeHtml(invoiceProfile.tax_id || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Tax office</span>
              <strong>${escapeHtml(invoiceProfile.tax_office || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Profession</span>
              <strong>${escapeHtml(invoiceProfile.profession || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Phone</span>
              <strong>${escapeHtml(invoiceProfile.phone || 'Not set')}</strong>
            </div>
            <div class="summary-row">
              <span>Billing address</span>
              <strong>${escapeHtml(
                [invoiceProfile.line_1, invoiceProfile.city, invoiceProfile.postal_code, invoiceProfile.region].filter(Boolean).join(', ') || 'Not set',
              )}</strong>
            </div>
          </div>
        </article>
      `,
    )
    .join('');

  accountInvoiceSummary.querySelectorAll('[data-edit-invoice]').forEach((button) => {
    button.addEventListener('click', () => openInvoiceEditor(Number(button.dataset.editInvoice)));
  });

  accountInvoiceSummary.querySelectorAll('[data-delete-invoice]').forEach((button) => {
    button.addEventListener('click', () => handleDeleteInvoiceSummary(Number(button.dataset.deleteInvoice)));
  });

  syncInvoiceActions(items);
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
  addressForm.elements.line_1.value = address?.line_1 || '';
  addressForm.elements.line_2.value = address?.line_2 || '';
  addressForm.elements.city.value = address?.city || '';
  addressForm.elements.postal_code.value = address?.postal_code || '';
  addressForm.elements.region.value = address?.region || '';
  addressForm.elements.country_code.value = address?.country_code || 'GR';
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
  syncAddressActions();
}

function openInvoiceForm(invoice = null) {
  if (!invoiceFormCard || !invoiceForm) {
    return;
  }

  clearAccountMessage();
  invoiceForm.reset();
  invoiceForm.elements.invoice_id.value = invoice?.id ? String(invoice.id) : '';
  invoiceForm.elements.company_name.value = invoice?.company_name || '';
  invoiceForm.elements.tax_id.value = invoice?.tax_id || '';
  invoiceForm.elements.tax_office.value = invoice?.tax_office || '';
  invoiceForm.elements.profession.value = invoice?.profession || '';
  invoiceForm.elements.line_1.value = invoice?.line_1 || '';
  invoiceForm.elements.city.value = invoice?.city || '';
  invoiceForm.elements.postal_code.value = invoice?.postal_code || '';
  invoiceForm.elements.region.value = invoice?.region || '';
  invoiceForm.elements.phone.value = invoice?.phone || currentUser?.phone || '';
  if (accountInvoiceSummary) {
    accountInvoiceSummary.hidden = true;
  }
  if (invoiceActionsRow) {
    invoiceActionsRow.hidden = true;
  }
  invoiceFormCard.hidden = false;
}

function openInvoiceEditor(invoiceId) {
  const invoice = currentUser?.invoice_profiles?.find((item) => Number(item.id) === Number(invoiceId)) || null;
  openInvoiceForm(invoice);
}

function openInvoiceCreator() {
  openInvoiceForm(null);
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
  syncInvoiceActions();
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
  const invoiceProfile = userPayload.invoice_profiles?.[0] || userPayload.invoice_profile || {};
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
  renderOrders(orders);
  renderInstallmentPurchases();
  renderCoupons();
  void refreshFavorites();
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
  renderInvoiceSummary(Array.isArray(userPayload.invoice_profiles) ? userPayload.invoice_profiles : []);
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
  const userId = getActiveUserId();
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

async function handleDeleteInvoiceSummary(invoiceId) {
  const userId = getActiveUserId();
  if (!userId || !invoiceId || !window.confirm('Delete the invoice profile?')) {
    return;
  }

  try {
    await fetchJson(`/api/users/${encodeURIComponent(userId)}/invoice-profiles/${encodeURIComponent(invoiceId)}`, {
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
  currentUser = null;
  activeProfileUserId = null;
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
  activeProfileUserId = String(user.id);
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
      if (activeProfileUserId !== String(user.id) || getActiveUserId() !== String(user.id)) {
        return;
      }
      applyUserDetails(userPayload);
    })
    .catch(() => {
      renderOrders([]);
      renderInstallmentPurchases();
      renderCoupons();
      renderFavorites([]);
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
  const userId = getActiveUserId();
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
  const userId = getActiveUserId();
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
    closePersonalEditor();
    setMessage('Personal data saved');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function handleAddressSave(event) {
  event.preventDefault();
  const userId = getActiveUserId();
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
    const updatedUser = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
    closeAddressEditor();
    applyUserDetails(updatedUser);
  } catch (error) {
    console.error(error);
  }
}

async function handleInvoiceSave(event) {
  event.preventDefault();
  const userId = getActiveUserId();
  if (!userId) {
    return;
  }

  const formData = new FormData(event.currentTarget);
  const invoiceId = String(formData.get('invoice_id') || '').trim();
  try {
    await fetchJson(
      invoiceId
        ? `/api/users/${encodeURIComponent(userId)}/invoice-profiles/${encodeURIComponent(invoiceId)}`
        : `/api/users/${encodeURIComponent(userId)}/invoice-profiles`,
      {
        method: invoiceId ? 'PATCH' : 'POST',
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
      },
    );
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
  introSignupButton.addEventListener('click', () => {
    setAuthMode('register');
    document.getElementById('auth-forms-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Invoice details toggle
const invoiceToggle = document.getElementById('invoice-toggle');
const invoiceDetails = document.getElementById('invoice-details');
if (invoiceToggle && invoiceDetails) {
  invoiceToggle.addEventListener('change', () => {
    invoiceDetails.hidden = !invoiceToggle.checked;
  });
}

// Password visibility toggles
document.querySelectorAll('.auth-pw-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const wrap = toggle.closest('.auth-input-wrap');
    const input = wrap?.querySelector('input[type="password"], input[type="text"]');
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    toggle.style.color = isHidden ? 'var(--primary)' : '';
  });
});

if (loginSignupButton) {
  loginSignupButton.addEventListener('click', () => setAuthMode('register'));
}

if (registerLoginButton) {
  registerLoginButton.addEventListener('click', () => {
    setAuthMode('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
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
  invoiceAddButton.addEventListener('click', openInvoiceCreator);
}

if (invoiceCancelButton) {
  invoiceCancelButton.addEventListener('click', closeInvoiceEditor);
}

accountSideLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const sectionId = link.dataset.section || 'personal-data-card';
    setActiveAccountSection(sectionId);
    if (sectionId === 'coupons-card') {
      renderCoupons();
    }
  });
});

accountSubLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const sectionId = link.dataset.section || 'personal-data-card';
    setActiveAccountSection(sectionId);
    if (sectionId === 'installments-pending-card' || sectionId === 'installments-completed-card') {
      renderInstallmentPurchases();
    }
  });
});

if (profileMenuToggle) {
  profileMenuToggle.addEventListener('click', () => {
    setActiveAccountSection('personal-data-card');
  });
}

if (ordersMenuToggle) {
  ordersMenuToggle.addEventListener('click', () => {
    setActiveAccountSection('pending-orders-card');
  });
}

if (installmentsMenuToggle) {
  installmentsMenuToggle.addEventListener('click', () => {
    setActiveAccountSection('installments-pending-card');
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

if (favoritesSearchInput) {
  favoritesSearchInput.addEventListener('input', (event) => {
    favoritesState.query = event.currentTarget.value;
    favoritesState.page = 1;
    renderFavorites(favoritesState.items);
  });
}

if (ordersSearchInput) {
  ordersSearchInput.addEventListener('input', (event) => {
    ordersState.completedQuery = event.currentTarget.value;
    ordersState.completedPage = 1;
    renderOrders(ordersState.items);
  });
}

if (ordersDateFilter) {
  ordersDateFilter.addEventListener('change', (event) => {
    ordersState.completedDateWindowDays = event.currentTarget.value;
    ordersState.completedPage = 1;
    renderOrders(ordersState.items);
  });
}

window.addEventListener('store:favorites-changed', () => {
  if (!accountPanel || accountPanel.hidden) {
    return;
  }

  void refreshFavorites();
});

restoreSession();
