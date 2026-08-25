(() => {
  let stores = []; // populated from /api/products/:id/store-inventory

  // Same maps as script.js — duplicated locally since this page doesn't load script.js.
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

  const SPECS_BY_CATEGORY = {
    electronics: [
      { label: 'Processor', value: 'Latest-gen multi-core' },
      { label: 'Memory', value: '16GB RAM' },
      { label: 'Storage', value: '512GB SSD' },
      { label: 'Warranty', value: '2-year manufacturer' },
    ],
    phones: [
      { label: 'Display', value: '6.5" OLED' },
      { label: 'Storage', value: '256GB' },
      { label: 'Battery', value: 'All-day battery life' },
      { label: 'Warranty', value: '2-year manufacturer' },
    ],
    tablets: [
      { label: 'Display', value: '11" Liquid Retina' },
      { label: 'Storage', value: '128GB' },
      { label: 'Battery', value: 'Up to 10 hours' },
      { label: 'Warranty', value: '2-year manufacturer' },
    ],
    books: [
      { label: 'Format', value: 'Paperback' },
      { label: 'Language', value: 'English' },
      { label: 'Publisher', value: 'Bluehaven Press' },
      { label: 'Pages', value: 'Varies by title' },
    ],
    accessories: [
      { label: 'Connectivity', value: 'Bluetooth 5.3' },
      { label: 'Battery', value: 'Up to 24 hours' },
      { label: 'Compatibility', value: 'Universal' },
      { label: 'Warranty', value: '1-year manufacturer' },
    ],
  };

  let currentProduct = null;
  let selectedStore = null;
  let currentPhotos = null;

  function getProductImageSource(product) {
    return (
      localProductImages[product.product_name] ||
      localCategoryImages[product.category_slug] ||
      product.primary_photo_url ||
      ''
    );
  }

  function formatCurrency(value, currencyCode = 'EUR') {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function formatStars(avgRating) {
    const rounded = Math.round(Number(avgRating) || 0);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  }

  function getDiscountPercent(product) {
    const cost = Number(product.cost);
    const compareAt = Number(product.compare_at_price) || 0;
    if (!(compareAt > cost)) {
      return 0;
    }
    return Math.round((1 - cost / compareAt) * 100);
  }

  function renderPrice(product) {
    const priceEl = document.getElementById('productPrice');
    const badge = document.getElementById('productDiscountBadge');
    if (!priceEl) return;

    const percentOff = getDiscountPercent(product);
    if (percentOff > 0) {
      priceEl.innerHTML = `
        <strong class="price-now">${formatCurrency(product.cost, product.currency_code)}</strong>
        <span class="price-was">${formatCurrency(product.compare_at_price, product.currency_code)}</span>
      `;
      if (badge) {
        badge.textContent = `-${percentOff}%`;
        badge.hidden = false;
      }
    } else {
      priceEl.textContent = formatCurrency(product.cost, product.currency_code);
      if (badge) badge.hidden = true;
    }
  }

  function renderStockStatus(product) {
    const el = document.getElementById('stockStatus');
    if (!el) return;

    const stock = Number(product.stock_quantity) || 0;
    el.classList.remove('in-stock', 'low-stock', 'out-of-stock');
    if (stock <= 0) {
      el.textContent = 'Out of stock';
      el.classList.add('out-of-stock');
    } else if (stock <= 5) {
      el.textContent = `Only ${stock} left in stock`;
      el.classList.add('low-stock');
    } else {
      el.textContent = 'In stock';
      el.classList.add('in-stock');
    }
  }

  function renderBreadcrumb(product) {
    const el = document.getElementById('breadcrumb');
    if (!el) return;

    const categoryLink = product.category_slug
      ? `<a href="index.html?category=${encodeURIComponent(product.category_slug)}#product-browser">${escapeHtml(product.category_name || '')}</a>`
      : '';

    el.innerHTML = `
      <a href="index.html">Home</a>
      <span aria-hidden="true">/</span>
      ${categoryLink}
      <span aria-hidden="true">/</span>
      <span class="breadcrumb-current">${escapeHtml(product.product_name)}</span>
    `;
  }

  function renderHighlights(product) {
    const list = document.getElementById('highlightList');
    if (!list) return;

    const sentences = (product.description || '')
      .split(/\.\s+/)
      .map((sentence) => sentence.trim().replace(/\.$/, ''))
      .filter(Boolean)
      .slice(0, 4);

    list.innerHTML = sentences.map((sentence) => `<li>${escapeHtml(sentence)}</li>`).join('');
  }

  function renderRatingBreakdown(breakdown, reviewCount) {
    const container = document.getElementById('ratingBreakdown');
    if (!container) return;

    if (!reviewCount) {
      container.hidden = true;
      return;
    }

    container.innerHTML = [5, 4, 3, 2, 1]
      .map((star) => {
        const count = (breakdown && breakdown[String(star)]) || 0;
        const percent = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
        return `
          <div class="rating-breakdown-row">
            <span>${star}&nbsp;★</span>
            <span class="rating-breakdown-track"><span class="rating-breakdown-fill" style="width: ${percent}%"></span></span>
            <span>${count}</span>
          </div>
        `;
      })
      .join('');
    container.hidden = false;
  }

  function renderInstallmentNote(product) {
    const note = document.getElementById('installmentNote');
    if (!note) return;
    const maxInstallments = Number(product.max_installments) || 0;
    if (maxInstallments < 2) {
      note.hidden = true;
      return;
    }
    const perMonth = Number(product.cost) / maxInstallments;
    note.textContent = `Available in up to ${maxInstallments} installments — ${maxInstallments}x ${formatCurrency(perMonth, product.currency_code)}/mo`;
    note.hidden = false;
  }

  function renderRatingSummary(product) {
    const summary = document.getElementById('ratingSummary');
    const stars = document.getElementById('ratingStars');
    const text = document.getElementById('ratingText');
    if (!summary || !stars || !text) return;
    const reviewCount = Number(product.review_count) || 0;
    if (reviewCount === 0) {
      summary.hidden = true;
      return;
    }
    stars.textContent = formatStars(product.avg_rating);
    text.textContent = `${Number(product.avg_rating).toFixed(1)} (${reviewCount} review${reviewCount === 1 ? '' : 's'})`;
    summary.hidden = false;
  }

  function renderReviews(reviews) {
    const list = document.getElementById('reviewList');
    if (!list) return;

    if (!reviews.length) {
      list.innerHTML = '<p class="review-empty">No reviews yet — be the first to share your thoughts.</p>';
      return;
    }

    list.innerHTML = reviews
      .map((review) => {
        const reviewDate = new Date(review.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return `
          <article class="review-card">
            <div class="review-card-head">
              <span class="review-author">${escapeHtml(review.reviewer_first_name)} ${escapeHtml(review.reviewer_last_name)}</span>
              <span class="rating-stars">${formatStars(review.rating)}</span>
            </div>
            ${review.title ? `<div class="review-title">${escapeHtml(review.title)}</div>` : ''}
            ${review.body ? `<p class="review-body">${escapeHtml(review.body)}</p>` : ''}
            <span class="review-date">${escapeHtml(reviewDate)}</span>
          </article>
        `;
      })
      .join('');
  }

  async function loadReviews(productId) {
    try {
      const response = await fetchJson(`/api/products/${productId}/reviews`);
      const items = response.items || [];
      renderReviews(items);
      renderRatingBreakdown(response.rating_breakdown, items.length);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  }

  function renderStoreSelect() {
    const storeSelect = document.getElementById('storeSelect');
    if (!storeSelect) return;

    storeSelect.innerHTML = '<option value="">Select store...</option>';
    stores.forEach((store) => {
      const option = document.createElement('option');
      option.value = store.store_id;
      option.textContent = `${store.store_name} (${store.quantity} in stock)`;
      storeSelect.appendChild(option);
    });

    storeSelect.addEventListener('change', (e) => {
      const storeId = Number(e.target.value);
      selectedStore = stores.find((s) => s.store_id === storeId);
      document.getElementById('storeInfo').textContent = selectedStore
        ? `${selectedStore.location} • ${selectedStore.quantity} in stock`
        : '';
    });
  }

  async function loadStoreInventory(productId) {
    try {
      const response = await fetchJson(`/api/products/${productId}/store-inventory`);
      stores = response.items || [];
    } catch (error) {
      console.error('Failed to load store inventory:', error);
      stores = [];
    }
    renderStoreSelect();
  }

  function setupReviewForm(productId) {
    const wrap = document.getElementById('reviewFormWrap');
    if (!wrap) return;

    const storeSite = window.StoreSite;
    if (!storeSite?.isLoggedIn?.()) {
      wrap.innerHTML = '<p class="review-signin-prompt"><a href="profile.html">Sign in</a> to write a review.</p>';
      return;
    }

    wrap.innerHTML = `
      <form class="review-form" id="reviewForm">
        <label for="reviewRating">Rating
          <select id="reviewRating" required>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Very poor</option>
          </select>
        </label>
        <label for="reviewTitle">Title
          <input id="reviewTitle" type="text" maxlength="120" placeholder="Sum it up in a few words" />
        </label>
        <label for="reviewBody">Review
          <textarea id="reviewBody" rows="3" maxlength="1000" placeholder="What did you think?"></textarea>
        </label>
        <button class="add-to-cart-btn" type="submit">Submit review</button>
        <p class="review-form-message" id="reviewFormMessage" hidden></p>
      </form>
    `;

    document.getElementById('reviewForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.getElementById('reviewFormMessage');
      const payload = {
        user_id: Number(storeSite.getCurrentUserId()),
        rating: Number(document.getElementById('reviewRating').value),
        title: document.getElementById('reviewTitle').value.trim(),
        body: document.getElementById('reviewBody').value.trim(),
      };

      try {
        const response = await fetch(`/api/products/${productId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit review');
        }
        await loadReviews(productId);
        const refreshedProduct = await fetchJson(`/api/products/${productId}`);
        renderRatingSummary(refreshedProduct);
        event.target.reset();
        message.hidden = true;
      } catch (error) {
        message.textContent = error.message;
        message.hidden = false;
      }
    });
  }

  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function getDeliveryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to fetch ${path}`);
    return response.json();
  }

  function renderProductDetails(product) {
    currentProduct = product;

    document.getElementById('productName').textContent = product.product_name;
    document.getElementById('productCode').textContent = `SKU-${String(product.product_id).padStart(6, '0')}`;
    document.getElementById('productDescription').textContent = product.description || 'No description available';
    document.getElementById('deliveryDate').textContent = getDeliveryDate();
    renderBreadcrumb(product);
    renderHighlights(product);
    renderPrice(product);
    renderStockStatus(product);
    renderInstallmentNote(product);
    renderRatingSummary(product);

    // Manufacturer
    const brand = (product.brand || 'Brand').substring(0, 1).toUpperCase();
    document.getElementById('mfgLogo').textContent = brand;
    document.getElementById('mfgName').textContent = product.brand || 'Manufacturer';
    document.getElementById('mfgDesc').textContent = `Trusted ${product.category_name || 'product'} manufacturer`;

    // Photos
    const imageSource = getProductImageSource(product);
    document.getElementById('mainPhoto').src = imageSource;

    const thumbnailsContainer = document.getElementById('thumbnails');
    thumbnailsContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const btn = document.createElement('button');
      btn.className = `thumb-btn ${i === 0 ? 'active' : ''}`;
      btn.type = 'button';
      btn.innerHTML = `<img src="${imageSource}" alt="Photo ${i + 1}" />`;
      btn.addEventListener('click', () => {
        document.getElementById('mainPhoto').src = imageSource;
        document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      thumbnailsContainer.appendChild(btn);
    }

    // Specs
    const specsContainer = document.getElementById('keySpecs');
    const specsData = SPECS_BY_CATEGORY[product.category_slug] || SPECS_BY_CATEGORY.electronics;
    specsContainer.innerHTML = specsData.map(spec => `
      <div class="spec-item">
        <div class="spec-label">${spec.label}</div>
        <div class="spec-value">${spec.value}</div>
      </div>
    `).join('');

    setupQuantityControls();
    setupAddToCart();
  }

  function setupQuantityControls() {
    // Delivery
    document.getElementById('qtyMinusDelivery').addEventListener('click', () => {
      const input = document.getElementById('qtyDelivery');
      input.value = Math.max(1, parseInt(input.value) - 1);
    });
    document.getElementById('qtyPlusDelivery').addEventListener('click', () => {
      const input = document.getElementById('qtyDelivery');
      input.value = Math.min(999, parseInt(input.value) + 1);
    });

    // Pickup
    document.getElementById('qtyMinusPickup').addEventListener('click', () => {
      const input = document.getElementById('qtyPickup');
      input.value = Math.max(1, parseInt(input.value) - 1);
    });
    document.getElementById('qtyPlusPickup').addEventListener('click', () => {
      const input = document.getElementById('qtyPickup');
      input.value = Math.min(999, parseInt(input.value) + 1);
    });
  }

  function setupAddToCart() {
    document.getElementById('addDeliveryBtn').addEventListener('click', () => {
      const qty = parseInt(document.getElementById('qtyDelivery').value);
      addToCart(qty, 'delivery', null);
    });

    document.getElementById('addPickupBtn').addEventListener('click', () => {
      if (!selectedStore) {
        alert('Please select a store');
        return;
      }
      const qty = parseInt(document.getElementById('qtyPickup').value);
      addToCart(qty, 'pickup', selectedStore);
    });
  }

  async function addToCart(qty, type, store) {
    const btn = type === 'delivery' ? document.getElementById('addDeliveryBtn') : document.getElementById('addPickupBtn');
    const originalText = btn.textContent;

    try {
      const productId = Number(currentProduct.product_id ?? currentProduct.id);
      const cartId = await window.StoreSite.getOrCreateCartId();
      const response = await fetch(`/api/carts/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pickup vs delivery and the chosen store are a local UX detail for now —
        // the cart itself only tracks product_id/quantity, matching the /api/carts schema.
        body: JSON.stringify({ product_id: productId, quantity: qty }),
      });
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      window.dispatchEvent(new CustomEvent('store:cart-changed'));
      btn.textContent = '✓ Added!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Could not add this item to your cart. Please try again.');
    }
  }

  async function loadProduct() {
    const productId = getProductIdFromUrl();
    if (!productId) {
      window.location.href = 'index.html';
      return;
    }

    try {
      const product = await fetchJson(`/api/products/${encodeURIComponent(productId)}`);

      if (!product || product.error) {
        document.querySelector('.product-detail-page').innerHTML =
          '<p>Product not found. <a href="index.html">Back to shop</a></p>';
        return;
      }

      renderProductDetails(product);
      loadReviews(productId);
      setupReviewForm(productId);
      loadStoreInventory(productId);
    } catch (error) {
      console.error('Failed to load product:', error);
      document.querySelector('.product-detail-page').innerHTML =
        '<p>Error loading product. <a href="index.html">Back to shop</a></p>';
    }
  }

  function setFooterYear() {
    document.querySelectorAll('.footer-year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadProduct();
      setFooterYear();
    }, { once: true });
  } else {
    loadProduct();
    setFooterYear();
  }
})();
