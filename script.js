const menuToggle = document.querySelector('.menu-toggle');
const categoryMenu = document.getElementById('category-menu');
const menuCategories = document.getElementById('menu-categories');
const categoryMenuFlyout = document.getElementById('category-menu-flyout');

// Subcategory labels shown under a top-level category in the header menu.
// These are navigation shortcuts only — the store's catalog is small, so every
// subcategory link just filters by its parent category rather than a real,
// separately-tracked subcategory (there's no product data to back that yet).
// Either a flat array of label strings (rendered as one plain list), or an
// array of { title, items } groups (rendered as separate headed columns) —
// matching Plaisio's grouped mega-menu for the categories with richer navigation.
const CATEGORY_SUBCATEGORIES = {
  'tvs-audio': [
    { title: 'TVs', items: ['All TVs', '80" - 86"', '70" - 77"', '65"', '55"', '48" - 50"', '40" - 43"', 'Up to 32"'] },
    { title: 'Audio', items: ['All Audio', 'Soundbars', 'Speakers', 'Portable Bluetooth Speakers', 'Multiroom Speakers', 'Turntables', 'Radios', 'Car Audio'] },
    { title: 'Headphones', items: ['All Headphones', 'Bluetooth Headphones', 'Noise Cancelling', 'On-Ear', 'Over-Ear', 'Gaming Headphones', 'Kids Headphones', 'Truly Wireless'] },
    { title: 'Top Brands', items: ['Samsung', 'LG', 'Hisense', 'Xiaomi', 'Sony'] },
    { title: 'TVs by Screen Technology', items: ['OLED', 'Mini LED', 'QLED', 'LED'] },
    { title: 'Projectors & Accessories', items: ['All Projectors & Accessories', 'Business Projectors', 'Home Cinema Projectors', 'Screens & Stands'] },
    { title: 'TVs by Use', items: ['Gaming TVs', 'Lifestyle TVs', 'Hotel TVs', 'Digital Signage'] },
    { title: 'TV Accessories', items: ['All Accessories', 'Wall Mounts', 'Cables & Adapters', 'Remote Controls'] },
  ],
  'laptops-desktops': [
    { title: 'Apple Corner', items: ['Apple MacBook', 'iMac & Mac mini', 'Apple Accessories'] },
    { title: 'Laptops', items: ['All Laptops', 'Home & Office', 'Premium & Business', 'Gaming & Creator', 'Windows Pro'] },
    { title: 'Laptop Accessories', items: ['All Accessories', 'Bags & Cases', 'Stands & Coolers', 'Chargers & Power Supplies', 'Docking Stations'] },
    { title: 'Storage', items: ['All Storage', 'External Drives', 'SSD - HDD', 'USB Sticks', 'NAS', 'Memory Cards'] },
    { title: 'Desktops', items: ['All Desktops', 'Gaming Desktops', 'AI Ready Desktops', 'Home PCs', 'Business PCs', 'All-in-One PCs', 'Servers & Workstations'] },
    { title: 'PC Peripherals', items: ['All Peripherals', 'Keyboards', 'Mice & Mousepads', 'Headsets', 'Speakers & Sound Cards', 'Webcams & Microphones'] },
    { title: 'Monitors', items: ['All Monitors', 'Gaming Monitors', 'OLED Monitors', 'Monitor Stands', 'Monitor Cables'] },
    { title: 'Printing', items: ['All-in-One Printers', 'Printers', 'Ink & Toner'] },
  ],
  'upgrades-networking': [
    { title: 'Upgrade', items: ['All for Upgrading', 'RAM', 'Graphics Cards', 'Power Supplies', 'Motherboards', 'Processors', 'Desktop Cases', 'Fans & Coolers', 'Case Modding', 'Server Hardware', 'Barebone Cases'] },
    { title: 'Networking & Smarthome', items: ['All Networking', 'Wi-Fi Extenders', 'WiFi Routers / Modems', 'Switches & Accessories', 'VOIP Phones', 'Conference', 'IP Cameras & Security', 'Smarthome', 'Smart Lighting', 'Voice Assistants', 'Smart Automation'] },
    { title: 'Electrical & Tools', items: ['All Electrical & Tools', 'UPS', 'Power Strips & Extension Cords', 'Cables', 'Adapters & Converters', 'Tools', 'LED Lamps & Flashlights', 'Batteries'] },
    { title: 'Storage', items: ['All Storage', 'External Drives', 'SSD - HDD', 'USB Sticks', 'NAS', 'CD-DVD & Cartridges', 'Memory Cards'] },
    { title: 'Software', items: ['All Software', 'Operating Systems', 'Antivirus & Security', 'Other Software'] },
  ],
  'phones-tablets-wearables': [
    { title: 'Phones', items: ['All Phones', 'Smartphones', 'Apple iPhone Series', 'Samsung Galaxy Series', 'Xiaomi Smartphones', 'Foldables', 'Basic Phones', 'Landline Phones'] },
    { title: 'Phone Accessories', items: ['All Accessories', 'Apple Accessories', 'Samsung Accessories', 'Phone Cases', 'Screen Protection', 'Chargers & Cables', 'Powerbanks'] },
    { title: 'Wearables', items: ['All Wearables', 'Smartwatches', 'Apple Watch', 'Activity Trackers', 'Smart Rings', 'Smart Glasses'] },
    { title: 'Headphones & Audio', items: ['All Headphones', 'Truly Wireless', 'Neckband', 'Handsfree', 'Headset'] },
    { title: 'Tablets', items: ['All Tablets', 'iPad', 'Android Tablets', 'Apple iPad Pro', 'Samsung Galaxy Tab'] },
    { title: 'Tablet Accessories', items: ['All Accessories', 'Cases', 'Keyboard Cases & Styluses', 'Screen Protection'] },
  ],
  'gaming-zone': [
    { title: 'Game Titles', items: ['All Games', 'Pre-orders', 'PS5 Games', 'Xbox Series Games', 'Switch 2 Games', 'PC Games'] },
    { title: 'Consoles', items: ['All Consoles', 'PS5', 'Xbox Series', 'Switch 2'] },
    { title: 'Console Accessories', items: ['All Accessories', 'PS5 Accessories', 'Xbox Accessories', 'Switch Accessories'] },
    { title: 'Gaming PCs & Monitors', items: ['Gaming Desktops', 'Gaming Laptops', 'Gaming Monitors'] },
    { title: 'E-sports Accessories', items: ['All Accessories', 'Gaming Controllers', 'Gaming Headsets', 'Gaming Keyboards & Mice', 'Gaming Chairs'] },
    { title: 'VR Gaming', items: ['VR Headsets & Accessories'] },
  ],
};
const year = document.getElementById('year');
const headerSearchForm = document.getElementById('header-search-form');
const headerSearchInput = document.getElementById('header-search-input');
const productsGrid = document.getElementById('products-grid');
const resultsSummary = document.getElementById('results-summary');
const browserMessage = document.getElementById('browser-message');
const categoryFilters = document.getElementById('category-filters');
const categoryFilterGroup = document.getElementById('category-filter-group');
const categoryFilterDivider = document.getElementById('category-filter-divider');
const productsBreadcrumbCurrent = document.getElementById('products-breadcrumb-current');
const trendingRail = document.getElementById('trending-rail');
const newArrivalsRail = document.getElementById('new-arrivals-rail');
const trendingPrevButton = document.getElementById('trending-prev');
const trendingNextButton = document.getElementById('trending-next');
const trendingDots = document.getElementById('trending-dots');
const newArrivalsPrevButton = document.getElementById('new-arrivals-prev');
const newArrivalsNextButton = document.getElementById('new-arrivals-next');
const newArrivalsDots = document.getElementById('new-arrivals-dots');
const filterMinPrice = document.getElementById('filter-min-price');
const filterMaxPrice = document.getElementById('filter-max-price');
const filterBrandList = document.getElementById('filter-brand-list');
const filterClearButton = document.getElementById('filter-clear-button');
const browserSortSelect = document.getElementById('browser-sort-select');
const browserPageSize = document.getElementById('browser-page-size');
const productsPagination = document.getElementById('products-pagination');
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
  sort: 'name_asc',
  page: 1,
  pageSize: 24,
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
  'AeroBuds Lite': 'Photos/social-media.png',
};

