(() => {
  const storeSite = window.StoreSite;

  const accessGate = document.getElementById('admin-access-gate');
  const accessGateTitle = document.getElementById('admin-access-gate-title');
  const accessGateMessage = document.getElementById('admin-access-gate-message');
  const adminShell = document.getElementById('admin-shell');

  const tabButtons = Array.from(document.querySelectorAll('[data-admin-tab]'));
  const panels = {
    products: document.getElementById('admin-panel-products'),
    orders: document.getElementById('admin-panel-orders'),
    stats: document.getElementById('admin-panel-stats'),
  };

  const categorySelect = document.getElementById('admin-field-category');
  const productForm = document.getElementById('admin-product-form');
  const productFormMessage = document.getElementById('admin-product-form-message');
  const productSubmitButton = document.getElementById('admin-product-submit');
  const productsTableBody = document.getElementById('admin-products-table-body');
  const productsEmpty = document.getElementById('admin-products-empty');

  const ordersTableBody = document.getElementById('admin-orders-table-body');
  const ordersEmpty = document.getElementById('admin-orders-empty');

  const statsGrid = document.getElementById('admin-stats-grid');
  const trendingList = document.getElementById('admin-trending-list');
  const bestCategoryList = document.getElementById('admin-best-category-list');
  const lowStockList = document.getElementById('admin-low-stock-list');

  let sessionToken = null;
  let statsLoaded = false;
  let ordersLoaded = false;

  function formatCurrency(amount, currencyCode) {
    const value = Number(amount) || 0;
    try {
      return new Intl.NumberFormat('en-IE', { style: 'currency', currency: currencyCode || 'EUR' }).format(value);
    } catch {
      return `€${value.toFixed(2)}`;
    }
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
    ));
  }

  async function checkAccess() {
    const userId = storeSite?.getCurrentUserId?.();
    const token = storeSite?.getSessionToken?.();

    if (!userId || !token) {
      accessGateTitle.textContent = 'Please log in';
      accessGateMessage.textContent = 'You need to log in with an admin account to view this page.';
      accessGate.hidden = false;
      return false;
    }

    try {
      const response = await fetch(`/api/auth/session?token=${encodeURIComponent(token)}`);
      if (!response.ok) {
        throw new Error('Session check failed');
      }
      const payload = await response.json();
      if (payload.user?.role !== 'admin') {
        accessGateTitle.textContent = 'Access denied';
        accessGateMessage.textContent = 'This account does not have admin access.';
        accessGate.hidden = false;
        return false;
      }
    } catch {
      accessGateTitle.textContent = 'Could not verify access';
      accessGateMessage.textContent = 'Something went wrong checking your session. Please try logging in again.';
      accessGate.hidden = false;
      return false;
    }

    sessionToken = token;
    adminShell.hidden = false;
    return true;
  }

  function switchTab(tabName) {
    tabButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.adminTab === tabName);
    });
    Object.entries(panels).forEach(([name, panel]) => {
      if (panel) panel.hidden = name !== tabName;
    });

    if (tabName === 'orders' && !ordersLoaded) {
      void loadOrders();
    }
    if (tabName === 'stats' && !statsLoaded) {
      void loadStats();
    }
  }

  async function loadCategories() {
    const response = await fetch('/api/categories');
    if (!response.ok) return;
    const payload = await response.json();
    const categories = Array.isArray(payload.items) ? payload.items : [];
    categorySelect.innerHTML = categories
      .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
      .join('');
  }

  function renderProductsTable(products) {
    if (!productsTableBody) return;
    if (!products.length) {
      productsTableBody.innerHTML = '';
      productsEmpty.hidden = false;
      return;
    }
    productsEmpty.hidden = true;

    productsTableBody.innerHTML = products
      .map((product) => {
        const code = String(product.product_id).padStart(6, '0');
        const statusClass = product.is_active ? 'is-active' : 'is-inactive';
        const statusLabel = product.is_active ? 'Active' : 'Removed';
        const photoMarkup = product.primary_photo_url
          ? `<img class="admin-product-thumb" src="${escapeHtml(product.primary_photo_url)}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('—'))" />`
          : '—';
        return `
          <tr data-product-row="${product.product_id}">
            <td>${photoMarkup}</td>
            <td>${code}</td>
            <td>${escapeHtml(product.product_name)}</td>
            <td>${escapeHtml(product.category_name)}</td>
            <td>${formatCurrency(product.cost, product.currency_code)}</td>
            <td>${Number(product.stock_quantity) || 0}</td>
            <td><span class="admin-status-pill ${statusClass}">${statusLabel}</span></td>
            <td>
              ${product.is_active
                ? `<button class="button button-secondary" type="button" data-remove-product="${product.product_id}">Remove</button>`
                : ''}
            </td>
          </tr>
        `;
      })
      .join('');

    productsTableBody.querySelectorAll('[data-remove-product]').forEach((button) => {
      button.addEventListener('click', () => {
        void removeProduct(Number(button.dataset.removeProduct));
      });
    });
  }

  async function loadProducts() {
    const response = await fetch(`/api/admin/products?token=${encodeURIComponent(sessionToken)}`);
    if (!response.ok) return;
    const payload = await response.json();
    renderProductsTable(Array.isArray(payload.items) ? payload.items : []);
  }

  async function removeProduct(productId) {
    if (!window.confirm('Remove this product from the store?')) {
      return;
    }
    const response = await fetch(`/api/admin/products/${productId}?token=${encodeURIComponent(sessionToken)}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      void loadProducts();
    } else {
      window.alert('Failed to remove product.');
    }
  }

  function setFormMessage(message, tone) {
    productFormMessage.textContent = message;
    productFormMessage.classList.remove('is-error', 'is-success');
    if (tone) {
      productFormMessage.classList.add(tone === 'error' ? 'is-error' : 'is-success');
    }
  }

  async function handleProductFormSubmit(event) {
    event.preventDefault();
    setFormMessage('', null);
    productSubmitButton.disabled = true;

    try {
      const formData = new FormData(productForm);
      formData.set('token', sessionToken);

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to add product');
      }

      setFormMessage(`Added "${payload.product_name}".`, 'success');
      productForm.reset();
      void loadProducts();
    } catch (error) {
      setFormMessage(error.message || 'Failed to add product', 'error');
    } finally {
      productSubmitButton.disabled = false;
    }
  }

  function renderOrdersTable(orders) {
    if (!ordersTableBody) return;
    if (!orders.length) {
      ordersTableBody.innerHTML = '';
      ordersEmpty.hidden = false;
      return;
    }
    ordersEmpty.hidden = true;

    ordersTableBody.innerHTML = orders
      .map((order) => `
        <tr>
          <td>${escapeHtml(order.order_number)}</td>
          <td>${escapeHtml(order.customer_name || order.customer_email || 'Guest')}</td>
          <td><span class="admin-status-pill is-active">${escapeHtml(order.order_status)}</span></td>
          <td>${escapeHtml(order.payment_status || '—')}</td>
          <td>${formatCurrency(order.total_amount, order.currency_code)}</td>
          <td>${formatDate(order.placed_at)}</td>
        </tr>
      `)
      .join('');
  }

  async function loadOrders() {
    const response = await fetch('/api/orders?limit=100');
    if (!response.ok) return;
    const payload = await response.json();
    ordersLoaded = true;
    renderOrdersTable(Array.isArray(payload.items) ? payload.items : []);
  }

  function renderStatTiles(stats) {
    const revenue = stats.total_revenue || {};
    const products = stats.product_counts || {};
    const orders = stats.order_counts || {};

    const tiles = [
      { label: 'Total revenue', value: formatCurrency(revenue.total_revenue_amount, revenue.currency_code) },
      { label: 'Paid orders', value: revenue.paid_order_count ?? 0 },
      { label: 'Total orders', value: orders.total_orders ?? 0 },
      { label: 'Open orders', value: orders.open_orders ?? 0 },
      { label: 'Active products', value: products.active_products ?? 0 },
      { label: 'Removed products', value: products.inactive_products ?? 0 },
    ];

    statsGrid.innerHTML = tiles
      .map((tile) => `
        <div class="admin-stat-tile">
          <div class="admin-stat-value">${tile.value}</div>
          <div class="admin-stat-label">${tile.label}</div>
        </div>
      `)
      .join('');
  }

  function renderMiniList(container, items, emptyText) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = `<p class="admin-empty-state">${emptyText}</p>`;
      return;
    }
    container.innerHTML = items.map((row) => row).join('');
  }

  function renderStats(stats) {
    renderStatTiles(stats);

    const trending = (stats.trending_products || []).map((product) => `
      <div class="admin-mini-list-row">
        <strong>${escapeHtml(product.product_name)}</strong>
        <span>${Number(product.sold_units) || 0} sold</span>
      </div>
    `);
    renderMiniList(trendingList, trending, 'No sales data yet.');

    const categories = (stats.best_seller_categories || []).map((category) => `
      <div class="admin-mini-list-row">
        <strong>${escapeHtml(category.category_name)}</strong>
        <span>${Number(category.sold_units) || 0} sold</span>
      </div>
    `);
    renderMiniList(bestCategoryList, categories, 'No sales data yet.');

    const lowStock = (stats.low_stock_products || []).map((product) => `
      <div class="admin-mini-list-row">
        <strong>${escapeHtml(product.product_name)}</strong>
        <span>${Number(product.available_units) || 0} left</span>
      </div>
    `);
    renderMiniList(lowStockList, lowStock, 'Nothing is running low right now.');
  }

  async function loadStats() {
    const response = await fetch(`/api/admin/stats?token=${encodeURIComponent(sessionToken)}`);
    if (!response.ok) return;
    const payload = await response.json();
    statsLoaded = true;
    renderStats(payload);
  }

  async function init() {
    const allowed = await checkAccess();
    if (!allowed) return;

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => switchTab(button.dataset.adminTab));
    });

    if (productForm) {
      productForm.addEventListener('submit', handleProductFormSubmit);
    }

    await loadCategories();
    await loadProducts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
