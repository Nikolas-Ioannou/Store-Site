INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    last_login_at
)
VALUES
    (
        'nikos@example.com',
        'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
        'Nikos',
        'Ioannou',
        '+306900000001',
        'customer',
        1,
        '2026-05-01 10:30:00'
    );

INSERT INTO user_sessions (
    user_id,
    session_token,
    ip_address,
    user_agent,
    last_seen_at,
    expires_at
)
VALUES
    (
        1,
        'session-user-001',
        '192.168.1.22',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '2026-05-03 08:55:00',
        '2026-05-10 08:55:00'
    );

INSERT INTO user_addresses (
    user_id,
    label,
    recipient_name,
    line_1,
    line_2,
    city,
    postal_code,
    region,
    country_code,
    is_default_shipping,
    is_default_billing
)
VALUES
    (
        1,
        'Home',
        'Nikos Ioannou',
        '25 Ermou Street',
        'Apartment 3',
        'Athens',
        '10563',
        'Attica',
        'GR',
        1,
        1
    );

INSERT INTO carts (
    user_id,
    session_token,
    status,
    currency_code,
    expires_at
)
VALUES
    (
        1,
        NULL,
        'active',
        'EUR',
        '2026-05-10 23:59:59'
    ),
    (
        NULL,
        'guest-session-001',
        'abandoned',
        'EUR',
        '2026-04-28 23:59:59'
    );

INSERT INTO payment_methods (
    user_id,
    method_type,
    provider,
    provider_customer_ref,
    provider_payment_method_ref,
    card_brand,
    card_last4,
    expiry_month,
    expiry_year,
    is_default,
    is_active
)
VALUES
    (
        1,
        'card',
        'Stripe',
        'cus_demo_001',
        'pm_demo_001',
        'Visa',
        '4242',
        12,
        2028,
        1,
        1
    );

INSERT INTO shipping_methods (
    name,
    code,
    carrier_name,
    base_cost,
    estimated_days_min,
    estimated_days_max,
    is_active
)
VALUES
    ('Standard Courier', 'standard-courier', 'ACS Courier', 0.00, 1, 3, 1),
    ('Express Delivery', 'express-delivery', 'DHL Express', 7.90, 1, 1, 1);

INSERT INTO warehouses (
    name,
    code,
    city,
    country_code
)
VALUES
    ('Athens Main Warehouse', 'ATH-MAIN', 'Athens', 'GR');

INSERT INTO cart_items (
    cart_id,
    product_id,
    quantity,
    unit_price
)
VALUES
    (1, 1, 1, 1149.00),
    (1, 5, 2, 79.00),
    (2, 4, 1, 24.00);

INSERT INTO orders (
    order_number,
    user_id,
    cart_id,
    status,
    payment_status,
    fulfillment_status,
    currency_code,
    subtotal_amount,
    shipping_amount,
    tax_amount,
    discount_amount,
    total_amount,
    shipping_address_id,
    billing_address_id,
    placed_at
)
VALUES
    (
        'BH-20260503-0001',
        1,
        1,
        'processing',
        'authorized',
        'delivered',
        'EUR',
        1307.00,
        0.00,
        0.00,
        0.00,
        1307.00,
        1,
        1,
        '2026-05-03 09:15:00'
    );

INSERT INTO order_items (
    order_id,
    product_id,
    sku,
    product_name,
    quantity,
    unit_price,
    line_total
)
VALUES
    (1, 1, 'LAP-NOVA-15-001', 'NovaBook Pro 15', 1, 1149.00, 1149.00),
    (1, 5, 'ACC-BUDS-AIR-001', 'AeroBuds Lite', 2, 79.00, 158.00);

INSERT INTO payments (
    order_id,
    user_id,
    payment_method_id,
    provider,
    provider_payment_ref,
    amount,
    currency_code,
    status,
    authorized_at,
    captured_at,
    paid_at
)
VALUES
    (
        1,
        1,
        1,
        'Stripe',
        'pi_demo_001',
        1307.00,
        'EUR',
        'paid',
        '2026-05-03 09:10:00',
        '2026-05-03 09:14:00',
        '2026-05-03 09:14:00'
    );

INSERT INTO payment_transactions (
    payment_id,
    transaction_type,
    provider_transaction_ref,
    amount,
    currency_code,
    status,
    raw_response
)
VALUES
    (1, 'authorize', 'txn_auth_001', 1307.00, 'EUR', 'success', '{"provider":"Stripe","step":"authorize"}'),
    (1, 'capture', 'txn_capture_001', 1307.00, 'EUR', 'success', '{"provider":"Stripe","step":"capture"}');

INSERT INTO shipments (
    order_id,
    shipping_method_id,
    tracking_number,
    carrier_name,
    status,
    shipped_at
)
VALUES
    (
        1,
        1,
        'ACS123456789GR',
        'ACS Courier',
        'delivered',
        '2026-05-03 12:00:00'
    );

INSERT INTO order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by_user_id,
    note
)
VALUES
    (1, NULL, 'pending', 1, 'Order submitted by customer.'),
    (1, 'pending', 'processing', 1, 'Installment plan activated.'),
    (1, 'processing', 'processing', 1, 'Order delivered. Instalments ongoing.');

INSERT INTO inventory_movements (
    product_id,
    warehouse_id,
    movement_type,
    quantity_change,
    reference_type,
    reference_id,
    note
)
VALUES
    (1, 1, 'stock_in', 26, 'seed', 1, 'Initial stock import.'),
    (1, 1, 'reservation', -1, 'order', 1, 'Reserved for order BH-20260503-0001.'),
    (2, 1, 'stock_in', 40, 'seed', 2, 'Initial stock import.'),
    (3, 1, 'stock_in', 33, 'seed', 3, 'Initial stock import.'),
    (4, 1, 'stock_in', 120, 'seed', 4, 'Initial stock import.'),
    (5, 1, 'stock_in', 77, 'seed', 5, 'Initial stock import.'),
    (5, 1, 'reservation', -2, 'order', 1, 'Reserved for order BH-20260503-0001.');