const localCategoryImages = {
  electronics: 'Photos/shopping-store.png',
  phones: 'Photos/iphone.png',
  tablets: 'Photos/image.png',
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
    return (
      matchesCategory &&
      matchesSearch &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesBrand
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

function buildSavingsMarkup(product) {
  const cost = Number(product.cost);
  const compareAt = Number(product.compare_at_price) || 0;
  if (!(compareAt > cost)) {
    return '';
  }
  return `<span class="savings-badge">Save ${formatCurrency(compareAt - cost, product.currency_code)}</span>`;
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  const productId = Number(product.product_id ?? product.id);
  const detailUrl = `product-detail.html?id=${productId}`;

  const productImage = getProductImageSource(product);
  const imageMarkup = productImage
    ? `<img src="${productImage}" alt="${product.primary_photo_alt || product.product_name}" loading="lazy" />`
    : buildFallbackMarkup(product);

  card.innerHTML = `
    <a class="product-card-visual" href="${detailUrl}" aria-label="View ${product.product_name}">
      ${imageMarkup}
      ${buildDiscountRibbon(product)}
    </a>
    <button class="favorite-product-button" type="button" data-favorite-product-id="${productId}">
      <img src="Photos/heart.png" alt="" />
    </button>
    <div class="product-copy">
      <a class="product-card-title" href="${detailUrl}">
        <h3>${product.product_name}</h3>
      </a>
      <span class="product-card-code">Code: ${String(productId).padStart(6, '0')}</span>
      ${buildRatingMarkup(product)}
      <div class="product-price-row">
        <span class="price-group">${buildPriceMarkup(product)}</span>
        <button class="cart-icon-button" type="button" data-add-to-cart-id="${productId}" aria-label="Add ${product.product_name} to basket">
          <img src="Photos/shopping-cart.png" alt="" />
        </button>
      </div>
      ${buildSavingsMarkup(product)}
    </div>
  `;

  const image = card.querySelector('img[loading="lazy"]');
  const visual = card.querySelector('.product-card-visual');
  const favoriteButton = card.querySelector('[data-favorite-product-id]');
  if (image && visual) {
    image.addEventListener('error', () => {
      visual.innerHTML = buildFallbackMarkup(product);
    }, { once: true });
  }

  if (favoriteButton) {
    syncFavoriteButton(favoriteButton, product);
    favoriteButton.addEventListener('click', (event) => {
      event.preventDefault();
      if (!storeSite?.isLoggedIn?.()) {
        window.location.href = 'profile.html';
        return;
      }

      storeSite.toggleFavoriteProduct(productId);
      syncFavoriteButton(favoriteButton, product);
    });
  }

  const addToCartButton = card.querySelector('[data-add-to-cart-id]');
  if (addToCartButton) {
    addToCartButton.addEventListener('click', (event) => {
      event.preventDefault();
      addProductToCart(productId, addToCartButton);
    });
  }

  return card;
}

async function addProductToCart(productId, button) {
  button.disabled = true;

  try {
    const cartId = await window.StoreSite.getOrCreateCartId();
    const response = await fetch(`/api/carts/${cartId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    window.dispatchEvent(new CustomEvent('store:cart-changed'));
    button.classList.add('is-added');
  } catch (error) {
    console.error('Failed to add to cart:', error);
    button.classList.add('is-error');
  } finally {
    setTimeout(() => {
      button.classList.remove('is-added', 'is-error');
      button.disabled = false;
    }, 1600);
  }
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
}

function renderProducts() {
  if (!productsGrid) {
    return;
  }

  const filteredProducts = getFilteredProducts();
  productsGrid.innerHTML = '';

  if (resultsSummary) {
    resultsSummary.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} found`;
  }

  if (filteredProducts.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'product-card-empty';
    emptyState.innerHTML = '<p>No products match that search yet. Try another word or category.</p>';
    productsGrid.appendChild(emptyState);
    renderProductsPagination(0);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const startIndex = (state.page - 1) * state.pageSize;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + state.pageSize);

  visibleProducts.forEach((product) => {
    productsGrid.appendChild(createProductCard(product));
  });

  renderProductsPagination(filteredProducts.length);
}

function renderProductsPagination(totalItems) {
  if (!productsPagination) {
    return;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  productsPagination.hidden = totalItems === 0 || totalPages === 1;

  if (productsPagination.hidden) {
    productsPagination.innerHTML = '';
    return;
  }

  const buttons = [];
  buttons.push(`
    <button class="button button-secondary" type="button" data-products-page-nav="prev" ${state.page === 1 ? 'disabled' : ''}>Previous</button>
  `);

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    buttons.push(`
      <button class="${pageNumber === state.page ? 'button button-primary' : 'button button-secondary'}" type="button" data-products-page-number="${pageNumber}">${pageNumber}</button>
    `);
  }

  buttons.push(`
    <button class="button button-secondary" type="button" data-products-page-nav="next" ${state.page === totalPages ? 'disabled' : ''}>Next</button>
  `);

  productsPagination.innerHTML = buttons.join('');

  productsPagination.querySelectorAll('[data-products-page-number]').forEach((button) => {
    button.addEventListener('click', () => {
      state.page = Number(button.dataset.productsPageNumber);
      renderProducts();
    });
  });

  productsPagination.querySelectorAll('[data-products-page-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      state.page += button.dataset.productsPageNav === 'next' ? 1 : -1;
      renderProducts();
    });
  });
}

