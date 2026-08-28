(() => {
  const CURRENT_USER_STORAGE_KEY = 'storeUserId';
  const FAVORITES_STORAGE_KEY = 'storeFavoriteProductIds';
  const CART_ID_STORAGE_KEY = 'storeCartId';
  const GUEST_TOKEN_STORAGE_KEY = 'storeGuestToken';
  const SESSION_TOKEN_STORAGE_KEY = 'storeSessionToken';
  const ROLE_STORAGE_KEY = 'storeUserRole';

  function getCurrentUserId() {
    try {
      return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(getCurrentUserId());
  }

  function getSessionToken() {
    try {
      return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function isAdmin() {
    try {
      return window.localStorage.getItem(ROLE_STORAGE_KEY) === 'admin';
    } catch {
      return false;
    }
  }

  function normalizeFavoriteIds(ids) {
    return [...new Set(ids.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
  }

  function getFavoriteProductIds() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? normalizeFavoriteIds(parsed) : [];
    } catch {
      return [];
    }
  }

  function setFavoriteProductIds(ids) {
    const normalizedIds = normalizeFavoriteIds(ids);
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalizedIds));
    window.dispatchEvent(
      new CustomEvent('store:favorites-changed', {
        detail: { productIds: normalizedIds },
      }),
    );
    return normalizedIds;
  }

  function isFavoriteProduct(productId) {
    return getFavoriteProductIds().includes(Number(productId));
  }

  function toggleFavoriteProduct(productId) {
    const normalizedProductId = Number(productId);
    const favoriteIds = getFavoriteProductIds();
    if (favoriteIds.includes(normalizedProductId)) {
      return setFavoriteProductIds(favoriteIds.filter((id) => id !== normalizedProductId));
    }
    return setFavoriteProductIds([...favoriteIds, normalizedProductId]);
  }

  function getFavoritesTargetUrl() {
    return isLoggedIn() ? 'profile.html#favorites-card' : 'profile.html';
  }

  function bindFavoritesLinks() {
    document.querySelectorAll('[data-favorites-link="true"]').forEach((link) => {
      link.setAttribute('href', getFavoritesTargetUrl());

      if (link.dataset.favoritesBound === 'true') {
        return;
      }

      link.dataset.favoritesBound = 'true';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = getFavoritesTargetUrl();
      });
    });
  }

  function setFooterYear() {
    const currentYear = String(new Date().getFullYear());
    document.querySelectorAll('.footer-year').forEach((el) => {
      el.textContent = currentYear;
    });
  }

  function getGuestToken() {
    let token = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
    if (!token) {
      token = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
    }
    return token;
  }

  async function getOrCreateCartId() {
    const existingCartId = window.localStorage.getItem(CART_ID_STORAGE_KEY);
    if (existingCartId) {
      const existingCartResponse = await fetch(`/api/carts/${encodeURIComponent(existingCartId)}`);
      if (existingCartResponse.ok) {
        return existingCartId;
      }
      // Stored cart id is stale (deleted/converted elsewhere) — fall through and create a new one.
      window.localStorage.removeItem(CART_ID_STORAGE_KEY);
    }

    const userId = getCurrentUserId();
    const response = await fetch('/api/carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userId ? { user_id: Number(userId) } : { session_token: getGuestToken() }),
    });
    if (!response.ok) {
      throw new Error('Failed to create a cart');
    }
    const cart = await response.json();
    window.localStorage.setItem(CART_ID_STORAGE_KEY, String(cart.id));
    return String(cart.id);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
    ));
  }

  function formatCurrency(amount, currencyCode) {
    const value = Number(amount) || 0;
    try {
      return new Intl.NumberFormat('en-IE', { style: 'currency', currency: currencyCode || 'EUR' }).format(value);
    } catch {
      return `€${value.toFixed(2)}`;
    }
  }

  // Seed product photo_urls point at a placeholder domain that never resolves —
  // mirrors the same product-name overrides script.js uses for real cards.
  const LOCAL_PRODUCT_IMAGES = {
    'NovaBook Pro 15': 'Photos/image.png',
    'Pulse X12': 'Photos/iphone.png',
    'SketchTab 11': 'Photos/image.png',
    'AeroBuds Lite': 'Photos/social-media.png',
  };

  function getCartItemImageSource(item) {
    return LOCAL_PRODUCT_IMAGES[item.product_name] || item.primary_photo_url || '';
  }

  const EMPTY_CART = { items: [], item_count: 0, subtotal_amount: 0, currency_code: 'EUR' };

  async function fetchCartSummary() {
    try {
      const cartId = window.localStorage.getItem(CART_ID_STORAGE_KEY);
      if (!cartId) {
        return EMPTY_CART;
      }
      const response = await fetch(`/api/carts/${encodeURIComponent(cartId)}`);
      if (!response.ok) {
        return EMPTY_CART;
      }
      return await response.json();
    } catch {
      return EMPTY_CART;
    }
  }

  function renderMiniCart(dropdown, cart) {
    const items = Array.isArray(cart.items) ? cart.items : [];

    if (items.length === 0) {
      dropdown.innerHTML = '<div class="mini-cart-empty">Your basket is empty.</div>';
      return;
    }

    const rows = items
      .map((item) => `
        <div class="mini-cart-item">
          <img class="mini-cart-item-photo" src="${escapeHtml(getCartItemImageSource(item))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />
          <div class="mini-cart-item-body">
            <span class="mini-cart-item-name">${escapeHtml(item.product_name)}</span>
            <span class="mini-cart-item-sku">${escapeHtml(item.sku || '')}</span>
            <button class="mini-cart-item-remove" type="button" data-remove-item="${item.id}">Remove</button>
          </div>
          <div class="mini-cart-item-meta">
            <span class="mini-cart-item-price">${formatCurrency(item.unit_price, cart.currency_code)}</span>
            <span class="mini-cart-item-qty">x${item.quantity}</span>
          </div>
        </div>
      `)
      .join('');

    dropdown.innerHTML = `
      <div class="mini-cart-header">My basket (${cart.item_count || items.length})</div>
      <div class="mini-cart-items">${rows}</div>
      <div class="mini-cart-footer">
        <div class="mini-cart-total"><span>Total</span><strong>${formatCurrency(cart.subtotal_amount, cart.currency_code)}</strong></div>
        <a class="button button-primary mini-cart-checkout" href="basket.html">Go to checkout</a>
      </div>
    `;

    dropdown.querySelectorAll('[data-remove-item]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const cartId = window.localStorage.getItem(CART_ID_STORAGE_KEY);
        if (!cartId) {
          return;
        }
        await fetch(`/api/carts/${encodeURIComponent(cartId)}/items/${button.dataset.removeItem}`, { method: 'DELETE' });
        window.dispatchEvent(new CustomEvent('store:cart-changed'));
      });
    });
  }

  async function refreshBasketWidgets() {
    const cart = await fetchCartSummary();
    const itemCount = Number(cart.item_count) || 0;

    document.querySelectorAll('.basket-count-badge').forEach((badge) => {
      badge.textContent = String(itemCount);
      badge.hidden = itemCount === 0;
    });

    document.querySelectorAll('.mini-cart-dropdown').forEach((dropdown) => {
      renderMiniCart(dropdown, cart);
    });
  }

  function initBasketWidgets() {
    const basketLinks = document.querySelectorAll('.header-icon-link[href="basket.html"]');
    if (basketLinks.length === 0) {
      return;
    }

    basketLinks.forEach((link) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'basket-menu';
      link.parentNode.insertBefore(wrapper, link);
      wrapper.appendChild(link);

      const badge = document.createElement('span');
      badge.className = 'basket-count-badge';
      badge.hidden = true;
      badge.textContent = '0';
      link.appendChild(badge);

      const dropdown = document.createElement('div');
      dropdown.className = 'mini-cart-dropdown';
      dropdown.hidden = true;
      wrapper.appendChild(dropdown);

      link.addEventListener('click', (event) => {
        event.preventDefault();
        const wasOpen = !dropdown.hidden;
        document.querySelectorAll('.mini-cart-dropdown').forEach((el) => {
          el.hidden = true;
        });
        dropdown.hidden = wasOpen;
        if (!wasOpen) {
          void refreshBasketWidgets();
        }
      });
    });

    document.addEventListener('click', (event) => {
      document.querySelectorAll('.basket-menu').forEach((wrapper) => {
        if (!wrapper.contains(event.target)) {
          const dropdown = wrapper.querySelector('.mini-cart-dropdown');
          if (dropdown) {
            dropdown.hidden = true;
          }
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.mini-cart-dropdown').forEach((dropdown) => {
          dropdown.hidden = true;
        });
      }
    });

    window.addEventListener('store:cart-changed', () => {
      void refreshBasketWidgets();
    });

    void refreshBasketWidgets();
  }

  window.StoreSite = {
    getCurrentUserId,
    isLoggedIn,
    getSessionToken,
    isAdmin,
    getFavoriteProductIds,
    setFavoriteProductIds,
    isFavoriteProduct,
    toggleFavoriteProduct,
    getFavoritesTargetUrl,
    bindFavoritesLinks,
    getOrCreateCartId,
  };

  function initSite() {
    bindFavoritesLinks();
    setFooterYear();
    initBasketWidgets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite, { once: true });
  } else {
    initSite();
  }
})();