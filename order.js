const orderViewMessage = document.getElementById('order-view-message');
const orderViewContent = document.getElementById('order-view-content');
const orderViewHero = document.getElementById('order-view-hero');
const orderViewTitle = document.getElementById('order-view-title');
const orderViewStatusIcon = document.getElementById('order-view-status-icon');
const orderViewStatusTitle = document.getElementById('order-view-status-title');
const orderViewStatusCopy = document.getElementById('order-view-status-copy');
const orderViewDate = document.getElementById('order-view-date');
const orderViewProductsCount = document.getElementById('order-view-products-count');
const orderViewProducts = document.getElementById('order-view-products');
const orderViewProductsFooter = document.getElementById('order-view-products-footer');
const orderViewTotal = document.getElementById('order-view-total');
const orderViewAddressLabel = document.getElementById('order-view-address-label');
const orderViewAddress = document.getElementById('order-view-address');
const orderViewPhone = document.getElementById('order-view-phone');
const orderViewTracking = document.getElementById('order-view-tracking');
const orderViewPayment = document.getElementById('order-view-payment');
const orderViewMeta = document.getElementById('order-view-meta');
const orderProgress = document.getElementById('order-progress');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showMessage(message, tone = 'error') {
  if (!orderViewMessage) {
    return;
  }

  orderViewMessage.textContent = message;
  orderViewMessage.className = `auth-message ${tone === 'error' ? 'is-error' : 'is-success'}`;
  orderViewMessage.hidden = false;
}

function hideMessage() {
  if (!orderViewMessage) {
    return;
  }

  orderViewMessage.hidden = true;
  orderViewMessage.textContent = '';
  orderViewMessage.className = 'auth-message';
}

