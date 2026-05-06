(() => {
  const targetUrl = window.StoreSite?.getFavoritesTargetUrl?.() || 'profile.html';
  window.location.replace(targetUrl);
})();