function renderProductsBreadcrumb() {
  if (!productsBreadcrumbCurrent) {
    return;
  }

  if (state.activeCategory === 'all') {
    productsBreadcrumbCurrent.textContent = 'All Products';
    return;
  }

  const activeCategory = state.categories.find((category) => category.slug === state.activeCategory);
  productsBreadcrumbCurrent.textContent = activeCategory ? activeCategory.name : 'All Products';
}

function renderCategoryFilters() {
  renderProductsBreadcrumb();

  if (!categoryFilters) {
    return;
  }

  // Once a category is picked, which category we're on is already shown by the
  // breadcrumb and the highlighted item in the header menu — so the filter
  // sidebar drops the category list entirely and just keeps Brand and Price.
  const isFilteringByCategory = state.activeCategory !== 'all';
  if (categoryFilterGroup) categoryFilterGroup.hidden = isFilteringByCategory;
  if (categoryFilterDivider) categoryFilterDivider.hidden = isFilteringByCategory;

  categoryFilters.innerHTML = '';
  if (isFilteringByCategory) {
    return;
  }

  const filters = state.categories.map((category) => ({
    label: category.name,
    value: category.slug,
  }));

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
      state.brands.clear();
      renderCategoryFilters();
      renderCategoryMenu();
      renderBrandFilterList();
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
  hideCategoryFlyout();
}

