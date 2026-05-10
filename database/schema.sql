PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    brand TEXT,
    cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    release_date TEXT,
    description TEXT NOT NULL,
    base_length_cm DECIMAL(8, 2),
    base_depth_cm DECIMAL(8, 2),
    base_height_cm DECIMAL(8, 2),
    addon_length_cm DECIMAL(8, 2),
    addon_depth_cm DECIMAL(8, 2),
    addon_height_cm DECIMAL(8, 2),
    has_addon INTEGER NOT NULL DEFAULT 0 CHECK (has_addon IN (0, 1)),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS product_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_description_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    landline TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'support')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    label TEXT,
    recipient_name TEXT NOT NULL,
    line_1 TEXT NOT NULL,
    line_2 TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    region TEXT,
    country_code TEXT NOT NULL DEFAULT 'GR',
    is_default_shipping INTEGER NOT NULL DEFAULT 0 CHECK (is_default_shipping IN (0, 1)),
    is_default_billing INTEGER NOT NULL DEFAULT 0 CHECK (is_default_billing IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoice_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    tax_office TEXT,
    profession TEXT,
    line_1 TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    region TEXT,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_token TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    cart_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')
    ),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (
        payment_status IN ('unpaid', 'authorized', 'paid', 'failed', 'refunded')
    ),
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (
        fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'returned')
    ),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    subtotal_amount DECIMAL(10, 2) NOT NULL CHECK (subtotal_amount >= 0),
    shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_address_id INTEGER,
    billing_address_id INTEGER,
    placed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (billing_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    method_type TEXT NOT NULL CHECK (method_type IN ('card', 'paypal', 'bank_transfer', 'cash_on_delivery')),
    provider TEXT,
    provider_customer_ref TEXT,
    provider_payment_method_ref TEXT,
    card_brand TEXT,
    card_last4 TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER,
    payment_method_id INTEGER,
    provider TEXT NOT NULL,
    provider_payment_ref TEXT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'authorized', 'captured', 'paid', 'failed', 'voided', 'partially_refunded', 'refunded')
    ),
    authorized_at TEXT,
    captured_at TEXT,
    paid_at TEXT,
    refunded_at TEXT,
    failure_reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN ('authorize', 'capture', 'sale', 'refund', 'void', 'failure')
    ),
    provider_transaction_ref TEXT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    raw_response TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipping_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    carrier_name TEXT NOT NULL,
    base_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (base_cost >= 0),
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    shipping_method_id INTEGER,
    tracking_number TEXT,
    carrier_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'label_created', 'in_transit', 'delivered', 'failed', 'returned')
    ),
    shipped_at TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by_user_id INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'GR',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (
        movement_type IN ('stock_in', 'reservation', 'release', 'sale', 'return', 'adjustment')
    ),
    quantity_change INTEGER NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'released', 'fulfilled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_release_date ON products(release_date);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_photos_product_id ON product_photos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_description_photos_product_id ON product_description_photos(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_profiles_user_id ON invoice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse_id ON inventory_movements(warehouse_id);

