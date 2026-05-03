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
        'demo_hash_customer_001',
        'Nikos',
        'Ioannou',
        '+306900000001',
        'customer',
        1,
        '2026-05-01 10:30:00'
    ),
    (
        'admin@bluehaven.example',
        'demo_hash_admin_001',
        'Store',
        'Admin',
        '+306900000999',
        'admin',
        1,
        '2026-05-02 08:00:00'
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
    ),
    (
        2,
        'Head Office',
        'Store Admin',
        '10 Kifisias Avenue',
        NULL,
        'Marousi',
        '15125',
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
        'paid',
        'processing',
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
        'in_transit',
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
    (1, 'pending', 'paid', 2, 'Payment captured successfully.'),
    (1, 'paid', 'processing', 2, 'Warehouse picking started.');

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