async function fetchJson(path) {
  const response = await fetch(path);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function formatCurrency(value, currencyCode = 'EUR') {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getOrderProgressCopy(order) {
  const fulfillmentStatus = String(order?.fulfillment_status || '').trim();
  const orderStatus = String(order?.status || '').trim();
  const paymentStatus = String(order?.payment_status || '').trim();
  const installmentPlan = order?.installment_plan;

  // Active installment plan takes priority over generic statuses
  if (installmentPlan && installmentPlan.status === 'active') {
    const isDelivered = fulfillmentStatus.toLowerCase().includes('deliver');
    const paidCount = Number(installmentPlan.paid_count || 0);
    const totalCount = Number(installmentPlan.installment_count || 1);
    return {
      badge: 'Installments Active',
      detail: `Product delivered. ${paidCount} of ${totalCount} installments paid.`,
      iconSrc: 'Photos/order.png',
      step: isDelivered ? 5 : 4,
      tone: 'shipped',
    };
  }

  if (installmentPlan && installmentPlan.status === 'completed') {
    return {
      badge: 'Installments Complete',
      detail: 'All installments have been paid.',
      iconSrc: 'Photos/order.png',
      step: 5,
      tone: 'delivered',
    };
  }

  if (fulfillmentStatus) {
    const normalized = fulfillmentStatus.toLowerCase();

    if (normalized.includes('deliver')) {
      return {
        badge: 'Delivered',
        detail: 'Your order has been delivered.',
        iconSrc: 'Photos/delivery-truck.png',
        step: 5,
        tone: 'delivered',
      };
    }

    if (normalized.includes('ship') || normalized.includes('transit')) {
      return {
        badge: 'On the way',
        detail: 'Your parcel is moving with the carrier.',
        iconSrc: 'Photos/delivery-truck.png',
        step: 4,
        tone: 'shipped',
      };
    }

    if (normalized.includes('pack') || normalized.includes('ready') || normalized.includes('process')) {
      return {
        badge: 'Preparing',
        detail: 'Your order is being prepared for shipment.',
        iconSrc: 'Photos/box.png',
        step: 3,
        tone: 'preparing',
      };
    }
  }

  if (orderStatus && orderStatus.toLowerCase() === 'completed') {
    return {
      badge: 'Completed',
      detail: 'This order has been completed.',
      iconSrc: 'Photos/delivery-truck.png',
      step: 5,
      tone: 'delivered',
    };
  }

  if (paymentStatus && paymentStatus.toLowerCase().includes('paid')) {
    return {
      badge: 'Confirmed',
      detail: 'Payment received. We are preparing your order.',
      iconSrc: 'Photos/box.png',
      step: 2,
      tone: 'confirmed',
    };
  }

  return {
    badge: 'Pending',
    detail: 'We received your order and are waiting for the next update.',
    iconSrc: 'Photos/box.png',
    step: 1,
    tone: 'pending',
  };
}

function formatOrderAddress(address) {
  if (!address) {
    return 'No shipping address saved yet';
  }

  const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
  return [address.recipient_name, address.line_1, address.line_2, cityLine, address.region, address.country_code].filter(Boolean).join(', ');
}

function formatOrderAddressHtml(address) {
  if (!address) {
    return '<em class="order-addr-empty">No shipping address saved yet</em>';
  }

  const lines = [
    address.label ? `<span class="order-addr-label">${escapeHtml(address.label)}</span>` : null,
    address.recipient_name ? `<strong>${escapeHtml(address.recipient_name)}</strong>` : null,
    address.line_1 ? `<span>${escapeHtml(address.line_1)}</span>` : null,
    address.line_2 ? `<span>${escapeHtml(address.line_2)}</span>` : null,
    (address.postal_code || address.city)
      ? `<span>${escapeHtml([address.postal_code, address.city].filter(Boolean).join(' '))}</span>`
      : null,
    address.region ? `<span>${escapeHtml(address.region)}</span>` : null,
    address.country_code ? `<span>${escapeHtml(address.country_code)}</span>` : null,
  ].filter(Boolean);

  return lines.length ? lines.join('') : '<em class="order-addr-empty">No shipping address saved yet</em>';
}

function getPrimaryShipment(order) {
  if (Array.isArray(order?.shipments) && order.shipments.length > 0) {
    return order.shipments[0];
  }

  if (order?.carrier_name || order?.tracking_number || order?.shipment_status) {
    return {
      carrier_name: order.carrier_name,
      tracking_number: order.tracking_number,
      status: order.shipment_status,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
    };
  }

  return null;
}

function renderOrder(order) {
  const progress = getOrderProgressCopy(order);
  const shippingAddress = order?.shipping_address || order?.billing_address || null;
  const shipment = getPrimaryShipment(order);
  const paymentLabel = [order?.payment_provider, toTitleCase(order?.payment_status || '')].filter(Boolean).join(' / ');
  const items = Array.isArray(order?.items) ? order.items : [];
  const currency = order.currency_code || 'EUR';

  // Hero
  orderViewTitle.textContent = order.order_number || 'Order details';
  orderViewStatusIcon.src = progress.iconSrc;
  orderViewStatusTitle.textContent = progress.badge;
  orderViewStatusCopy.textContent = progress.detail;
  if (orderViewDate) {
    orderViewDate.textContent = order.placed_at || '';
    orderViewDate.setAttribute('datetime', order.placed_at || '');
  }
  if (orderViewHero) {
    orderViewHero.dataset.tone = progress.tone;
  }

  // Progress stepper
  if (orderProgress) {
    orderProgress.querySelectorAll('.order-progress-step').forEach((step) => {
      const stepMap = { placed: 1, payment: 2, preparing: 3, shipped: 4, delivered: 5 };
      const stepNum = stepMap[step.dataset.step] || 0;
      step.classList.remove('is-done', 'is-active');
      if (stepNum < progress.step) {
        step.classList.add('is-done');
      } else if (stepNum === progress.step) {
        step.classList.add('is-active');
      }
    });
  }

  // Products
  orderViewProductsCount.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
  orderViewProducts.innerHTML = items.length
    ? items
        .map(
          (item, index) => `
            <article class="order-view-product-row">
              <div class="order-product-index">${index + 1}</div>
              <div class="order-product-info">
                <strong>${escapeHtml(item.product_name || item.sku || 'Product')}</strong>
                <small>
                  ${item.sku ? `<span>SKU&nbsp;${escapeHtml(item.sku)}</span>` : ''}
                  <span>Qty&nbsp;<strong>${Number(item.quantity || 0)}</strong></span>
                  ${item.unit_price ? `<span>@ ${escapeHtml(formatCurrency(item.unit_price, currency))}</span>` : ''}
                </small>
              </div>
              <strong class="order-product-total">${escapeHtml(formatCurrency(item.line_total || item.unit_price || 0, currency))}</strong>
            </article>
          `,
        )
        .join('')
    : '<p class="order-detail-copy">No products available yet.</p>';

  if (order.total_amount) {
    orderViewTotal.textContent = formatCurrency(order.total_amount, currency);
    orderViewProductsFooter.hidden = false;
  }

  // Address
  orderViewAddressLabel.textContent = shippingAddress?.label || 'Saved address';
  orderViewAddress.innerHTML = formatOrderAddressHtml(shippingAddress);

  // Contact & tracking
  orderViewPhone.textContent = order.customer_phone || 'No phone saved';
  const trackingItems = [
    order.customer_phone ? { label: 'Phone', value: order.customer_phone } : null,
    shipment?.carrier_name ? { label: 'Carrier', value: shipment.carrier_name } : null,
    shipment?.tracking_number ? { label: 'Tracking no.', value: shipment.tracking_number } : null,
    shipment?.shipped_at ? { label: 'Shipped', value: shipment.shipped_at } : null,
    shipment?.delivered_at ? { label: 'Delivered', value: shipment.delivered_at } : null,
  ].filter(Boolean);

  orderViewTracking.innerHTML = trackingItems.length
    ? trackingItems
        .map(
          (item) => `
            <li>
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </li>
          `,
        )
        .join('')
    : '<li class="order-meta-empty"><span>Tracking info will appear here when the carrier updates the parcel.</span></li>';

  // Payment & status
  orderViewPayment.textContent = paymentLabel || 'Payment update pending';
  orderViewMeta.innerHTML = [
    { label: 'Order status', value: toTitleCase(order.status || order.order_status || 'Pending') },
    { label: 'Payment', value: toTitleCase(order.payment_status || 'Pending') },
    { label: 'Fulfillment', value: toTitleCase(order.fulfillment_status || 'Unfulfilled') },
    { label: 'Shipment', value: toTitleCase(shipment?.status || order.shipment_status || 'Pending') },
    { label: 'Total', value: formatCurrency(order.total_amount || 0, currency) },
  ]
    .map(
      (item) => `
        <li>
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </li>
      `,
    )
    .join('');

  orderViewContent.hidden = false;
}

async function initOrderView() {
  const orderId = new URLSearchParams(window.location.search).get('orderId');
  const activeUserId = window.StoreSite?.getCurrentUserId?.() || null;

  if (!orderId) {
    showMessage('No order was selected.');
    return;
  }

  if (!activeUserId) {
    showMessage('Please log in to view your order.');
    return;
  }

  try {
    hideMessage();
    const order = await fetchJson(`/api/orders/${encodeURIComponent(orderId)}`);
    const ownerId = String(order?.order?.user_id || '');

    if (!ownerId || ownerId !== String(activeUserId)) {
      showMessage('This order does not belong to the current account.');
      return;
    }

    renderOrder(order);
  } catch (error) {
    showMessage(error.message || 'Unable to load order details right now.');
  }
}

initOrderView();