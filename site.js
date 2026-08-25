(() => {
  const CURRENT_USER_STORAGE_KEY = 'storeUserId';
  const FAVORITES_STORAGE_KEY = 'storeFavoriteProductIds';
  const CART_ID_STORAGE_KEY = 'storeCartId';
  const GUEST_TOKEN_STORAGE_KEY = 'storeGuestToken';

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

  window.StoreSite = {
    getCurrentUserId,
    isLoggedIn,
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite, { once: true });
  } else {
    initSite();
  }
})();