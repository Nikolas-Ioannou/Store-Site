const menuToggle = document.querySelector('.menu-toggle');
const categoryMenu = document.getElementById('category-menu');
const menuCategories = document.getElementById('menu-categories');
const year = document.getElementById('year');
const headerSearchForm = document.getElementById('header-search-form');
const headerSearchInput = document.getElementById('header-search-input');
const productsGrid = document.getElementById('products-grid');
const resultsSummary = document.getElementById('results-summary');
const browserMessage = document.getElementById('browser-message');
const categoryFilters = document.getElementById('category-filters');
const trendingRail = document.getElementById('trending-rail');
const newArrivalsRail = document.getElementById('new-arrivals-rail');
const filterMinPrice = document.getElementById('filter-min-price');
const filterMaxPrice = document.getElementById('filter-max-price');
const filterBrandList = document.getElementById('filter-brand-list');
const filterInStock = document.getElementById('filter-in-stock');
const filterClearButton = document.getElementById('filter-clear-button');
const browserSortSelect = document.getElementById('browser-sort-select');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userRole = document.getElementById('user-role');
const userOrders = document.getElementById('user-orders');

const CURRENT_USER_STORAGE_KEY = 'storeUserId';
const storeSite = window.StoreSite || null;

const state = {
  products: [],
  categories: [],
  search: '',
  activeCategory: 'all',
  minPrice: '',
  maxPrice: '',
  brands: new Set(),
  inStock: false,
  sort: 'name_asc',
};

function getRequestedCategorySlug() {
  return new URLSearchParams(window.location.search).get('category');
}

function isOnProductBrowserPage() {
  return Boolean(document.getElementById('product-browser'));
}

const localProductImages = {
  'NovaBook Pro 15': 'Photos/image.png',
  'Pulse X12': 'Photos/iphone.png',
  'SketchTab 11': 'Photos/image.png',
  'Future of Consumer Tech': 'Photos/home.png',
  'AeroBuds Lite': 'Photos/social-media.png',
};

const localCategoryImages = {
  electronics: 'Photos/shopping-store.png',
  phones: 'Photos/iphone.png',
  tablets: 'Photos/image.png',
  books: 'Photos/home.png',
  accessories: 'Photos/shopping-cart.png',
};

function buildFallbackMarkup(product) {
  return `<div class="product-card-fallback">${product.product_name}</div>`;
}

function getProductImageSource(product) {
  return (
    localProductImages[product.product_name] ||
    localCategoryImages[product.category_slug] ||
    product.primary_photo_url ||
    ''
  );
}

function getStoredUserId() {
  return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
}

function renderGuestUserPanel() {
  if (userAvatar) {
    userAvatar.textContent = 'G';
  }
  if (userName) {
    userName.textContent = 'Guest';
  }
  if (userEmail) {
    userEmail.textContent = 'Not signed in';
  }
  if (userRole) {
    userRole.textContent = 'Visitor';
  }
  if (userOrders) {
    userOrders.textContent = 'Sign in to view orders';
  }
}

function formatCurrency(value, currencyCode = 'EUR') {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function truncateText(text, maxLength = 108) {
  if (!text) {
    return '';
  }
  const normalizedText = text.trim().replace(/\.$/, '');
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }
  return normalizedText.slice(0, maxLength);
}

function setBrowserMessage(message = '', isVisible = false) {
  if (!browserMessage) {
    return;
  }
  browserMessage.textContent = message;
  browserMessage.hidden = !isVisible;
}