CREATE TABLE IF NOT EXISTS order_installment_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    installment_count INTEGER NOT NULL CHECK (installment_count >= 2),
    installment_amount DECIMAL(10, 2) NOT NULL CHECK (installment_amount >= 0),
    paid_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
    next_due_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS installment_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'overdue')),
    due_date TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES order_installment_plans(id) ON DELETE CASCADE,
    UNIQUE (plan_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_installment_plans_user_id ON order_installment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_order_id ON order_installment_plans(order_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_plan_id ON installment_payments(plan_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order_id ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_id ON inventory_reservations(product_id);

CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    currency_code TEXT NOT NULL DEFAULT 'EUR',
    min_order_amount DECIMAL(10, 2),
    max_uses INTEGER,
    times_used INTEGER NOT NULL DEFAULT 0,
    valid_from TEXT,
    valid_until TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    UNIQUE (user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);

CREATE TRIGGER IF NOT EXISTS trg_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_invoice_profiles_updated_at
AFTER UPDATE ON invoice_profiles
FOR EACH ROW
BEGIN
    UPDATE invoice_profiles
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_carts_updated_at
AFTER UPDATE ON carts
FOR EACH ROW
BEGIN
    UPDATE carts
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_cart_items_updated_at
AFTER UPDATE ON cart_items
FOR EACH ROW
BEGIN
    UPDATE cart_items
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_orders_updated_at
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    UPDATE orders
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_payments_updated_at
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    UPDATE payments
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_shipments_updated_at
AFTER UPDATE ON shipments
FOR EACH ROW
BEGIN
    UPDATE shipments
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_inventory_reservations_updated_at
AFTER UPDATE ON inventory_reservations
FOR EACH ROW
BEGIN
    UPDATE inventory_reservations
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

CREATE VIEW IF NOT EXISTS view_product_catalog AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    c.slug AS category_slug,
    p.brand,
    p.cost,
    p.currency_code,
    p.release_date,
    p.description,
    p.stock_quantity,
    p.has_addon,
    pp.photo_url AS primary_photo_url,
    pp.alt_text AS primary_photo_alt,
    p.is_active,
    p.created_at,
    p.updated_at
FROM products p
INNER JOIN categories c ON c.id = p.category_id
LEFT JOIN product_photos pp
    ON pp.product_id = p.id
    AND pp.is_primary = 1;

CREATE VIEW IF NOT EXISTS view_trending_products AS
WITH ordered_units AS (
    SELECT
        oi.product_id,
        SUM(oi.quantity) AS sold_units,
        SUM(oi.line_total) AS sales_amount,
        COUNT(DISTINCT oi.order_id) AS order_count
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'processing', 'shipped', 'completed')
    GROUP BY oi.product_id
),
cart_interest AS (
    SELECT
        ci.product_id,
        SUM(ci.quantity) AS cart_units,
        COUNT(DISTINCT ci.cart_id) AS cart_count
    FROM cart_items ci
    INNER JOIN carts c ON c.id = ci.cart_id
    WHERE c.status = 'active'
    GROUP BY ci.product_id
)
SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    cat.name AS category_name,
    COALESCE(ou.sold_units, 0) AS sold_units,
    COALESCE(ou.sales_amount, 0) AS sales_amount,
    COALESCE(ou.order_count, 0) AS order_count,
    COALESCE(ci.cart_units, 0) AS cart_units,
    COALESCE(ci.cart_count, 0) AS cart_count,
    (COALESCE(ou.sold_units, 0) * 3) + COALESCE(ci.cart_units, 0) AS trending_score,
    p.stock_quantity,
    p.release_date
FROM products p
INNER JOIN categories cat ON cat.id = p.category_id
LEFT JOIN ordered_units ou ON ou.product_id = p.id
LEFT JOIN cart_interest ci ON ci.product_id = p.id
WHERE p.is_active = 1
ORDER BY trending_score DESC, sales_amount DESC, p.release_date DESC, p.name ASC;

CREATE VIEW IF NOT EXISTS view_low_stock_products AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    p.stock_quantity,
    COALESCE(SUM(CASE WHEN ir.status = 'reserved' THEN ir.quantity ELSE 0 END), 0) AS reserved_units,
    p.stock_quantity - COALESCE(SUM(CASE WHEN ir.status = 'reserved' THEN ir.quantity ELSE 0 END), 0) AS available_units
FROM products p
INNER JOIN categories c ON c.id = p.category_id
LEFT JOIN inventory_reservations ir ON ir.product_id = p.id
WHERE p.is_active = 1
GROUP BY p.id, p.sku, p.name, c.name, p.stock_quantity
HAVING available_units <= 10
ORDER BY available_units ASC, p.name ASC;

CREATE VIEW IF NOT EXISTS view_order_overview AS
SELECT
    o.id AS order_id,
    o.order_number,
    o.status AS order_status,
    o.payment_status,
    o.fulfillment_status,
    o.total_amount,
    o.currency_code,
    o.placed_at,
    u.email AS customer_email,
    u.first_name || ' ' || u.last_name AS customer_name,
    pay.provider AS payment_provider,
    pay.status AS latest_payment_status,
    s.carrier_name,
    s.tracking_number,
    s.status AS shipment_status
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
LEFT JOIN payments pay ON pay.order_id = o.id
LEFT JOIN shipments s ON s.order_id = o.id;

CREATE VIEW IF NOT EXISTS view_best_seller_categories AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    COUNT(DISTINCT oi.order_id) AS order_count,
    SUM(oi.quantity) AS sold_units,
    SUM(oi.line_total) AS revenue_amount
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
INNER JOIN products p ON p.id = oi.product_id
INNER JOIN categories c ON c.id = p.category_id
WHERE o.status IN ('paid', 'processing', 'shipped', 'completed')
GROUP BY c.id, c.name
ORDER BY sold_units DESC, revenue_amount DESC, c.name ASC;

CREATE VIEW IF NOT EXISTS view_daily_product_revenue AS
SELECT
    DATE(COALESCE(o.placed_at, o.created_at)) AS revenue_date,
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    c.name AS category_name,
    SUM(oi.quantity) AS sold_units,
    SUM(oi.line_total) AS revenue_amount,
    COUNT(DISTINCT oi.order_id) AS order_count
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
INNER JOIN products p ON p.id = oi.product_id
INNER JOIN categories c ON c.id = p.category_id
WHERE o.status IN ('paid', 'processing', 'shipped', 'completed')
GROUP BY DATE(COALESCE(o.placed_at, o.created_at)), p.id, p.sku, p.name, c.name
ORDER BY revenue_date DESC, revenue_amount DESC, product_name ASC;

CREATE VIEW IF NOT EXISTS view_daily_category_revenue AS
SELECT
    DATE(COALESCE(o.placed_at, o.created_at)) AS revenue_date,
    c.id AS category_id,
    c.name AS category_name,
    SUM(oi.quantity) AS sold_units,
    SUM(oi.line_total) AS revenue_amount,
    COUNT(DISTINCT oi.order_id) AS order_count
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
INNER JOIN products p ON p.id = oi.product_id
INNER JOIN categories c ON c.id = p.category_id
WHERE o.status IN ('paid', 'processing', 'shipped', 'completed')
GROUP BY DATE(COALESCE(o.placed_at, o.created_at)), c.id, c.name
ORDER BY revenue_date DESC, revenue_amount DESC, category_name ASC;

CREATE VIEW IF NOT EXISTS view_total_revenue AS
SELECT
    COUNT(DISTINCT o.id) AS paid_order_count,
    COALESCE(SUM(o.total_amount), 0) AS total_revenue_amount,
    COALESCE(SUM(o.subtotal_amount), 0) AS total_product_revenue_amount,
    COALESCE(SUM(o.shipping_amount), 0) AS total_shipping_revenue_amount,
    COALESCE(SUM(o.tax_amount), 0) AS total_tax_amount,
    COALESCE(SUM(o.discount_amount), 0) AS total_discount_amount,
    MIN(DATE(COALESCE(o.placed_at, o.created_at))) AS first_order_date,
    MAX(DATE(COALESCE(o.placed_at, o.created_at))) AS last_order_date,
    MAX(o.currency_code) AS currency_code
FROM orders o
WHERE o.status IN ('paid', 'processing', 'shipped', 'completed');