function goToCategory(value) {
  closeCategoryMenu();

  if (!isOnProductBrowserPage()) {
    window.location.href =
      value === 'all' ? 'products.html' : `products.html?category=${encodeURIComponent(value)}`;
    return;
  }

  state.activeCategory = value;
  state.brands.clear();
  renderCategoryFilters();
  renderCategoryMenu();
  renderBrandFilterList();
  renderProducts();
  document.getElementById('product-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideCategoryFlyout() {
  if (!categoryMenuFlyout) {
    return;
  }
  categoryMenuFlyout.hidden = true;
  categoryMenuFlyout.innerHTML = '';
  menuCategories?.querySelectorAll('.category-menu-expand.is-open').forEach((button) => {
    button.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
  });
}

function showCategoryFlyout(item, subcategories, expandButton) {
  if (!categoryMenuFlyout) {
    return;
  }

  menuCategories?.querySelectorAll('.category-menu-expand.is-open').forEach((button) => {
    if (button !== expandButton) {
      button.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }
  });
  if (expandButton) {
    expandButton.classList.add('is-open');
    expandButton.setAttribute('aria-expanded', 'true');
  }

  categoryMenuFlyout.innerHTML = '';

  const isGrouped = subcategories.length > 0 && typeof subcategories[0] === 'object';
  categoryMenuFlyout.classList.toggle('is-grouped', isGrouped);

  function appendSublinks(container, labels) {
    labels.forEach((label) => {
      const subButton = document.createElement('button');
      subButton.type = 'button';
      subButton.className = 'category-menu-sublink';
      // Only real "view everything in this group" links get the blue
      // treatment — not just whichever item happens to come first.
      if (label.startsWith('All ')) {
        subButton.classList.add('is-view-all');
      }
      subButton.textContent = label;
      subButton.addEventListener('click', () => goToCategory(item.value));
      container.appendChild(subButton);
    });
  }

  if (!isGrouped) {
    const title = document.createElement('div');
    title.className = 'category-menu-flyout-title';
    title.textContent = item.label;
    categoryMenuFlyout.appendChild(title);
    appendSublinks(categoryMenuFlyout, subcategories);
  } else {
    subcategories.forEach((group) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'category-menu-flyout-group';

      const title = document.createElement('div');
      title.className = 'category-menu-flyout-title';
      title.textContent = group.title;
      groupEl.appendChild(title);

      appendSublinks(groupEl, group.items);
      categoryMenuFlyout.appendChild(groupEl);
    });
  }

  categoryMenuFlyout.hidden = false;
}