function getFilteredProducts() {
  const searchValue = state.search.trim().toLowerCase();
  const minPrice = state.minPrice === '' ? null : Number(state.minPrice);
  const maxPrice = state.maxPrice === '' ? null : Number(state.maxPrice);

  const filtered = state.products.filter((product) => {
    const matchesCategory =
      state.activeCategory === 'all' || product.category_slug === state.activeCategory;
    const haystack = [
      product.product_name,
      product.category_name,
      product.brand,
      product.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = !searchValue || haystack.includes(searchValue);
    const cost = Number(product.cost);
    const matchesMinPrice = minPrice === null || Number.isNaN(minPrice) || cost >= minPrice;
    const matchesMaxPrice = maxPrice === null || Number.isNaN(maxPrice) || cost <= maxPrice;
    const matchesBrand = state.brands.size === 0 || state.brands.has(product.brand);
    const matchesStock = !state.inStock || Number(product.stock_quantity) > 0;
    return (
      matchesCategory &&
      matchesSearch &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesBrand &&
      matchesStock
    );
  });

  return sortProducts(filtered);
}

function sortProducts(products) {
  const sorted = [...products];
  switch (state.sort) {
    case 'price_asc':
      return sorted.sort((a, b) => Number(a.cost) - Number(b.cost));
    case 'price_desc':
      return sorted.sort((a, b) => Number(b.cost) - Number(a.cost));
    case 'newest':
      return sorted.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
    case 'name_asc':
    default:
      return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
  }
}

function formatStars(avgRating) {
  const rounded = Math.round(Number(avgRating) || 0);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

function buildRatingMarkup(product) {
  const reviewCount = Number(product.review_count) || 0;
  if (reviewCount === 0) {
    return '';
  }
  return `<div class="rating-summary"><span class="rating-stars">${formatStars(product.avg_rating)}</span><span>${Number(product.avg_rating).toFixed(1)} (${reviewCount})</span></div>`;
}

function buildInstallmentMarkup(product) {
  const maxInstallments = Number(product.max_installments) || 0;
  if (maxInstallments < 2) {
    return '';
  }
  const perMonth = Number(product.cost) / maxInstallments;
  return `<div class="installment-badge">or ${maxInstallments}x ${formatCurrency(perMonth, product.currency_code)}/mo</div>`;
}

function getDiscountPercent(product) {
  const cost = Number(product.cost);
  const compareAt = Number(product.compare_at_price) || 0;
  if (!(compareAt > cost)) {
    return 0;
  }
  return Math.round((1 - cost / compareAt) * 100);
}

function buildPriceMarkup(product) {
  const compareAt = Number(product.compare_at_price) || 0;
  const nowPrice = `<strong class="price-now">${formatCurrency(product.cost, product.currency_code)}</strong>`;
  if (getDiscountPercent(product) <= 0) {
    return nowPrice;
  }
  return `${nowPrice}<span class="price-was">${formatCurrency(compareAt, product.currency_code)}</span>`;
}

function buildDiscountRibbon(product) {
  const percentOff = getDiscountPercent(product);
  return percentOff > 0 ? `<span class="discount-badge">-${percentOff}%</span>` : '';
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  const productId = Number(product.product_id ?? product.id);

  const productImage = getProductImageSource(product);
  const imageMarkup = productImage
    ? `<img src="${productImage}" alt="${product.primary_photo_alt || product.product_name}" loading="lazy" />`
    : buildFallbackMarkup(product);

  card.innerHTML = `
    <div class="product-card-visual">
      ${imageMarkup}
      ${buildDiscountRibbon(product)}
    </div>
    <div class="product-copy">
      <div class="product-card-header">
        <span class="tag">${product.category_name}</span>
        <button class="favorite-product-button" type="button" data-favorite-product-id="${productId}"></button>
      </div>
      <span class="product-brand">${product.brand || 'Bluehaven Select'}</span>
      <h3>${product.product_name}</h3>
      ${buildRatingMarkup(product)}
      <p>${truncateText(product.description)}</p>
      <div class="product-meta">
        <span class="price-group">${buildPriceMarkup(product)}</span>
        <a href="product-detail.html?id=${productId}">View details</a>
      </div>
      ${buildInstallmentMarkup(product)}
    </div>
  `;

  const image = card.querySelector('img');
  const visual = card.querySelector('.product-card-visual');
  const favoriteButton = card.querySelector('[data-favorite-product-id]');
  if (image && visual) {
    image.addEventListener('error', () => {
      visual.innerHTML = buildFallbackMarkup(product);
    }, { once: true });
  }

  if (favoriteButton) {
    syncFavoriteButton(favoriteButton, product);
    favoriteButton.addEventListener('click', () => {
      if (!storeSite?.isLoggedIn?.()) {
        window.location.href = 'profile.html';
        return;
      }

      storeSite.toggleFavoriteProduct(productId);
      syncFavoriteButton(favoriteButton, product);
    });
  }

  return card;
}

function syncFavoriteButton(button, product) {
  if (!button) {
    return;
  }

  const productId = Number(product.product_id ?? product.id);
  const isFavorite = Boolean(storeSite?.isFavoriteProduct?.(productId));
  button.classList.toggle('is-active', isFavorite);
  button.setAttribute('aria-pressed', String(isFavorite));
  button.setAttribute(
    'aria-label',
    `${isFavorite ? 'Remove' : 'Add'} ${product.product_name} ${isFavorite ? 'from' : 'to'} favorites`,
  );
  button.textContent = isFavorite ? 'Saved' : 'Favorite';
}

function renderProducts() {
  if (!productsGrid || !resultsSummary) {
    return;
  }

  const filteredProducts = getFilteredProducts();
  productsGrid.innerHTML = '';

  resultsSummary.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} found`;

  if (filteredProducts.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'product-card-empty';
    emptyState.innerHTML = '<p>No products match that search yet. Try another word or category.</p>';
    productsGrid.appendChild(emptyState);
    return;
  }

  filteredProducts.forEach((product) => {
    productsGrid.appendChild(createProductCard(product));
  });
}

function renderCategoryFilters() {
  if (!categoryFilters) {
    return;
  }

  categoryFilters.innerHTML = '';
  const filters = [{ label: 'All', value: 'all' }, ...state.categories.map((category) => ({
    label: category.name,
    value: category.slug,
  }))];

  filters.forEach((filter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    if (filter.value === state.activeCategory) {
      button.classList.add('is-active');
    }
    button.textContent = filter.label;
    button.addEventListener('click', () => {
      state.activeCategory = filter.value;
      renderCategoryFilters();
      renderProducts();
    });
    categoryFilters.appendChild(button);
  });
}

function closeCategoryMenu() {
  if (!categoryMenu || !menuToggle) {
    return;
  }
  categoryMenu.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

function renderCategoryMenu() {
  if (!menuCategories) {
    return;
  }

  const menuItems = [{ label: 'All products', value: 'all' }, ...state.categories.map((category) => ({
    label: category.name,
    value: category.slug,
  }))];

  menuCategories.innerHTML = '';

  menuItems.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-menu-link';

    if (item.value === state.activeCategory) {
      button.classList.add('is-active');
    }

    button.textContent = item.label;
    button.addEventListener('click', () => {
      closeCategoryMenu();

      if (!isOnProductBrowserPage()) {
        window.location.href =
          item.value === 'all' ? 'products.html' : `products.html?category=${encodeURIComponent(item.value)}`;
        return;
      }

      state.activeCategory = item.value;
      renderCategoryFilters();
      renderCategoryMenu();
      renderProducts();
      document.getElementById('product-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    menuCategories.appendChild(button);
  });
}

function syncSearchInputs(value) {
  if (headerSearchInput) {
    headerSearchInput.value = value;
  }
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }
  return response.json();
}

async function loadProducts() {
  setBrowserMessage('', false);
  if (resultsSummary) {
    resultsSummary.textContent = 'Loading products';
  }
  const [productsResponse, categoriesResponse] = await Promise.all([
    fetchJson('/api/products'),
    fetchJson('/api/categories'),
  ]);
  state.products = productsResponse.items || [];
  state.categories = categoriesResponse.items || [];

  const requestedCategory = getRequestedCategorySlug();
  if (requestedCategory && state.categories.some((category) => category.slug === requestedCategory)) {
    state.activeCategory = requestedCategory;
  }
  applyRequestedFiltersFromUrl();

  renderCategoryFilters();
  renderCategoryMenu();
  renderBrandFilterList();
  renderProducts();
}

function applyRequestedFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedSearch = params.get('search');
  const requestedBrand = params.get('brand');
  const requestedMinPrice = params.get('min_price');
  const requestedMaxPrice = params.get('max_price');
  const requestedInStock = params.get('in_stock');
  const requestedSort = params.get('sort');

  if (requestedSearch) {
    state.search = requestedSearch;
    syncSearchInputs(requestedSearch);
  }
  if (requestedBrand && state.products.some((product) => product.brand === requestedBrand)) {
    state.brands.add(requestedBrand);
  }
  if (requestedMinPrice && !Number.isNaN(Number(requestedMinPrice))) {
    state.minPrice = requestedMinPrice;
    if (filterMinPrice) filterMinPrice.value = requestedMinPrice;
  }
  if (requestedMaxPrice && !Number.isNaN(Number(requestedMaxPrice))) {
    state.maxPrice = requestedMaxPrice;
    if (filterMaxPrice) filterMaxPrice.value = requestedMaxPrice;
  }
  if (requestedInStock === '1' || requestedInStock === 'true') {
    state.inStock = true;
    if (filterInStock) filterInStock.checked = true;
  }
  if (requestedSort && ['name_asc', 'price_asc', 'price_desc', 'newest'].includes(requestedSort)) {
    state.sort = requestedSort;
    if (browserSortSelect) browserSortSelect.value = requestedSort;
  }
}

function renderBrandFilterList() {
  if (!filterBrandList) {
    return;
  }

  const brandCounts = new Map();
  state.products.forEach((product) => {
    if (!product.brand) {
      return;
    }
    brandCounts.set(product.brand, (brandCounts.get(product.brand) || 0) + 1);
  });
  const brands = [...brandCounts.keys()].sort((a, b) => a.localeCompare(b));

  filterBrandList.innerHTML = '';
  brands.forEach((brand) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.brands.has(brand);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        state.brands.add(brand);
      } else {
        state.brands.delete(brand);
      }
      renderProducts();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(`${brand} (${brandCounts.get(brand)})`));
    filterBrandList.appendChild(label);
  });
}

async function loadTrending() {
  if (!trendingRail) {
    return;
  }

  const trendingResponse = await fetchJson('/api/trending?limit=8');
  const trendingItems = trendingResponse.items || [];
  const trendingProducts = trendingItems
    .map((item) => state.products.find((product) => Number(product.product_id ?? product.id) === Number(item.product_id)))
    .filter(Boolean);

  trendingRail.innerHTML = '';

  if (trendingProducts.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'browser-message';
    emptyMessage.textContent = 'No trending data yet — check back once a few orders come in.';
    trendingRail.appendChild(emptyMessage);
    return;
  }

  trendingProducts.forEach((product) => {
    trendingRail.appendChild(createProductCard(product));
  });
}

async function loadNewArrivals() {
  if (!newArrivalsRail) {
    return;
  }

  const response = await fetchJson('/api/products?sort=newest&limit=8');
  const newArrivals = response.items || [];

  newArrivalsRail.innerHTML = '';

  if (newArrivals.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'browser-message';
    emptyMessage.textContent = 'No new arrivals yet.';
    newArrivalsRail.appendChild(emptyMessage);
    return;
  }

  newArrivals.forEach((product) => {
    newArrivalsRail.appendChild(createProductCard(product));
  });
}

const carouselSlides = document.querySelectorAll('.carousel-slide');
const carouselDotsContainer = document.getElementById('carousel-dots');
const carouselPrevButton = document.getElementById('carousel-prev');
const carouselNextButton = document.getElementById('carousel-next');

let carouselIndex = 0;
let carouselTimer = null;

function goToSlide(index) {
  if (!carouselSlides.length) {
    return;
  }

  carouselIndex = (index + carouselSlides.length) % carouselSlides.length;

  carouselSlides.forEach((slide, i) => {
    const isActive = i === carouselIndex;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });

  if (carouselDotsContainer) {
    carouselDotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === carouselIndex);
    });
  }
}

function startCarouselAutoplay() {
  clearInterval(carouselTimer);
  carouselTimer = setInterval(() => goToSlide(carouselIndex + 1), 6000);
}

function initHeroCarousel() {
  if (!carouselSlides.length) {
    return;
  }

  if (carouselDotsContainer) {
    carouselDotsContainer.innerHTML = '';
    carouselSlides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        startCarouselAutoplay();
      });
      carouselDotsContainer.appendChild(dot);
    });
  }

  carouselPrevButton?.addEventListener('click', () => {
    goToSlide(carouselIndex - 1);
    startCarouselAutoplay();
  });
  carouselNextButton?.addEventListener('click', () => {
    goToSlide(carouselIndex + 1);
    startCarouselAutoplay();
  });

  goToSlide(0);
  startCarouselAutoplay();
}

async function loadUserPanel() {
  const userId = getStoredUserId();
  if (!userId) {
    renderGuestUserPanel();
    return;
  }

  const user = await fetchJson(`/api/users/${encodeURIComponent(userId)}`);
  if (userAvatar) {
    userAvatar.textContent = getInitials(user.first_name, user.last_name);
  }
  if (userName) {
    userName.textContent = `${user.first_name} ${user.last_name}`;
  }
  if (userEmail) {
    userEmail.textContent = user.email || 'No email';
  }
  if (userRole) {
    userRole.textContent = user.role || 'Customer';
  }
  if (userOrders) {
    const orderCount = Array.isArray(user.orders) ? user.orders.length : 0;
    userOrders.textContent = `${orderCount} order${orderCount === 1 ? '' : 's'}`;
  }
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const query = String(formData.get('search') || '').trim();

  if (!isOnProductBrowserPage()) {
    window.location.href = query ? `products.html?search=${encodeURIComponent(query)}` : 'products.html';
    return;
  }

  state.search = query;
  syncSearchInputs(query);
  renderProducts();
  document.getElementById('product-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleSearchInput(event) {
  state.search = event.currentTarget.value.trim();
  syncSearchInputs(state.search);
  renderProducts();
}

async function initializeStorefront() {
  try {
    await loadProducts();
    await Promise.all([loadTrending(), loadNewArrivals(), loadUserPanel()]);
  } catch (error) {
    if (resultsSummary) {
      resultsSummary.textContent = 'Product search unavailable';
    }
    setBrowserMessage('The backend API is not reachable right now. Start the Python server to load live products.', true);
    if (trendingRail) {
      trendingRail.innerHTML = '<p class="browser-message">Backend offline — trending products unavailable.</p>';
    }
    if (newArrivalsRail) {
      newArrivalsRail.innerHTML = '<p class="browser-message">Backend offline — new arrivals unavailable.</p>';
    }
    if (userName) {
      userName.textContent = 'Guest';
    }
    if (userEmail) {
      userEmail.textContent = 'Not signed in';
    }
    if (userRole) {
      userRole.textContent = 'Visitor';
    }
    if (userOrders) {
      userOrders.textContent = 'Sign in to view orders';
    }
  }
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

initHeroCarousel();

if (menuToggle && categoryMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = categoryMenu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !categoryMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      closeCategoryMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCategoryMenu();
    }
  });
}

if (headerSearchForm) {
  headerSearchForm.addEventListener('submit', handleSearchSubmit);
}

if (headerSearchInput) {
  headerSearchInput.addEventListener('input', handleSearchInput);
}

if (filterMinPrice) {
  filterMinPrice.addEventListener('input', () => {
    state.minPrice = filterMinPrice.value;
    renderProducts();
  });
}

if (filterMaxPrice) {
  filterMaxPrice.addEventListener('input', () => {
    state.maxPrice = filterMaxPrice.value;
    renderProducts();
  });
}

if (filterInStock) {
  filterInStock.addEventListener('change', () => {
    state.inStock = filterInStock.checked;
    renderProducts();
  });
}

if (browserSortSelect) {
  browserSortSelect.addEventListener('change', () => {
    state.sort = browserSortSelect.value;
    renderProducts();
  });
}

if (filterClearButton) {
  filterClearButton.addEventListener('click', () => {
    state.minPrice = '';
    state.maxPrice = '';
    state.brands.clear();
    state.inStock = false;
    state.sort = 'name_asc';
    if (filterMinPrice) filterMinPrice.value = '';
    if (filterMaxPrice) filterMaxPrice.value = '';
    if (filterInStock) filterInStock.checked = false;
    if (browserSortSelect) browserSortSelect.value = 'name_asc';
    renderBrandFilterList();
    renderProducts();
  });
}

initializeStorefront();