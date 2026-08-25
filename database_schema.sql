-- Manufacturers Table
CREATE TABLE manufacturers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories Table
CREATE TABLE product_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Products Table
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  manufacturer_id INT,
  price DECIMAL(10, 2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'EUR',
  stock_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id),
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
);

-- Product Photos Table
CREATE TABLE product_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  photo_type ENUM('gallery', 'description') DEFAULT 'gallery',
  is_main BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Product Characteristics/Specifications Table (flexible for any product type)
CREATE TABLE product_specifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  spec_key VARCHAR(100) NOT NULL,
  spec_value VARCHAR(500) NOT NULL,
  spec_order INT DEFAULT 0,
  UNIQUE KEY unique_spec (product_id, spec_key),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Example Data Insertions for Phones

-- Insert Manufacturer
INSERT INTO manufacturers (name, logo_url, description)
VALUES
  ('Apple', 'https://example.com/apple-logo.svg', 'Leading technology company known for innovative design and premium products'),
  ('Samsung', 'https://example.com/samsung-logo.svg', 'Global leader in electronics and mobile technology'),
  ('Xiaomi', 'https://example.com/xiaomi-logo.svg', 'Innovative smartphone and electronics manufacturer'),
  ('Sony', 'https://example.com/sony-logo.svg', 'Premium electronics and entertainment company');

-- Insert Product Categories
INSERT INTO product_categories (name, slug, description)
VALUES
  ('Phones', 'phones', 'Smartphones and mobile devices'),
  ('Tablets', 'tablets', 'Tablet devices'),
  ('Laptops', 'laptops', 'Laptop computers'),
  ('TVs', 'tvs', 'Television sets'),
  ('Monitors', 'monitors', 'Computer monitors'),
  ('Headphones', 'headphones', 'Headphones and earbuds'),
  ('Smartwatches', 'smartwatches', 'Smart wearable watches'),
  ('Cameras', 'cameras', 'Digital cameras'),
  ('Gaming Consoles', 'gaming_consoles', 'Gaming consoles'),
  ('PC Components', 'pc_components', 'Computer components'),
  ('Keyboards', 'keyboards', 'Computer keyboards'),
  ('Mice', 'mice', 'Computer mice'),
  ('Speakers', 'speakers', 'Audio speakers'),
  ('Home Appliances', 'home_appliances', 'Home appliances');

-- Insert Example Phone Product
INSERT INTO products (product_code, name, description, category_id, manufacturer_id, price)
VALUES
  ('SKU-000001', 'iPhone 15 Pro', 'Latest flagship smartphone with advanced camera system', 1, 1, 999.00);

-- Insert Phone Photos
INSERT INTO product_photos (product_id, photo_url, alt_text, photo_type, is_main, display_order)
VALUES
  (1, 'https://example.com/iphone15-1.jpg', 'iPhone 15 Pro front', 'gallery', TRUE, 1),
  (1, 'https://example.com/iphone15-2.jpg', 'iPhone 15 Pro side', 'gallery', FALSE, 2),
  (1, 'https://example.com/iphone15-3.jpg', 'iPhone 15 Pro back', 'gallery', FALSE, 3),
  (1, 'https://example.com/iphone15-4.jpg', 'iPhone 15 Pro specs', 'description', FALSE, 4);

-- Insert Phone Specifications
INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_order)
VALUES
  (1, 'Display Size', '6.1 inches', 1),
  (1, 'Resolution', 'Super Retina XDR', 2),
  (1, 'Refresh Rate', '120Hz', 3),
  (1, 'Panel Type', 'OLED', 4),
  (1, 'Processor', 'Apple A17 Pro', 5),
  (1, 'RAM', '8GB', 6),
  (1, 'Storage', '256GB / 512GB / 1TB', 7),
  (1, 'Camera', '48MP Main + 12MP Ultra Wide', 8),
  (1, 'Battery Capacity', '3274 mAh', 9),
  (1, 'Fast Charging', '27W', 10),
  (1, 'Operating System', 'iOS 17', 11),
  (1, '5G Support', 'Yes', 12);

