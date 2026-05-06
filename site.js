(() => {
  const CURRENT_USER_STORAGE_KEY = 'storeUserId';
  const FAVORITES_STORAGE_KEY = 'storeFavoriteProductIds';

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

  window.StoreSite = {
    getCurrentUserId,
    isLoggedIn,
    getFavoriteProductIds,
    setFavoriteProductIds,
    isFavoriteProduct,
    toggleFavoriteProduct,
    getFavoritesTargetUrl,
    bindFavoritesLinks,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindFavoritesLinks, { once: true });
  } else {
    bindFavoritesLinks();
  }
})();