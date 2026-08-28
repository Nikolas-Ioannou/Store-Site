-- Mirrors plaisio.gr's real top-level department structure (checked against
-- their live categories sitemap), trimmed to Bazaar's current lineup.
-- sort_order fixes the menu order: Phones, Laptops/Desktops/Peripherals, Upgrades & Networking, TVs & Audio, Gaming Zone.
INSERT INTO categories (name, slug, sort_order)
VALUES
    ('Phones, Tablets & Wearables', 'phones-tablets-wearables', 1),
    ('Laptops, Desktops & Peripherals', 'laptops-desktops', 2),
    ('Upgrades & Networking', 'upgrades-networking', 3),
    ('TVs & Audio', 'tvs-audio', 4),
    ('Gaming Zone', 'gaming-zone', 5);

INSERT INTO products (
    sku,
    name,
    category_id,
    brand,
    buying_price,
    selling_price,
    compare_at_price,
    currency_code,
    release_date,
    description,
    base_length_cm,
    base_depth_cm,
    base_height_cm,
    addon_length_cm,
    addon_depth_cm,
    addon_height_cm,
    has_addon,
    max_installments,
    stock_quantity,
    is_active
)
VALUES
    (
        'LAP-NOVA-15-001',
        'NovaBook Pro 15',
        2,
        'NovaTech',
        730.00,
        1149.00,
        1299.00,
        'EUR',
        '2025-09-15',
        '15-inch performance laptop with Intel Ultra processor, 16GB RAM, 512GB SSD, and long battery life for work and study.',
        35.60,
        24.10,
        1.79,
        NULL,
        NULL,
        NULL,
        0,
        24,
        25,
        1
    ),
    (
        'PHN-PULSE-X12-001',
        'Pulse X12',
        1,
        'Pulse Mobile',
        440.00,
        699.00,
        799.00,
        'EUR',
        '2026-01-20',
        '5G smartphone with bright OLED display, advanced camera system, and all-day battery for heavy daily use.',
        14.80,
        0.79,
        7.20,
        15.50,
        1.20,
        7.80,
        1,
        24,
        40,
        1
    ),
    (
        'TAB-SKETCH-11-001',
        'SketchTab 11',
        1,
        'Sketch',
        270.00,
        429.00,
        NULL,
        'EUR',
        '2025-11-08',
        'Portable 11-inch tablet with pen support, ideal for note taking, media use, and light creative work.',
        25.20,
        0.69,
        16.40,
        27.50,
        1.10,
        18.20,
        1,
        12,
        33,
        1
    ),
    (
        'ACC-BUDS-AIR-001',
        'AeroBuds Lite',
        4,
        'AeroSound',
        48.00,
        79.00,
        99.00,
        'EUR',
        '2025-07-01',
        'Wireless earbuds with compact charging case, clear calls, and balanced everyday sound.',
        6.20,
        2.80,
        4.80,
        NULL,
        NULL,
        NULL,
        0,
        6,
        75,
        1
    );

INSERT INTO product_photos (product_id, photo_url, alt_text, sort_order, is_primary)
VALUES
    (1, 'https://images.example.com/products/novabook-pro-15/front.jpg', 'NovaBook Pro 15 front view', 1, 1),
    (1, 'https://images.example.com/products/novabook-pro-15/side.jpg', 'NovaBook Pro 15 side profile', 2, 0),
    (2, 'https://images.example.com/products/pulse-x12/front.jpg', 'Pulse X12 front view', 1, 1),
    (2, 'https://images.example.com/products/pulse-x12/back.jpg', 'Pulse X12 rear cameras', 2, 0),
    (3, 'https://images.example.com/products/sketchtab-11/front.jpg', 'SketchTab 11 with stylus', 1, 1),
    (4, 'https://images.example.com/products/aerobuds-lite/main.jpg', 'AeroBuds Lite charging case', 1, 1);

INSERT INTO product_description_photos (product_id, photo_url, caption, sort_order)
VALUES
    (1, 'https://images.example.com/products/novabook-pro-15/lifestyle.jpg', 'Laptop shown in a study workspace.', 1),
    (2, 'https://images.example.com/products/pulse-x12/display.jpg', 'Close-up of the OLED display and camera module.', 1),
    (3, 'https://images.example.com/products/sketchtab-11/pen.jpg', 'Tablet drawing experience with pen accessory.', 1),
    (4, 'https://images.example.com/products/aerobuds-lite/in-ear.jpg', 'In-ear fit preview for the earbuds.', 1);

INSERT INTO stores (name, location)
VALUES
    ('Athens Store', 'Athens'),
    ('Thessaloniki Store', 'Thessaloniki'),
    ('Patras Store', 'Patras'),
    ('Larissa Store', 'Larissa');

INSERT INTO store_inventory (store_id, product_id, quantity)
VALUES
    -- NovaBook Pro 15
    (1, 1, 4), (2, 1, 2), (3, 1, 1), (4, 1, 3),
    -- Pulse X12
    (1, 2, 8), (2, 2, 5), (3, 2, 3), (4, 2, 4),
    -- SketchTab 11
    (1, 3, 5), (2, 3, 3), (3, 3, 2), (4, 3, 3),
    -- AeroBuds Lite
    (1, 4, 12), (2, 4, 8), (3, 4, 6), (4, 4, 7);