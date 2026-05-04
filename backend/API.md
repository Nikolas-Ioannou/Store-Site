# Store API

Run the backend with:

```bash
python3 backend/server.py
```

Base URL:

```text
http://127.0.0.1:8000
```

Available endpoints:

```text
GET    /api/health
GET    /api/dashboard

GET    /api/categories
GET    /api/products
GET    /api/products/:id
GET    /api/trending

GET    /api/users
GET    /api/users/:id
POST   /api/users
POST   /api/users/:id/addresses
PATCH  /api/users/:id/addresses/:address_id
DELETE /api/users/:id/addresses/:address_id
POST   /api/users/:id/invoice-profile
DELETE /api/users/:id/invoice-profile
PATCH  /api/users/:id/profile

GET    /api/auth/session?token=...
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

POST   /api/carts
GET    /api/carts/:id
POST   /api/carts/:id/items
PATCH  /api/carts/:id/items/:item_id
DELETE /api/carts/:id/items/:item_id

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PATCH  /api/orders/:id/status

GET    /api/payments
POST   /api/payments
PATCH  /api/payments/:id

GET    /api/shipments
POST   /api/shipments
PATCH  /api/shipments/:id

GET    /api/reports/best-seller-categories
GET    /api/reports/daily-product-revenue
GET    /api/reports/daily-category-revenue
GET    /api/reports/total-revenue
GET    /api/reports/low-stock
```

Notes:

```text
- The backend initializes database/store.db automatically from database/schema.sql.
- Product and commerce seed data are loaded automatically the first time the database is created.
- The server also serves the current static frontend from /, /styles.css, /script.js, and /favicon.svg.
```