-- Insert Example TV Product
INSERT INTO products (product_code, name, description, category_id, manufacturer_id, price)
VALUES
  ('SKU-000002', 'Samsung 85" 4K Smart TV', 'Premium 85-inch 4K Smart TV with gaming features', 4, 2, 2499.00);

INSERT INTO product_photos (product_id, photo_url, alt_text, photo_type, is_main, display_order)
VALUES
  (2, 'https://example.com/samsung-tv-1.jpg', 'Samsung TV front', 'gallery', TRUE, 1),
  (2, 'https://example.com/samsung-tv-2.jpg', 'Samsung TV side', 'gallery', FALSE, 2);

INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_order)
VALUES
  (2, 'Screen Size', '85 inches', 1),
  (2, 'Resolution', '4K UHD', 2),
  (2, 'Refresh Rate', '120Hz', 3),
  (2, 'Panel Type', 'QLED', 4),
  (2, 'Smart TV System', 'Samsung Tizen OS', 5),
  (2, 'HDR Support', 'HDR10+, Dolby Vision', 6),
  (2, 'HDMI Ports', '4x HDMI 2.1', 7),
  (2, 'Gaming Features', 'VRR, ALLM, 120Hz Gaming', 8),
  (2, 'Sound System', 'Dolby Atmos, 40W Stereo', 9),
  (2, 'Energy Class', 'A', 10);

-- Insert Example Laptop Product
INSERT INTO products (product_code, name, description, category_id, manufacturer_id, price)
VALUES
  ('SKU-000003', 'MacBook Pro 16"', 'Professional laptop with M3 Max chip', 3, 1, 3499.00);

INSERT INTO product_photos (product_id, photo_url, alt_text, photo_type, is_main, display_order)
VALUES
  (3, 'https://example.com/macbook-1.jpg', 'MacBook Pro open', 'gallery', TRUE, 1),
  (3, 'https://example.com/macbook-2.jpg', 'MacBook Pro closed', 'gallery', FALSE, 2),
  (3, 'https://example.com/macbook-3.jpg', 'MacBook Pro keyboard', 'description', FALSE, 3);

INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_order)
VALUES
  (3, 'Screen Size', '16 inches', 1),
  (3, 'Processor', 'Apple M3 Max', 2),
  (3, 'Graphics Card', 'Apple M3 Max GPU', 3),
  (3, 'RAM', '36GB', 4),
  (3, 'Storage Type', '1TB SSD', 5),
  (3, 'Battery Life', 'Up to 18 hours', 6),
  (3, 'Display Resolution', '3456 x 2234', 7),
  (3, 'Refresh Rate', '120Hz', 8),
  (3, 'Weight', '2.15 kg', 9),
  (3, 'Operating System', 'macOS Ventura', 10);

-- Query Example: Get all product info with specs
SELECT
  p.id,
  p.product_code,
  p.name,
  p.description,
  pc.name AS category,
  m.name AS manufacturer,
  m.logo_url AS manufacturer_logo,
  p.price,
  p.currency_code,
  (SELECT photo_url FROM product_photos WHERE product_id = p.id AND is_main = TRUE LIMIT 1) AS main_photo,
  (SELECT COUNT(*) FROM product_photos WHERE product_id = p.id) AS total_photos,
  (SELECT JSON_OBJECT('spec_key', spec_key, 'spec_value', spec_value)
   FROM product_specifications
   WHERE product_id = p.id
   ORDER BY spec_order) AS specifications
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id;

-- Query Example: Get single product with all details
SELECT
  p.*,
  pc.name AS category_name,
  pc.slug AS category_slug,
  m.name AS manufacturer_name,
  m.logo_url AS manufacturer_logo,
  m.description AS manufacturer_description,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', ph.id,
      'photo_url', ph.photo_url,
      'alt_text', ph.alt_text,
      'is_main', ph.is_main,
      'display_order', ph.display_order
    )
  ) AS photos
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN product_photos ph ON p.id = ph.product_id
WHERE p.id = ?
GROUP BY p.id;

-- Query Example: Get product specs as object
SELECT
  p.id,
  p.name,
  JSON_OBJECT_AGG(ps.spec_key, ps.spec_value) AS specifications
FROM products p
LEFT JOIN product_specifications ps ON p.id = ps.product_id
WHERE p.id = ?
GROUP BY p.id;
