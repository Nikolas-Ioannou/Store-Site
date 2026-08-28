(() => {
  const storeSite = window.StoreSite || null;

  const basketEmptyState = document.getElementById('basketEmptyState');
  const basketCartView = document.getElementById('basketCartView');
  const basketItems = document.getElementById('basketItems');
  const basketSummaryList = document.getElementById('basketSummaryList');
  const basketShippingSelect = document.getElementById('basketShippingSelect');
  const basketCouponInput = document.getElementById('basketCouponInput');
  const basketCouponApply = document.getElementById('basketCouponApply');
  const basketCouponMessage = document.getElementById('basketCouponMessage');
  const basketTotal = document.getElementById('basketTotal');
  const basketProceedButton = document.getElementById('basketProceedButton');
  const basketGuestNote = document.getElementById('basketGuestNote');
  const basketCheckoutView = document.getElementById('basketCheckoutView');
  const checkoutAddressList = document.getElementById('checkoutAddressList');
  const checkoutBackButton = document.getElementById('checkoutBackButton');
  const checkoutPlaceOrderButton = document.getElementById('checkoutPlaceOrderButton');
  const checkoutMessage = document.getElementById('checkoutMessage');

  let cartId = null;
  let cart = null;
  let shippingMethods = [];
  let selectedShippingMethodId = null;
  let appliedCoupon = null; // { coupon_id, code, discount_amount }
  let addresses = [];
  let selectedAddressId = null;

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function formatCurrency(value, currencyCode = 'EUR') {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  async function fetchJson(path, options) {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed for ${path}`);
    }
    return data;
  }

  function getSelectedShippingCost() {
    const method = shippingMethods.find((item) => Number(item.id) === Number(selectedShippingMethodId));
    return method ? Number(method.base_cost) : 0;
  }

  function computeTotal() {
    if (!cart) return 0;
    const subtotal = Number(cart.subtotal_amount) || 0;
    const shipping = getSelectedShippingCost();
    const discount = appliedCoupon ? Number(appliedCoupon.discount_amount) : 0;
    return Math.max(subtotal + shipping - discount, 0);
  }

  function renderSummary() {
    if (!cart) return;
    const subtotal = Number(cart.subtotal_amount) || 0;
    const shipping = getSelectedShippingCost();
    const currencyCode = cart.currency_code || 'EUR';

    const rows = [
      ['Subtotal', formatCurrency(subtotal, currencyCode)],
      ['Shipping', shipping > 0 ? formatCurrency(shipping, currencyCode) : 'Free'],
    ];
    if (appliedCoupon) {
      rows.push([`Coupon (${escapeHtml(appliedCoupon.code)})`, `-${formatCurrency(appliedCoupon.discount_amount, currencyCode)}`]);
    }

    basketSummaryList.innerHTML = rows
      .map(([label, value]) => `<div><span>${label}</span><span>${value}</span></div>`)
      .join('');

    basketTotal.textContent = formatCurrency(computeTotal(), currencyCode);
  }

  function renderCartItems() {
    basketItems.innerHTML = (cart.items || [])
      .map(
        (item) => `
        <article class="basket-item-row" data-item-id="${item.id}">
          <div class="basket-item-visual"><img src="Photos/box.png" alt="" /></div>
          <div class="basket-item-info">
            <h3>${escapeHtml(item.product_name)}</h3>
            <span>SKU ${escapeHtml(item.sku)} &middot; ${formatCurrency(item.unit_price, cart.currency_code)} each</span>
          </div>
          <div class="basket-item-qty">
            <button type="button" class="basket-qty-minus" aria-label="Decrease quantity">&minus;</button>
            <span>${item.quantity}</span>
            <button type="button" class="basket-qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="basket-item-remove" aria-label="Remove item">Remove</button>
        </article>
      `,
      )
      .join('');

    basketItems.querySelectorAll('.basket-item-row').forEach((row) => {
      const itemId = row.dataset.itemId;
      const item = cart.items.find((entry) => String(entry.id) === itemId);

      row.querySelector('.basket-qty-plus').addEventListener('click', () => {
        updateItemQuantity(itemId, item.quantity + 1);
      });
      row.querySelector('.basket-qty-minus').addEventListener('click', () => {
        if (item.quantity <= 1) {
          removeItem(itemId);
        } else {
          updateItemQuantity(itemId, item.quantity - 1);
        }
      });
      row.querySelector('.basket-item-remove').addEventListener('click', () => {
        removeItem(itemId);
      });
    });
  }

  function renderCart() {
    const hasItems = cart && Array.isArray(cart.items) && cart.items.length > 0;
    basketEmptyState.hidden = hasItems;
    basketCartView.hidden = !hasItems;
    if (!hasItems) {
      return;
    }

    renderCartItems();
    renderSummary();
    basketGuestNote.hidden = Boolean(storeSite?.isLoggedIn?.());
  }

  async function refreshCart() {
    cart = await fetchJson(`/api/carts/${cartId}`);
    // The applied coupon's discount was computed against the subtotal at apply-time;
    // if the cart changed since then, drop it rather than show a stale discount.
    if (appliedCoupon && Number(cart.subtotal_amount) !== appliedCoupon.subtotalAtApply) {
      appliedCoupon = null;
      basketCouponMessage.hidden = true;
    }
    renderCart();
  }

  async function updateItemQuantity(itemId, quantity) {
    await fetchJson(`/api/carts/${cartId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    await refreshCart();
    window.dispatchEvent(new CustomEvent('store:cart-changed'));
  }

  async function removeItem(itemId) {
    await fetchJson(`/api/carts/${cartId}/items/${itemId}`, { method: 'DELETE' });
    await refreshCart();
    window.dispatchEvent(new CustomEvent('store:cart-changed'));
  }

  async function loadShippingMethods() {
    const response = await fetchJson('/api/shipping-methods');
    shippingMethods = response.items || [];
    basketShippingSelect.innerHTML = shippingMethods
      .map(
        (method) =>
          `<option value="${method.id}">${escapeHtml(method.name)} (${method.base_cost > 0 ? formatCurrency(method.base_cost) : 'Free'}, ${method.estimated_days_min}-${method.estimated_days_max} days)</option>`,
      )
      .join('');
    if (shippingMethods.length > 0) {
      selectedShippingMethodId = shippingMethods[0].id;
      basketShippingSelect.value = String(selectedShippingMethodId);
    }
  }

  async function applyCoupon() {
    const code = basketCouponInput.value.trim();
    const userId = storeSite?.getCurrentUserId?.();

    basketCouponMessage.classList.remove('is-error', 'is-success');

    if (!userId) {
      basketCouponMessage.textContent = 'Sign in to apply a coupon.';
      basketCouponMessage.classList.add('is-error');
      basketCouponMessage.hidden = false;
      return;
    }
    if (!code) {
      return;
    }

    try {
      const result = await fetchJson(`/api/carts/${cartId}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, user_id: Number(userId) }),
      });
      appliedCoupon = { ...result, subtotalAtApply: Number(cart.subtotal_amount) };
      basketCouponMessage.textContent = `${result.code} applied — you saved ${formatCurrency(result.discount_amount, cart.currency_code)}.`;
      basketCouponMessage.classList.add('is-success');
      basketCouponMessage.hidden = false;
      renderSummary();
    } catch (error) {
      appliedCoupon = null;
      basketCouponMessage.textContent = error.message;
      basketCouponMessage.classList.add('is-error');
      basketCouponMessage.hidden = false;
      renderSummary();
    }
  }

  function renderAddressList() {
    if (addresses.length === 0) {
      checkoutAddressList.innerHTML =
        '<p class="review-empty">No saved addresses yet. <a href="account-addresses.html">Add one</a> before placing an order.</p>';
      return;
    }

    checkoutAddressList.innerHTML = addresses
      .map(
        (address) => `
        <label class="checkout-address-card ${Number(address.id) === Number(selectedAddressId) ? 'is-selected' : ''}" data-address-id="${address.id}">
          <input type="radio" name="checkoutAddress" value="${address.id}" ${Number(address.id) === Number(selectedAddressId) ? 'checked' : ''} />
          <span>
            <strong>${escapeHtml(address.recipient_name)}</strong><br />
            ${escapeHtml(address.line_1)}${address.line_2 ? `, ${escapeHtml(address.line_2)}` : ''}<br />
            ${escapeHtml(address.postal_code)} ${escapeHtml(address.city)}, ${escapeHtml(address.country_code)}
          </span>
        </label>
      `,
      )
      .join('');

    checkoutAddressList.querySelectorAll('.checkout-address-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedAddressId = Number(card.dataset.addressId);
        renderAddressList();
      });
    });
  }

  async function showCheckoutView() {
    if (!storeSite?.isLoggedIn?.()) {
      window.location.href = 'profile.html';
      return;
    }

    basketCartView.hidden = true;
    basketCheckoutView.hidden = false;
    checkoutMessage.hidden = true;

    const userId = storeSite.getCurrentUserId();
    const user = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
    addresses = user.addresses || [];
    const defaultAddress = addresses.find((address) => address.is_default_shipping) || addresses[0];
    selectedAddressId = defaultAddress ? defaultAddress.id : null;
    renderAddressList();
  }

  function showCartView() {
    basketCheckoutView.hidden = true;
    basketCartView.hidden = false;
  }

  async function placeOrder() {
    if (!selectedAddressId) {
      checkoutMessage.textContent = 'Choose a delivery address first.';
      checkoutMessage.hidden = false;
      return;
    }

    checkoutPlaceOrderButton.disabled = true;
    checkoutMessage.hidden = true;

    try {
      const payload = {
        cart_id: Number(cartId),
        user_id: Number(storeSite.getCurrentUserId()),
        shipping_method_id: selectedShippingMethodId,
        shipping_address_id: selectedAddressId,
        billing_address_id: selectedAddressId,
      };
      if (appliedCoupon) {
        payload.coupon_id = appliedCoupon.coupon_id;
      }

      const order = await fetchJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      window.localStorage.removeItem('storeCartId');
      window.location.href = `order.html?orderId=${order.order_id}`;
    } catch (error) {
      checkoutMessage.textContent = error.message;
      checkoutMessage.hidden = false;
      checkoutPlaceOrderButton.disabled = false;
    }
  }

  async function initBasket() {
    if (!storeSite) {
      return;
    }

    try {
      cartId = await storeSite.getOrCreateCartId();
      await loadShippingMethods();
      await refreshCart();
    } catch (error) {
      console.error('Failed to load basket:', error);
      basketEmptyState.hidden = false;
      basketCartView.hidden = true;
    }
  }

  basketShippingSelect?.addEventListener('change', () => {
    selectedShippingMethodId = Number(basketShippingSelect.value);
    renderSummary();
  });

  basketCouponApply?.addEventListener('click', applyCoupon);

  basketProceedButton?.addEventListener('click', showCheckoutView);
  checkoutBackButton?.addEventListener('click', showCartView);
  checkoutPlaceOrderButton?.addEventListener('click', placeOrder);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBasket, { once: true });
  } else {
    initBasket();
  }
})();