INSERT INTO inventory_reservations (
    order_id,
    product_id,
    quantity,
    status
)
VALUES
    (1, 1, 1, 'reserved'),
    (1, 5, 2, 'reserved');

-- ── Completed order (BH-20260410-0002) ──────────────────────────────────────

INSERT INTO orders (
    order_number,
    user_id,
    cart_id,
    status,
    payment_status,
    fulfillment_status,
    currency_code,
    subtotal_amount,
    shipping_amount,
    tax_amount,
    discount_amount,
    total_amount,
    shipping_address_id,
    billing_address_id,
    placed_at
)
VALUES
    (
        'BH-20260410-0002',
        1,
        NULL,
        'completed',
        'paid',
        'delivered',
        'EUR',
        263.00,
        7.90,
        0.00,
        0.00,
        270.90,
        1,
        1,
        '2026-04-10 14:22:00'
    );

INSERT INTO order_items (
    order_id,
    product_id,
    sku,
    product_name,
    quantity,
    unit_price,
    line_total
)
VALUES
    (2, 2, 'ACC-KBD-MEC-001', 'MechType Pro Keyboard', 1, 129.00, 129.00),
    (2, 3, 'ACC-MSE-ERG-001', 'ErgoClick Mouse', 1, 59.00, 59.00),
    (2, 4, 'BK-DSGN-WEB-001', 'Web Design Mastery', 2, 24.00, 48.00),
    (2, 5, 'ACC-BUDS-AIR-001', 'AeroBuds Lite', 1, 79.00, 79.00);

INSERT INTO payments (
    order_id,
    user_id,
    payment_method_id,
    provider,
    provider_payment_ref,
    amount,
    currency_code,
    status,
    authorized_at,
    captured_at,
    paid_at
)
VALUES
    (
        2,
        1,
        1,
        'Stripe',
        'pi_demo_002',
        270.90,
        'EUR',
        'paid',
        '2026-04-10 14:20:00',
        '2026-04-10 14:21:00',
        '2026-04-10 14:21:00'
    );

INSERT INTO shipments (
    order_id,
    shipping_method_id,
    tracking_number,
    carrier_name,
    status,
    shipped_at,
    delivered_at
)
VALUES
    (
        2,
        2,
        'DHL987654321GR',
        'DHL Express',
        'delivered',
        '2026-04-11 09:00:00',
        '2026-04-12 13:45:00'
    );

INSERT INTO order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by_user_id,
    note
)
VALUES
    (2, NULL, 'pending', 1, 'Order submitted by customer.'),
    (2, 'pending', 'paid', 1, 'Payment captured successfully.'),
    (2, 'paid', 'processing', 1, 'Warehouse picking started.'),
    (2, 'processing', 'completed', 1, 'Order delivered and confirmed.');

-- ── Installment plans ────────────────────────────────────────────────────────

INSERT INTO order_installment_plans (
    order_id,
    user_id,
    total_amount,
    currency_code,
    installment_count,
    installment_amount,
    paid_count,
    status,
    next_due_date
)
VALUES
    (1, 1, 1307.00, 'EUR', 6, 217.83, 2, 'active', '2026-07-03'),
    (2, 1, 270.90, 'EUR', 3, 90.30, 3, 'completed', NULL);

INSERT INTO installment_payments (plan_id, installment_number, amount, status, due_date, paid_at)
VALUES
    (1, 1, 217.83, 'paid',    '2026-05-03', '2026-05-03 09:14:00'),
    (1, 2, 217.83, 'paid',    '2026-06-03', '2026-05-10 08:30:00'),
    (1, 3, 217.83, 'pending', '2026-07-03', NULL),
    (1, 4, 217.83, 'pending', '2026-08-03', NULL),
    (1, 5, 217.83, 'pending', '2026-09-03', NULL),
    (1, 6, 217.85, 'pending', '2026-10-03', NULL),
    (2, 1, 90.30,  'paid',    '2026-04-10', '2026-04-10 10:00:00'),
    (2, 2, 90.30,  'paid',    '2026-04-17', '2026-04-17 09:00:00'),
    (2, 3, 90.30,  'paid',    '2026-04-24', '2026-04-24 09:00:00');

-- ── Coupons ──────────────────────────────────────────────────────────────────

INSERT INTO coupons (code, description, discount_type, discount_value, currency_code, min_order_amount, max_uses, valid_from, valid_until, is_active)
VALUES
    ('WELCOME10', 'Welcome gift — 10% off your next order', 'percent', 10.00, 'EUR', NULL, 1, '2026-01-01', '2026-12-31', 1),
    ('SUMMER20',  'Summer sale — 20% off orders over €50',  'percent', 20.00, 'EUR', 50.00, NULL, '2026-06-01', '2026-08-31', 1),
    ('SAVE15',    'Fixed €15 discount on any order',         'fixed',   15.00, 'EUR', 30.00, NULL, '2026-01-01', '2026-12-31', 1);

INSERT INTO user_coupons (user_id, coupon_id, assigned_at, used_at)
VALUES
    (1, 1, '2026-04-01 10:00:00', '2026-04-10 10:00:00'),
    (1, 2, '2026-05-01 09:00:00', NULL),
    (1, 3, '2026-05-05 11:00:00', NULL);