function renderCategoryMenu() {
  if (!menuCategories) {
    return;
  }

  const menuItems = state.categories.map((category) => ({
    label: category.name,
    value: category.slug,
  }));

  menuCategories.innerHTML = '';
  hideCategoryFlyout();

  menuItems.forEach((item) => {
    const subcategories = CATEGORY_SUBCATEGORIES[item.value];

    const row = document.createElement('div');
    row.className = 'category-menu-row';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-menu-link';
    if (item.value === state.activeCategory) {
      button.classList.add('is-active');
    }
    button.textContent = item.label;
    button.addEventListener('click', () => goToCategory(item.value));
    row.appendChild(button);

    if (subcategories) {
      // Hovering (desktop) previews the subcategories in the flyout to the
      // right, like Plaisio's mega-menu; the expand button gives touch and
      // keyboard users the same preview without relying on hover.
      row.addEventListener('mouseenter', () => showCategoryFlyout(item, subcategories, null));

      const expandButton = document.createElement('button');
      expandButton.type = 'button';
      expandButton.className = 'category-menu-expand';
      expandButton.setAttribute('aria-expanded', 'false');
      expandButton.setAttribute('aria-label', `Show ${item.label} subcategories`);
      expandButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 7l5 5-5 5"/></svg>';
      expandButton.addEventListener('click', () => {
        const isOpen = expandButton.classList.contains('is-open');
        if (isOpen) {
          hideCategoryFlyout();
        } else {
          showCategoryFlyout(item, subcategories, expandButton);
        }
      });
      row.appendChild(expandButton);
    }

    menuCategories.appendChild(row);
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
    if (state.activeCategory !== 'all' && product.category_slug !== state.activeCategory) {
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

// A horizontally-scrolling row of product cards with arrow buttons and dot
// indicators — each card links straight to the product (createProductCard
// already wraps the photo/title in a link to product-detail.html).
function setupProductRail(rail, prevButton, nextButton, dotsContainer, items, emptyMessage) {
  if (!rail) {
    return;
  }

  rail.innerHTML = '';
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
  }

  if (items.length === 0) {
    const message = document.createElement('p');
    message.className = 'browser-message';
    message.textContent = emptyMessage;
    rail.appendChild(message);
    if (prevButton) prevButton.hidden = true;
    if (nextButton) nextButton.hidden = true;
    return;
  }

  items.forEach((product) => {
    rail.appendChild(createProductCard(product));
  });

  const cards = Array.from(rail.children);
  const needsScroll = rail.scrollWidth > rail.clientWidth + 4;

  if (prevButton) prevButton.hidden = !needsScroll;
  if (nextButton) nextButton.hidden = !needsScroll;

  if (!needsScroll) {
    return;
  }

  const scrollByCard = (direction) => {
    const card = rail.querySelector('.product-card');
    if (!card) {
      return;
    }
    const cardStyle = window.getComputedStyle(rail);
    const gap = parseFloat(cardStyle.columnGap || cardStyle.gap || '0') || 0;
    rail.scrollBy({ left: (card.getBoundingClientRect().width + gap) * direction, behavior: 'smooth' });
  };

  prevButton?.addEventListener('click', () => scrollByCard(-1));
  nextButton?.addEventListener('click', () => scrollByCard(1));

  if (dotsContainer) {
    cards.forEach((card, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'rail-dot';
      dot.setAttribute('aria-label', `Go to item ${index + 1}`);
      dot.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
      dotsContainer.appendChild(dot);
    });

    const updateActiveDot = () => {
      let closestIndex = 0;
      let closestDistance = Infinity;
      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - rail.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      dotsContainer.querySelectorAll('.rail-dot').forEach((dot, index) => {
        dot.classList.toggle('is-active', index === closestIndex);
      });
    };

    let scrollTicking = false;
    rail.addEventListener('scroll', () => {
      if (scrollTicking) {
        return;
      }
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateActiveDot();
        scrollTicking = false;
      });
    });
    updateActiveDot();
  }
}

async function loadTrending() {
  if (!trendingRail) {
    return;
  }

  const trendingResponse = await fetchJson('/api/trending?limit=48');
  const trendingItems = trendingResponse.items || [];
  const trendingProducts = trendingItems
    .map((item) => state.products.find((product) => Number(product.product_id ?? product.id) === Number(item.product_id)))
    .filter(Boolean);

  setupProductRail(trendingRail, trendingPrevButton, trendingNextButton, trendingDots, trendingProducts, 'No trending data yet — check back once a few orders come in.');
}

async function loadNewArrivals() {
  if (!newArrivalsRail) {
    return;
  }

  const response = await fetchJson('/api/products?sort=newest&limit=48');
  const newArrivals = response.items || [];

  setupProductRail(newArrivalsRail, newArrivalsPrevButton, newArrivalsNextButton, newArrivalsDots, newArrivals, 'No new arrivals yet.');
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

if (browserSortSelect) {
  browserSortSelect.addEventListener('change', () => {
    state.sort = browserSortSelect.value;
    renderProducts();
  });
}

if (browserPageSize) {
  browserPageSize.addEventListener('change', () => {
    state.pageSize = Number(browserPageSize.value);
    state.page = 1;
    renderProducts();
  });
}

if (filterClearButton) {
  filterClearButton.addEventListener('click', () => {
    state.activeCategory = 'all';
    state.minPrice = '';
    state.maxPrice = '';
    state.brands.clear();
    state.sort = 'name_asc';
    if (filterMinPrice) filterMinPrice.value = '';
    if (filterMaxPrice) filterMaxPrice.value = '';
    if (browserSortSelect) browserSortSelect.value = 'name_asc';
    renderCategoryFilters();
    renderCategoryMenu();
    renderBrandFilterList();
    renderProducts();
  });
}

initializeStorefront();