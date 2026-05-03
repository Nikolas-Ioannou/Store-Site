const menuToggle = document.querySelector('.menu-toggle');
const categoryMenu = document.getElementById('category-menu');
const menuCategories = document.getElementById('menu-categories');
const year = document.getElementById('year');
const headerSearchForm = document.getElementById('header-search-form');
const headerSearchInput = document.getElementById('header-search-input');
const heroSearchForm = document.getElementById('hero-search-form');
const heroSearchInput = document.getElementById('hero-search-input');
const productSearchForm = document.getElementById('product-search-form');
const productSearchInput = document.getElementById('product-search-input');
const productsGrid = document.getElementById('products-grid');
const resultsSummary = document.getElementById('results-summary');
const browserMessage = document.getElementById('browser-message');
const categoryFilters = document.getElementById('category-filters');
const trendingName = document.getElementById('trending-name');
const trendingScore = document.getElementById('trending-score');
const bestCategoryName = document.getElementById('best-category-name');
const bestCategoryRevenue = document.getElementById('best-category-revenue');
const totalRevenueAmount = document.getElementById('total-revenue-amount');
const totalRevenueOrders = document.getElementById('total-revenue-orders');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userRole = document.getElementById('user-role');
const userOrders = document.getElementById('user-orders');

const CURRENT_USER_STORAGE_KEY = 'storeUserId';

const state = {
  products: [],
  categories: [],
  search: '',
  activeCategory: 'all',
};

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
  return state.products.filter((product) => {
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
    return matchesCategory && matchesSearch;
  });
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';

  const productImage = getProductImageSource(product);
  const imageMarkup = productImage
    ? `<img src="${productImage}" alt="${product.primary_photo_alt || product.product_name}" loading="lazy" />`
    : buildFallbackMarkup(product);

  card.innerHTML = `
    <div class="product-card-visual">${imageMarkup}</div>
    <div class="product-copy">
      <div class="product-card-header">
        <span class="tag">${product.category_name}</span>
        <span class="product-brand">${product.brand || 'Bluehaven Select'}</span>
      </div>
      <h3>${product.product_name}</h3>
      <p>${truncateText(product.description)}</p>
      <div class="product-meta">
        <strong>${formatCurrency(product.cost, product.currency_code)}</strong>
        <a href="#">View details</a>
      </div>
    </div>
  `;

  const image = card.querySelector('img');
  const visual = card.querySelector('.product-card-visual');
  if (image && visual) {
    image.addEventListener('error', () => {
      visual.innerHTML = buildFallbackMarkup(product);
    }, { once: true });
  }

  return card;
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
      state.activeCategory = item.value;
      renderCategoryFilters();
      renderCategoryMenu();
      renderProducts();
      closeCategoryMenu();
      document.getElementById('product-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    menuCategories.appendChild(button);
  });
}

function syncSearchInputs(value) {
  if (headerSearchInput) {
    headerSearchInput.value = value;
  }
  if (heroSearchInput) {
    heroSearchInput.value = value;
  }
  if (productSearchInput) {
    productSearchInput.value = value;
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
  resultsSummary.textContent = 'Loading products';
  const [productsResponse, categoriesResponse] = await Promise.all([
    fetchJson('/api/products'),
    fetchJson('/api/categories'),
  ]);
  state.products = productsResponse.items || [];
  state.categories = categoriesResponse.items || [];
  renderCategoryFilters();
  renderCategoryMenu();
  renderProducts();
}

async function loadDashboard() {
  const dashboard = await fetchJson('/api/dashboard');
  const trending = (dashboard.trending_products || [])[0];
  const bestCategory = (dashboard.best_seller_categories || [])[0];
  const totalRevenue = dashboard.total_revenue || {};

  if (trending && trendingName && trendingScore) {
    trendingName.textContent = trending.product_name;
    trendingScore.textContent = `${trending.sold_units} sold, score ${trending.trending_score}`;
  }

  if (bestCategory && bestCategoryName && bestCategoryRevenue) {
    bestCategoryName.textContent = bestCategory.category_name;
    bestCategoryRevenue.textContent = formatCurrency(bestCategory.revenue_amount);
  }

  if (totalRevenue && totalRevenueAmount && totalRevenueOrders) {
    totalRevenueAmount.textContent = formatCurrency(totalRevenue.total_revenue_amount);
    totalRevenueOrders.textContent = `${totalRevenue.paid_order_count || 0} paid orders tracked`;
  }
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
  state.search = String(formData.get('search') || '').trim();
  syncSearchInputs(state.search);
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
    await Promise.all([loadProducts(), loadDashboard(), loadUserPanel()]);
  } catch (error) {
    resultsSummary.textContent = 'Product search unavailable';
    setBrowserMessage('The backend API is not reachable right now. Start the Python server to load live products.', true);
    if (trendingName) {
      trendingName.textContent = 'Backend offline';
    }
    if (bestCategoryName) {
      bestCategoryName.textContent = 'Backend offline';
    }
    if (totalRevenueAmount) {
      totalRevenueAmount.textContent = 'Backend offline';
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

if (heroSearchForm) {
  heroSearchForm.addEventListener('submit', handleSearchSubmit);
}

if (headerSearchForm) {
  headerSearchForm.addEventListener('submit', handleSearchSubmit);
}

if (productSearchForm) {
  productSearchForm.addEventListener('submit', handleSearchSubmit);
}

if (heroSearchInput) {
  heroSearchInput.addEventListener('input', handleSearchInput);
}

if (headerSearchInput) {
  headerSearchInput.addEventListener('input', handleSearchInput);
}

if (productSearchInput) {
  productSearchInput.addEventListener('input', handleSearchInput);
}

initializeStorefront();