const orderViewMessage = document.getElementById('order-view-message');
const orderViewContent = document.getElementById('order-view-content');
const orderViewTitle = document.getElementById('order-view-title');
const orderViewStatusIcon = document.getElementById('order-view-status-icon');
const orderViewStatusTitle = document.getElementById('order-view-status-title');
const orderViewStatusCopy = document.getElementById('order-view-status-copy');
const orderViewDate = document.getElementById('order-view-date');
const orderViewProductsCount = document.getElementById('order-view-products-count');
const orderViewProducts = document.getElementById('order-view-products');
const orderViewAddressLabel = document.getElementById('order-view-address-label');
const orderViewAddress = document.getElementById('order-view-address');
const orderViewPhone = document.getElementById('order-view-phone');
const orderViewTracking = document.getElementById('order-view-tracking');
const orderViewPayment = document.getElementById('order-view-payment');
const orderViewMeta = document.getElementById('order-view-meta');

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

  if (fulfillmentStatus) {
    const normalized = fulfillmentStatus.toLowerCase();

    if (normalized.includes('deliver')) {
      return {
        badge: 'Delivered',
        detail: 'Your order has been delivered.',
        iconSrc: 'Photos/delivery-truck.png',
      };
    }

    if (normalized.includes('ship') || normalized.includes('transit')) {
      return {
        badge: 'On the way',
        detail: 'Your parcel is moving with the carrier.',
        iconSrc: 'Photos/delivery-truck.png',
      };
    }

    if (normalized.includes('pack') || normalized.includes('ready') || normalized.includes('process')) {
      return {
        badge: 'Preparing',
        detail: 'Your order is being prepared for shipment.',
        iconSrc: 'Photos/box.png',
      };
    }
  }

  if (orderStatus && orderStatus.toLowerCase() === 'completed') {
    return {
      badge: 'Completed',
      detail: 'This order has been completed.',
      iconSrc: 'Photos/delivery-truck.png',
    };
  }

  if (paymentStatus && paymentStatus.toLowerCase().includes('paid')) {
    return {
      badge: 'Confirmed',
      detail: 'Payment received. We are preparing your order.',
      iconSrc: 'Photos/box.png',
    };
  }

  return {
    badge: 'Pending',
    detail: 'We received your order and are waiting for the next update.',
    iconSrc: 'Photos/box.png',
  };
}

function formatOrderAddress(address) {
  if (!address) {
    return 'No shipping address saved yet';
  }

  const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
  return [address.recipient_name, address.line_1, address.line_2, cityLine, address.region, address.country_code].filter(Boolean).join(', ');
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

  orderViewTitle.textContent = order.order_number || 'Order details';
  orderViewStatusIcon.src = progress.iconSrc;
  orderViewStatusTitle.textContent = progress.badge;
  orderViewStatusCopy.textContent = progress.detail;
  orderViewDate.textContent = order.placed_at || 'No date yet';
  orderViewProductsCount.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
  orderViewProducts.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article class="order-view-product-row">
              <div>
                <strong>${escapeHtml(item.product_name || item.sku || 'Product')}</strong>
                <small>${escapeHtml(item.sku || 'No SKU')} / Qty ${Number(item.quantity || 0)}</small>
              </div>
              <strong>${escapeHtml(formatCurrency(item.line_total || item.unit_price || 0, order.currency_code || 'EUR'))}</strong>
            </article>
          `,
        )
        .join('')
    : '<p class="order-detail-copy">No products available yet.</p>';
  orderViewAddressLabel.textContent = shippingAddress?.label || 'Saved address';
  orderViewAddress.textContent = formatOrderAddress(shippingAddress);
  orderViewPhone.textContent = order.customer_phone || 'No phone saved';
  orderViewTracking.textContent = shipment?.tracking_number
    ? [shipment.carrier_name || 'Carrier', shipment.tracking_number].filter(Boolean).join(' / ')
    : 'Tracking number will appear here when the carrier updates the parcel.';
  orderViewPayment.textContent = paymentLabel || 'Payment update pending';
  orderViewMeta.innerHTML = [
    { label: 'Total cost', value: formatCurrency(order.total_amount || 0, order.currency_code || 'EUR') },
    { label: 'Order status', value: toTitleCase(order.status || order.order_status || 'Pending') },
    { label: 'Fulfillment', value: toTitleCase(order.fulfillment_status || 'Unfulfilled') },
    { label: 'Shipment', value: toTitleCase(shipment?.status || order.shipment_status || 'Pending') },
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