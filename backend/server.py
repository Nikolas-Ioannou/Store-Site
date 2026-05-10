import hashlib
import json
import mimetypes
import re
import secrets
from datetime import UTC, datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from store_database import ROOT_DIR, StoreDatabase


HOST = '127.0.0.1'
PORT = 8000
MAX_INVOICE_PROFILES = 5
STATIC_EXTENSIONS = {'.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif'}
db = StoreDatabase()
db.initialize()


def row_to_dict(row):
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def rows_to_dicts(rows):
    return [row_to_dict(row) for row in rows]


def parse_json_body(handler):
    content_length = int(handler.headers.get('Content-Length', '0'))
    if content_length == 0:
        return {}
    raw_body = handler.rfile.read(content_length)
    if not raw_body:
        return {}
    return json.loads(raw_body.decode('utf-8'))


def utc_timestamp():
    return datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')


def hash_password(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def session_expiry(days=14):
    return (datetime.now(UTC) + timedelta(days=days)).replace(microsecond=0).strftime('%Y-%m-%d %H:%M:%S')


def to_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}


def has_address_payload(body):
    return any(
        str(body.get(field, '')).strip()
        for field in ('line_1', 'line_2', 'postal_code', 'city', 'region', 'recipient_name')
    )


def has_invoice_payload(body):
    return to_bool(body.get('invoice_requested')) or any(
        str(body.get(field, '')).strip()
        for field in ('company_name', 'tax_id', 'tax_office', 'profession')
    )


def build_session_payload(session_token):
    session = db.fetch_one(
        '''
        SELECT us.id, us.user_id, us.session_token, us.expires_at, us.last_seen_at, us.created_at,
               u.email, u.first_name, u.last_name, u.phone, u.landline, u.role, u.is_active, u.last_login_at, u.updated_at
        FROM user_sessions us
        INNER JOIN users u ON u.id = us.user_id
        WHERE us.session_token = ?
        ''',
        (session_token,),
    )
    if session is None:
        return None

    payload = {
        'session': {
            'id': session['id'],
            'user_id': session['user_id'],
            'session_token': session['session_token'],
            'expires_at': session['expires_at'],
            'last_seen_at': session['last_seen_at'],
            'created_at': session['created_at'],
        },
        'user': {
            'id': session['user_id'],
            'email': session['email'],
            'first_name': session['first_name'],
            'last_name': session['last_name'],
            'phone': session['phone'],
            'landline': session['landline'],
            'role': session['role'],
            'is_active': session['is_active'],
            'last_login_at': session['last_login_at'],
            'updated_at': session['updated_at'],
        },
    }
    return payload


def build_cart_payload(cart_id):
    cart = db.fetch_one(
        '''
        SELECT id, user_id, session_token, status, currency_code, created_at, updated_at, expires_at
        FROM carts
        WHERE id = ?
        ''',
        (cart_id,),
    )
    if cart is None:
        return None

    items = db.fetch_all(
        '''
        SELECT
            ci.id,
            ci.product_id,
            p.sku,
            p.name AS product_name,
            ci.quantity,
            ci.unit_price,
            ci.quantity * ci.unit_price AS line_total
        FROM cart_items ci
        INNER JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = ?
        ORDER BY ci.id ASC
        ''',
        (cart_id,),
    )

    payload = row_to_dict(cart)
    payload['items'] = rows_to_dicts(items)
    payload['item_count'] = sum(item['quantity'] for item in payload['items'])
    payload['subtotal_amount'] = round(
        sum(float(item['line_total']) for item in payload['items']),
        2,
    )
    return payload


def upsert_primary_address(connection, user_id, body, fallback_recipient=None):
    if not has_address_payload(body):
      return None

    line_1 = str(body.get('line_1', '')).strip()
    city = str(body.get('city', '')).strip()
    postal_code = str(body.get('postal_code', '')).strip()
    if not line_1 or not city or not postal_code:
        raise ValueError('line_1, city, and postal_code are required for address details')

    recipient_name = str(body.get('recipient_name', '')).strip() or fallback_recipient or 'Customer'
    address = connection.execute(
        '''
        SELECT id
        FROM user_addresses
        WHERE user_id = ?
        ORDER BY is_default_shipping DESC, is_default_billing DESC, id ASC
        LIMIT 1
        ''',
        (user_id,),
    ).fetchone()

    params = (
        body.get('label', 'Primary address'),
        recipient_name,
        line_1,
        body.get('line_2'),
        city,
        postal_code,
        body.get('region'),
        body.get('country_code', 'GR'),
        1,
        1,
        user_id,
    )

    if address is None:
        connection.execute(
            '''
            INSERT INTO user_addresses (
                label, recipient_name, line_1, line_2, city, postal_code, region,
                country_code, is_default_shipping, is_default_billing, user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            params,
        )
    else:
        connection.execute(
            '''
            UPDATE user_addresses
            SET label = ?, recipient_name = ?, line_1 = ?, line_2 = ?, city = ?, postal_code = ?,
                region = ?, country_code = ?, is_default_shipping = ?, is_default_billing = ?
            WHERE user_id = ?
            ''',
            params,
        )


def get_user_recipient_name(user_id):
    user = db.fetch_one('SELECT first_name, last_name FROM users WHERE id = ?', (user_id,))
    if user is None:
        return 'Customer'

    full_name = ' '.join(part.strip() for part in (user['first_name'] or '', user['last_name'] or '') if str(part).strip())
    return full_name or 'Customer'


def save_invoice_profile(connection, user_id, body, invoice_profile_id=None):
    invoice_requested = to_bool(body.get('invoice_requested'))

    if not invoice_requested and not has_invoice_payload(body):
        return

    company_name = str(body.get('company_name', '')).strip()
    tax_id = str(body.get('tax_id', '')).strip()
    if not company_name or not tax_id:
        raise ValueError('company_name and tax_id are required for invoice details')

    line_1 = str(body.get('line_1', '')).strip()
    city = str(body.get('city', '')).strip()
    postal_code = str(body.get('postal_code', '')).strip()
    if not line_1 or not city or not postal_code:
        raise ValueError('line_1, city, and postal_code are required for invoice details')

    params = (
        company_name,
        tax_id,
        body.get('tax_office'),
        body.get('profession'),
        line_1,
        city,
        postal_code,
        body.get('region'),
        body.get('phone'),
    )

    if invoice_profile_id is None:
        existing_count = connection.execute(
            'SELECT COUNT(*) FROM invoice_profiles WHERE user_id = ?',
            (user_id,),
        ).fetchone()[0]
        if existing_count >= MAX_INVOICE_PROFILES:
            raise ValueError(f'You can save up to {MAX_INVOICE_PROFILES} invoice profiles')

        connection.execute(
            '''
            INSERT INTO invoice_profiles (
                company_name, tax_id, tax_office, profession, line_1, city, postal_code, region, phone, user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (*params, user_id),
        )
        return

    existing = connection.execute(
        'SELECT id FROM invoice_profiles WHERE id = ? AND user_id = ?',
        (invoice_profile_id, user_id),
    ).fetchone()
    if existing is None:
        raise ValueError('Invoice profile not found')

    connection.execute(
        '''
        UPDATE invoice_profiles
        SET company_name = ?, tax_id = ?, tax_office = ?, profession = ?, line_1 = ?, city = ?,
            postal_code = ?, region = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
        ''',
        (*params, invoice_profile_id, user_id),
    )


def fetch_invoice_profiles(user_id):
    return db.fetch_all(
        '''
        SELECT id, company_name, tax_id, tax_office, profession, line_1, city, postal_code, region, phone, created_at, updated_at
        FROM invoice_profiles
        WHERE user_id = ?
        ORDER BY datetime(created_at) ASC, id ASC
        ''',
        (user_id,),
    )


def build_order_payload(order_id):
    order = db.fetch_one(
        '''
        SELECT *
        FROM view_order_overview
        WHERE order_id = ?
        ''',
        (order_id,),
    )
    if order is None:
        return None

    order_record = db.fetch_one('SELECT * FROM orders WHERE id = ?', (order_id,))
    shipping_address = None
    billing_address = None
    customer_phone = None

    if order_record is not None:
        if order_record['shipping_address_id']:
            shipping_address = db.fetch_one(
                'SELECT id, label, recipient_name, line_1, line_2, city, postal_code, region, country_code FROM user_addresses WHERE id = ?',
                (order_record['shipping_address_id'],),
            )
        if order_record['billing_address_id']:
            billing_address = db.fetch_one(
                'SELECT id, label, recipient_name, line_1, line_2, city, postal_code, region, country_code FROM user_addresses WHERE id = ?',
                (order_record['billing_address_id'],),
            )
        if order_record['user_id']:
            customer = db.fetch_one('SELECT phone FROM users WHERE id = ?', (order_record['user_id'],))
            customer_phone = customer['phone'] if customer is not None else None

    items = db.fetch_all(
        '''
        SELECT id, product_id, sku, product_name, quantity, unit_price, line_total, created_at
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
        ''',
        (order_id,),
    )
    payments = db.fetch_all(
        '''
        SELECT id, provider, provider_payment_ref, amount, currency_code, status, paid_at, created_at
        FROM payments
        WHERE order_id = ?
        ORDER BY id ASC
        ''',
        (order_id,),
    )
    shipments = db.fetch_all(
        '''
        SELECT id, shipping_method_id, tracking_number, carrier_name, status, shipped_at, delivered_at, created_at
        FROM shipments
        WHERE order_id = ?
        ORDER BY id ASC
        ''',
        (order_id,),
    )
    status_history = db.fetch_all(
        '''
        SELECT id, previous_status, new_status, changed_by_user_id, note, created_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY id ASC
        ''',
        (order_id,),
    )

    payload = row_to_dict(order)
    payload['status'] = payload.get('order_status')
    payload['order'] = row_to_dict(order_record)
    payload['shipping_address'] = row_to_dict(shipping_address)
    payload['billing_address'] = row_to_dict(billing_address)
    payload['customer_phone'] = customer_phone
    payload['items'] = rows_to_dicts(items)
    payload['payments'] = rows_to_dicts(payments)
    payload['shipments'] = rows_to_dicts(shipments)
    payload['status_history'] = rows_to_dicts(status_history)

    installment_plan = db.fetch_one(
        '''
        SELECT id, status, paid_count, installment_count, installment_amount, total_amount, currency_code, next_due_date
        FROM order_installment_plans
        WHERE order_id = ?
        ''',
        (order_id,),
    )
    payload['installment_plan'] = row_to_dict(installment_plan)

    return payload


class StoreRequestHandler(BaseHTTPRequestHandler):
    server_version = 'StoreSiteAPI/1.0'

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self._send_common_headers('application/json')
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query = parse_qs(parsed_url.query)

        try:
            if path == '/api/health':
                return self.send_json({'status': 'ok', 'database': 'ready'})
            if path == '/api/categories':
                return self.handle_get_categories()
            if path == '/api/products':
                return self.handle_get_products(query)
            if path == '/api/trending':
                return self.handle_get_trending(query)
            if path == '/api/users':
                return self.handle_get_users()
            if path == '/api/auth/session':
                return self.handle_get_auth_session(query)
            if path == '/api/orders':
                return self.handle_get_orders(query)
            if path == '/api/installments':
                return self.handle_get_installments(query)
            if path == '/api/coupons':
                return self.handle_get_coupons(query)
            if path == '/api/payments':
                return self.handle_get_payments()
            if path == '/api/shipments':
                return self.handle_get_shipments()
            if path == '/api/dashboard':
                return self.handle_get_dashboard()
            if path == '/api/reports/best-seller-categories':
                return self.handle_view_query('view_best_seller_categories')
            if path == '/api/reports/daily-product-revenue':
                return self.handle_view_query('view_daily_product_revenue')
            if path == '/api/reports/daily-category-revenue':
                return self.handle_view_query('view_daily_category_revenue')
            if path == '/api/reports/total-revenue':
                return self.handle_single_view('view_total_revenue')
            if path == '/api/reports/low-stock':
                return self.handle_view_query('view_low_stock_products')

            product_match = re.fullmatch(r'/api/products/(\d+)', path)
            if product_match:
                return self.handle_get_product(int(product_match.group(1)))

            user_match = re.fullmatch(r'/api/users/(\d+)', path)
            if user_match:
                return self.handle_get_user(int(user_match.group(1)))

            cart_match = re.fullmatch(r'/api/carts/(\d+)', path)
            if cart_match:
                return self.handle_get_cart(int(cart_match.group(1)))

            order_match = re.fullmatch(r'/api/orders/(\d+)', path)
            if order_match:
                return self.handle_get_order(int(order_match.group(1)))

            return self.serve_static(path)
        except ValueError as error:
            return self.send_json({'error': str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            return self.send_json({'error': str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        try:
            body = parse_json_body(self)

            if path == '/api/users':
                return self.handle_create_user(body)
            if path == '/api/auth/register':
                return self.handle_register(body)
            if path == '/api/auth/login':
                return self.handle_login(body)
            if path == '/api/auth/logout':
                return self.handle_logout(body)
            if path == '/api/carts':
                return self.handle_create_cart(body)
            if path == '/api/orders':
                return self.handle_create_order(body)
            if path == '/api/payments':
                return self.handle_create_payment(body)
            if path == '/api/shipments':
                return self.handle_create_shipment(body)

            installment_pay_match = re.fullmatch(r'/api/installments/(\d+)/pay', path)
            if installment_pay_match:
                return self.handle_pay_installment(int(installment_pay_match.group(1)), body)

            address_match = re.fullmatch(r'/api/users/(\d+)/addresses', path)
            if address_match:
                return self.handle_create_user_address(int(address_match.group(1)), body)

            invoice_match = re.fullmatch(r'/api/users/(\d+)/invoice-profiles', path)
            if invoice_match:
                return self.handle_create_invoice_profile(int(invoice_match.group(1)), body)

            cart_item_match = re.fullmatch(r'/api/carts/(\d+)/items', path)
            if cart_item_match:
                return self.handle_add_cart_item(int(cart_item_match.group(1)), body)

            return self.send_json({'error': 'Route not found'}, HTTPStatus.NOT_FOUND)
        except ValueError as error:
            return self.send_json({'error': str(error)}, HTTPStatus.BAD_REQUEST)
        except json.JSONDecodeError:
            return self.send_json({'error': 'Invalid JSON body'}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            return self.send_json({'error': str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_PATCH(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        try:
            body = parse_json_body(self)

            cart_item_match = re.fullmatch(r'/api/carts/(\d+)/items/(\d+)', path)
            if cart_item_match:
                return self.handle_update_cart_item(
                    int(cart_item_match.group(1)),
                    int(cart_item_match.group(2)),
                    body,
                )

            order_match = re.fullmatch(r'/api/orders/(\d+)/status', path)
            if order_match:
                return self.handle_update_order_status(int(order_match.group(1)), body)

            payment_match = re.fullmatch(r'/api/payments/(\d+)', path)
            if payment_match:
                return self.handle_update_payment(int(payment_match.group(1)), body)

            shipment_match = re.fullmatch(r'/api/shipments/(\d+)', path)
            if shipment_match:
                return self.handle_update_shipment(int(shipment_match.group(1)), body)

            profile_match = re.fullmatch(r'/api/users/(\d+)/profile', path)
            if profile_match:
                return self.handle_update_user_profile(int(profile_match.group(1)), body)

            address_match = re.fullmatch(r'/api/users/(\d+)/addresses/(\d+)', path)
            if address_match:
                return self.handle_update_user_address(
                    int(address_match.group(1)),
                    int(address_match.group(2)),
                    body,
                )

            invoice_match = re.fullmatch(r'/api/users/(\d+)/invoice-profiles/(\d+)', path)
            if invoice_match:
                return self.handle_update_invoice_profile(
                    int(invoice_match.group(1)),
                    int(invoice_match.group(2)),
                    body,
                )

            return self.send_json({'error': 'Route not found'}, HTTPStatus.NOT_FOUND)
        except ValueError as error:
            return self.send_json({'error': str(error)}, HTTPStatus.BAD_REQUEST)
        except json.JSONDecodeError:
            return self.send_json({'error': 'Invalid JSON body'}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            return self.send_json({'error': str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_DELETE(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        try:
            cart_item_match = re.fullmatch(r'/api/carts/(\d+)/items/(\d+)', path)
            if cart_item_match:
                return self.handle_delete_cart_item(
                    int(cart_item_match.group(1)),
                    int(cart_item_match.group(2)),
                )

            address_match = re.fullmatch(r'/api/users/(\d+)/addresses/(\d+)', path)
            if address_match:
                return self.handle_delete_user_address(
                    int(address_match.group(1)),
                    int(address_match.group(2)),
                )

            invoice_match = re.fullmatch(r'/api/users/(\d+)/invoice-profiles/(\d+)', path)
            if invoice_match:
                return self.handle_delete_invoice_profile(int(invoice_match.group(1)), int(invoice_match.group(2)))

            return self.send_json({'error': 'Route not found'}, HTTPStatus.NOT_FOUND)
        except Exception as error:
            return self.send_json({'error': str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_get_categories(self):
        rows = db.fetch_all('SELECT id, name, slug, created_at FROM categories ORDER BY name ASC')
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_get_products(self, query):
        limit = int(query.get('limit', ['24'])[0])
        search = query.get('search', [''])[0].strip()
        category = query.get('category', [''])[0].strip()

        clauses = ['is_active = 1']
        params = []

        if search:
            clauses.append('(LOWER(product_name) LIKE ? OR LOWER(COALESCE(brand, \"\")) LIKE ?)')
            like = f'%{search.lower()}%'
            params.extend([like, like])

        if category:
            clauses.append('(category_slug = ? OR LOWER(category_name) = ?)')
            params.extend([category, category.lower()])

        sql = f'''
            SELECT *
            FROM view_product_catalog
            WHERE {' AND '.join(clauses)}
            ORDER BY product_name ASC
            LIMIT ?
        '''
        params.append(limit)
        rows = db.fetch_all(sql, tuple(params))
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_get_product(self, product_id):
        product = db.fetch_one('SELECT * FROM view_product_catalog WHERE product_id = ?', (product_id,))
        if product is None:
            return self.send_json({'error': 'Product not found'}, HTTPStatus.NOT_FOUND)

        photos = db.fetch_all(
            'SELECT id, photo_url, alt_text, sort_order, is_primary FROM product_photos WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
            (product_id,),
        )
        description_photos = db.fetch_all(
            'SELECT id, photo_url, caption, sort_order FROM product_description_photos WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
            (product_id,),
        )

        payload = row_to_dict(product)
        payload['photos'] = rows_to_dicts(photos)
        payload['description_photos'] = rows_to_dicts(description_photos)
        self.send_json(payload)

    def handle_get_trending(self, query):
        limit = int(query.get('limit', ['10'])[0])
        rows = db.fetch_all('SELECT * FROM view_trending_products LIMIT ?', (limit,))
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_get_users(self):
        rows = db.fetch_all(
            '''
            SELECT id, email, first_name, last_name, phone, role, is_active, last_login_at, created_at, updated_at
            FROM users
            ORDER BY id ASC
            '''
        )
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_get_user(self, user_id):
        user = db.fetch_one(
            '''
            SELECT id, email, first_name, last_name, phone, landline, role, is_active, last_login_at, created_at, updated_at
            FROM users
            WHERE id = ?
            ''',
            (user_id,),
        )
        if user is None:
            return self.send_json({'error': 'User not found'}, HTTPStatus.NOT_FOUND)

        addresses = db.fetch_all(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY id ASC',
            (user_id,),
        )
        payment_methods = db.fetch_all(
            'SELECT id, method_type, provider, card_brand, card_last4, expiry_month, expiry_year, is_default, is_active, created_at FROM payment_methods WHERE user_id = ? ORDER BY id ASC',
            (user_id,),
        )
        order_rows = db.fetch_all('SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC', (user_id,))
        orders = [build_order_payload(row['id']) for row in order_rows]
        invoice_profiles = fetch_invoice_profiles(user_id)
        primary_address = db.fetch_one(
            '''
            SELECT id, label, recipient_name, line_1, line_2, city, postal_code, region, country_code,
                   is_default_shipping, is_default_billing, created_at
            FROM user_addresses
            WHERE user_id = ?
            ORDER BY is_default_shipping DESC, is_default_billing DESC, id ASC
            LIMIT 1
            ''',
            (user_id,),
        )

        payload = row_to_dict(user)
        payload['addresses'] = rows_to_dicts(addresses)
        payload['primary_address'] = row_to_dict(primary_address)
        payload['payment_methods'] = rows_to_dicts(payment_methods)
        payload['orders'] = orders
        payload['invoice_profiles'] = rows_to_dicts(invoice_profiles)
        payload['invoice_profile'] = row_to_dict(invoice_profiles[0]) if invoice_profiles else None
        self.send_json(payload)

    def handle_get_auth_session(self, query):
        session_token = query.get('token', [''])[0].strip()
        if not session_token:
            return self.send_json({'error': 'token is required'}, HTTPStatus.BAD_REQUEST)

        payload = build_session_payload(session_token)
        if payload is None:
            return self.send_json({'error': 'Session not found'}, HTTPStatus.NOT_FOUND)

        self.send_json(payload)

    def handle_create_user(self, body):
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        password_hash = body.get('password_hash', '')
        first_name = body.get('first_name', '').strip()
        last_name = body.get('last_name', '').strip()

        if not email or not first_name or not last_name:
            raise ValueError('email, first_name, and last_name are required')
        if not password and not password_hash:
            raise ValueError('password or password_hash is required')

        stored_password_hash = password_hash or hash_password(password)
        if db.fetch_one('SELECT id FROM users WHERE email = ?', (email,)) is not None:
            return self.send_json({'error': 'Email is already registered'}, HTTPStatus.CONFLICT)
        user_id = db.execute(
            '''
            INSERT INTO users (email, password_hash, first_name, last_name, phone, landline, role, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                email,
                stored_password_hash,
                first_name,
                last_name,
                body.get('phone'),
                body.get('landline'),
                body.get('role', 'customer'),
                int(body.get('is_active', 1)),
            ),
        )
        self.send_json(self._safe_user(user_id), HTTPStatus.CREATED)

    def handle_register(self, body):
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        first_name = body.get('first_name', '').strip()
        last_name = body.get('last_name', '').strip()

        if not email or not password or not first_name or not last_name:
            raise ValueError('email, password, first_name, and last_name are required')
        if db.fetch_one('SELECT id FROM users WHERE email = ?', (email,)) is not None:
            return self.send_json({'error': 'Email is already registered'}, HTTPStatus.CONFLICT)

        def create_user(connection):
            cursor = connection.execute(
                '''
                INSERT INTO users (email, password_hash, first_name, last_name, phone, landline, role, is_active, last_login_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    email,
                    hash_password(password),
                    first_name,
                    last_name,
                    body.get('phone'),
                    body.get('landline'),
                    'customer',
                    1,
                    utc_timestamp(),
                ),
            )
            user_id = cursor.lastrowid
            recipient = f'{first_name} {last_name}'.strip()
            upsert_primary_address(connection, user_id, body, recipient)
            save_invoice_profile(connection, user_id, body)
            return user_id

        user_id = db.run_transaction(create_user)
        session_token = self._create_session(user_id)
        self.send_json(build_session_payload(session_token), HTTPStatus.CREATED)

    def handle_create_invoice_profile(self, user_id, body):
        if db.fetch_one('SELECT id FROM users WHERE id = ?', (user_id,)) is None:
            return self.send_json({'error': 'User not found'}, HTTPStatus.NOT_FOUND)

        invoice_profile_id = db.run_transaction(lambda connection: save_invoice_profile(connection, user_id, body))
        invoice_profile = db.fetch_one(
            'SELECT id, company_name, tax_id, tax_office, profession, line_1, city, postal_code, region, phone, created_at, updated_at FROM invoice_profiles WHERE id = ? AND user_id = ?',
            (invoice_profile_id, user_id),
        )
        self.send_json({'invoice_profile': row_to_dict(invoice_profile)}, HTTPStatus.CREATED)

    def handle_update_invoice_profile(self, user_id, invoice_profile_id, body):
        if db.fetch_one('SELECT id FROM users WHERE id = ?', (user_id,)) is None:
            return self.send_json({'error': 'User not found'}, HTTPStatus.NOT_FOUND)

        db.run_transaction(lambda connection: save_invoice_profile(connection, user_id, body, invoice_profile_id))
        invoice_profile = db.fetch_one(
            'SELECT id, company_name, tax_id, tax_office, profession, line_1, city, postal_code, region, phone, created_at, updated_at FROM invoice_profiles WHERE id = ? AND user_id = ?',
            (invoice_profile_id, user_id),
        )
        self.send_json({'invoice_profile': row_to_dict(invoice_profile)})

    def handle_delete_invoice_profile(self, user_id, invoice_profile_id):
        if db.fetch_one('SELECT id FROM users WHERE id = ?', (user_id,)) is None:
            return self.send_json({'error': 'User not found'}, HTTPStatus.NOT_FOUND)

        deleted = db.execute('DELETE FROM invoice_profiles WHERE user_id = ? AND id = ?', (user_id, invoice_profile_id))
        self.send_json({'status': 'deleted'})

    def handle_update_user_profile(self, user_id, body):
        user = db.fetch_one('SELECT id, first_name, last_name, email, phone, landline FROM users WHERE id = ?', (user_id,))
        if user is None:
            return self.send_json({'error': 'User not found'}, HTTPStatus.NOT_FOUND)

        def update_profile(connection):
            first_name = str(body.get('first_name', user['first_name'])).strip()
            last_name = str(body.get('last_name', user['last_name'])).strip()
            email = str(body.get('email', user['email'])).strip().lower()
            phone = body.get('phone', user['phone'])
            landline = body.get('landline', user['landline'])

            if not first_name or not last_name or not email:
                raise ValueError('first_name, last_name, and email are required')

            existing_user = connection.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                (email, user_id),
            ).fetchone()
            if existing_user is not None:
                raise ValueError('Email is already registered')

            connection.execute(
                'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, landline = ? WHERE id = ?',
                (first_name, last_name, email, phone, landline, user_id),
            )

            recipient = f"{first_name} {last_name}".strip()
            if has_address_payload(body):
                upsert_primary_address(connection, user_id, body, recipient)
            save_invoice_profile(connection, user_id, body)

        db.run_transaction(update_profile)
        self.send_json(self._build_full_user_payload(user_id))

    def handle_login(self, body):
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')

        if not email or not password:
            raise ValueError('email and password are required')

        user = db.fetch_one(
            '''
            SELECT id, password_hash, is_active
            FROM users
            WHERE email = ?
            ''',
            (email,),
        )
        if user is None or user['password_hash'] != hash_password(password):
            return self.send_json({'error': 'Invalid email or password'}, HTTPStatus.UNAUTHORIZED)
        if int(user['is_active']) != 1:
            return self.send_json({'error': 'User account is inactive'}, HTTPStatus.FORBIDDEN)

        db.execute('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', (utc_timestamp(), utc_timestamp(), user['id']))
        session_token = self._create_session(user['id'])
        self.send_json(build_session_payload(session_token))

    def handle_logout(self, body):
        session_token = body.get('session_token', '').strip()
        if not session_token:
            raise ValueError('session_token is required')

        session = db.fetch_one('SELECT id FROM user_sessions WHERE session_token = ?', (session_token,))
        if session is None:
            return self.send_json({'error': 'Session not found'}, HTTPStatus.NOT_FOUND)

        db.execute('DELETE FROM user_sessions WHERE session_token = ?', (session_token,))
        self.send_json({'status': 'logged_out'})

    def handle_create_user_address(self, user_id, body):
        if db.fetch_one('SELECT id FROM users WHERE id = ?', (user_id,)) is None:
            return self.send_json({'error': 'User not found'}, HTTPStatus.NOT_FOUND)

        required = ['line_1', 'city', 'postal_code']
        for field in required:
            if not body.get(field):
                raise ValueError(f'{field} is required')

        recipient_name = get_user_recipient_name(user_id)

        def create_address(connection):
            is_default_shipping = int(to_bool(body.get('is_default_shipping', 0)))
            is_default_billing = int(to_bool(body.get('is_default_billing', 0)))

            if is_default_shipping:
                connection.execute('UPDATE user_addresses SET is_default_shipping = 0 WHERE user_id = ?', (user_id,))
            if is_default_billing:
                connection.execute('UPDATE user_addresses SET is_default_billing = 0 WHERE user_id = ?', (user_id,))

            cursor = connection.execute(
                '''
                INSERT INTO user_addresses (
                    user_id, label, recipient_name, line_1, line_2, city, postal_code, region,
                    country_code, is_default_shipping, is_default_billing
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    user_id,
                    body.get('label'),
                    recipient_name,
                    body['line_1'],
                    body.get('line_2'),
                    body['city'],
                    body['postal_code'],
                    body.get('region'),
                    body.get('country_code', 'GR'),
                    is_default_shipping,
                    is_default_billing,
                ),
            )
            return cursor.lastrowid

        address_id = db.run_transaction(create_address)
        address = db.fetch_one('SELECT * FROM user_addresses WHERE id = ?', (address_id,))
        self.send_json(row_to_dict(address), HTTPStatus.CREATED)

    def handle_update_user_address(self, user_id, address_id, body):
        address = db.fetch_one(
            'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
            (address_id, user_id),
        )
        if address is None:
            return self.send_json({'error': 'Address not found'}, HTTPStatus.NOT_FOUND)

        recipient_name = get_user_recipient_name(user_id)
        line_1 = str(body.get('line_1', address['line_1'])).strip()
        city = str(body.get('city', address['city'])).strip()
        postal_code = str(body.get('postal_code', address['postal_code'])).strip()

        if not line_1 or not city or not postal_code:
            raise ValueError('line_1, city, and postal_code are required')

        is_default_shipping = int(to_bool(body.get('is_default_shipping', address['is_default_shipping'])))
        is_default_billing = int(to_bool(body.get('is_default_billing', address['is_default_billing'])))

        def update_address(connection):
            if is_default_shipping:
                connection.execute('UPDATE user_addresses SET is_default_shipping = 0 WHERE user_id = ?', (user_id,))
            if is_default_billing:
                connection.execute('UPDATE user_addresses SET is_default_billing = 0 WHERE user_id = ?', (user_id,))

            connection.execute(
                '''
                UPDATE user_addresses
                SET label = ?, recipient_name = ?, line_1 = ?, line_2 = ?, city = ?, postal_code = ?,
                    region = ?, country_code = ?, is_default_shipping = ?, is_default_billing = ?
                WHERE id = ? AND user_id = ?
                ''',
                (
                    str(body.get('label', address['label'] or '')).strip() or None,
                    recipient_name,
                    line_1,
                    str(body.get('line_2', address['line_2'] or '')).strip() or None,
                    city,
                    postal_code,
                    str(body.get('region', address['region'] or '')).strip() or None,
                    str(body.get('country_code', address['country_code'] or 'GR')).strip() or 'GR',
                    is_default_shipping,
                    is_default_billing,
                    address_id,
                    user_id,
                ),
            )

        db.run_transaction(update_address)
        updated_address = db.fetch_one('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?', (address_id, user_id))
        self.send_json(row_to_dict(updated_address))

    def handle_delete_user_address(self, user_id, address_id):
        address = db.fetch_one(
            'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
            (address_id, user_id),
        )
        if address is None:
            return self.send_json({'error': 'Address not found'}, HTTPStatus.NOT_FOUND)

        db.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', (address_id, user_id))
        self.send_json({'status': 'deleted'})

    def handle_create_cart(self, body):
        user_id = body.get('user_id')
        session_token = body.get('session_token')
        if not user_id and not session_token:
            raise ValueError('user_id or session_token is required')

        cart_id = db.execute(
            '''
            INSERT INTO carts (user_id, session_token, status, currency_code, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (
                user_id,
                session_token,
                body.get('status', 'active'),
                body.get('currency_code', 'EUR'),
                body.get('expires_at'),
            ),
        )
        self.send_json(build_cart_payload(cart_id), HTTPStatus.CREATED)

    def handle_get_cart(self, cart_id):
        payload = build_cart_payload(cart_id)
        if payload is None:
            return self.send_json({'error': 'Cart not found'}, HTTPStatus.NOT_FOUND)
        self.send_json(payload)

    def handle_add_cart_item(self, cart_id, body):
        cart = db.fetch_one('SELECT id FROM carts WHERE id = ?', (cart_id,))
        if cart is None:
            return self.send_json({'error': 'Cart not found'}, HTTPStatus.NOT_FOUND)

        product_id = body.get('product_id')
        quantity = int(body.get('quantity', 1))
        if not product_id or quantity <= 0:
            raise ValueError('product_id and positive quantity are required')

        product = db.fetch_one('SELECT id, cost FROM products WHERE id = ? AND is_active = 1', (product_id,))
        if product is None:
            return self.send_json({'error': 'Product not found'}, HTTPStatus.NOT_FOUND)

        existing = db.fetch_one(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
            (cart_id, product_id),
        )
        if existing:
            db.execute(
                'UPDATE cart_items SET quantity = ?, unit_price = ? WHERE id = ?',
                (existing['quantity'] + quantity, product['cost'], existing['id']),
            )
        else:
            db.execute(
                'INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                (cart_id, product_id, quantity, product['cost']),
            )
        self.send_json(build_cart_payload(cart_id), HTTPStatus.CREATED)

    def handle_update_cart_item(self, cart_id, item_id, body):
        quantity = int(body.get('quantity', 0))
        if quantity <= 0:
            raise ValueError('quantity must be greater than 0')

        item = db.fetch_one('SELECT id FROM cart_items WHERE id = ? AND cart_id = ?', (item_id, cart_id))
        if item is None:
            return self.send_json({'error': 'Cart item not found'}, HTTPStatus.NOT_FOUND)

        db.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', (quantity, item_id))
        self.send_json(build_cart_payload(cart_id))

    def handle_delete_cart_item(self, cart_id, item_id):
        item = db.fetch_one('SELECT id FROM cart_items WHERE id = ? AND cart_id = ?', (item_id, cart_id))
        if item is None:
            return self.send_json({'error': 'Cart item not found'}, HTTPStatus.NOT_FOUND)
        db.execute('DELETE FROM cart_items WHERE id = ?', (item_id,))
        self.send_json(build_cart_payload(cart_id))

    def handle_get_orders(self, query):
        limit = int(query.get('limit', ['25'])[0])
        status = query.get('status', [''])[0].strip()
        sql = 'SELECT * FROM view_order_overview'
        params = []
        if status:
            sql += ' WHERE order_status = ?'
            params.append(status)
        sql += ' ORDER BY order_id DESC LIMIT ?'
        params.append(limit)
        rows = db.fetch_all(sql, tuple(params))
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_get_order(self, order_id):
        payload = build_order_payload(order_id)
        if payload is None:
            return self.send_json({'error': 'Order not found'}, HTTPStatus.NOT_FOUND)
        self.send_json(payload)

    def handle_get_installments(self, query):
        user_id = query.get('user_id', [None])[0]
        if not user_id:
            raise ValueError('user_id is required')

        plans = db.fetch_all(
            '''
            SELECT ip.id, ip.order_id, ip.total_amount, ip.currency_code,
                   ip.installment_count, ip.installment_amount, ip.paid_count,
                   ip.status, ip.next_due_date, ip.created_at, ip.updated_at,
                   o.order_number, o.placed_at, o.status AS order_status
            FROM order_installment_plans ip
            INNER JOIN orders o ON o.id = ip.order_id
            WHERE ip.user_id = ?
            ORDER BY ip.created_at DESC
            ''',
            (int(user_id),),
        )

        result = []
        for plan in plans:
            plan_dict = row_to_dict(plan)
            payments = db.fetch_all(
                '''
                SELECT id, installment_number, amount, status, due_date, paid_at
                FROM installment_payments
                WHERE plan_id = ?
                ORDER BY installment_number ASC
                ''',
                (plan['id'],),
            )
            plan_dict['payments'] = rows_to_dicts(payments)
            order_items = db.fetch_all(
                'SELECT product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = ? ORDER BY id ASC',
                (plan['order_id'],),
            )
            plan_dict['order_items'] = rows_to_dicts(order_items)
            result.append(plan_dict)

        self.send_json({'items': result})

    def handle_pay_installment(self, plan_id, body):
        plan = db.fetch_one(
            'SELECT id, user_id, paid_count, installment_count, status FROM order_installment_plans WHERE id = ?',
            (plan_id,),
        )
        if plan is None:
            return self.send_json({'error': 'Installment plan not found'}, HTTPStatus.NOT_FOUND)
        if plan['status'] != 'active':
            return self.send_json({'error': 'Installment plan is not active'}, HTTPStatus.BAD_REQUEST)
        if plan['paid_count'] >= plan['installment_count']:
            return self.send_json({'error': 'All installments have been paid'}, HTTPStatus.BAD_REQUEST)

        next_payment = db.fetch_one(
            "SELECT id, installment_number FROM installment_payments WHERE plan_id = ? AND status = 'pending' ORDER BY installment_number ASC LIMIT 1",
            (plan_id,),
        )
        if next_payment is None:
            return self.send_json({'error': 'No pending installment found'}, HTTPStatus.BAD_REQUEST)

        now = utc_timestamp()
        new_paid_count = plan['paid_count'] + 1
        new_status = 'completed' if new_paid_count >= plan['installment_count'] else 'active'

        # Compute next_due_date from the next pending payment after this one
        def do_pay(connection):
            connection.execute(
                "UPDATE installment_payments SET status = 'paid', paid_at = ? WHERE id = ?",
                (now, next_payment['id']),
            )
            next_pending = connection.execute(
                "SELECT due_date FROM installment_payments WHERE plan_id = ? AND status = 'pending' AND installment_number > ? ORDER BY installment_number ASC LIMIT 1",
                (plan_id, next_payment['installment_number']),
            ).fetchone()
            next_due_date = next_pending['due_date'] if next_pending else None
            connection.execute(
                'UPDATE order_installment_plans SET paid_count = ?, status = ?, next_due_date = ?, updated_at = ? WHERE id = ?',
                (new_paid_count, new_status, next_due_date, now, plan_id),
            )

        db.run_transaction(do_pay)
        updated_plan = db.fetch_one(
            '''
            SELECT ip.id, ip.paid_count, ip.installment_count, ip.installment_amount,
                   ip.status, ip.next_due_date, ip.currency_code, o.order_number
            FROM order_installment_plans ip
            INNER JOIN orders o ON o.id = ip.order_id
            WHERE ip.id = ?
            ''',
            (plan_id,),
        )
        self.send_json({'plan': row_to_dict(updated_plan)})

    def handle_get_coupons(self, query):
        user_id = query.get('user_id', [None])[0]
        if not user_id:
            raise ValueError('user_id is required')

        rows = db.fetch_all(
            '''
            SELECT c.id, c.code, c.description, c.discount_type, c.discount_value,
                   c.currency_code, c.min_order_amount, c.max_uses, c.times_used,
                   c.valid_from, c.valid_until, c.is_active,
                   uc.assigned_at, uc.used_at
            FROM user_coupons uc
            INNER JOIN coupons c ON c.id = uc.coupon_id
            WHERE uc.user_id = ?
            ORDER BY uc.used_at IS NULL DESC, uc.assigned_at DESC
            ''',
            (int(user_id),),
        )
        self.send_json({'items': rows_to_dicts(rows)})
        cart_id = body.get('cart_id')
        if not cart_id:
            raise ValueError('cart_id is required')

        def create_order(connection):
            cart = connection.execute(
                'SELECT * FROM carts WHERE id = ?',
                (cart_id,),
            ).fetchone()
            if cart is None:
                raise ValueError('Cart not found')

            cart_items = connection.execute(
                '''
                SELECT ci.product_id, ci.quantity, ci.unit_price, p.sku, p.name
                FROM cart_items ci
                INNER JOIN products p ON p.id = ci.product_id
                WHERE ci.cart_id = ?
                ORDER BY ci.id ASC
                ''',
                (cart_id,),
            ).fetchall()
            if not cart_items:
                raise ValueError('Cart is empty')

            shipping_method_id = body.get('shipping_method_id')
            shipping_amount = 0.0
            if shipping_method_id:
                shipping_row = connection.execute(
                    'SELECT base_cost FROM shipping_methods WHERE id = ?',
                    (shipping_method_id,),
                ).fetchone()
                if shipping_row is None:
                    raise ValueError('Shipping method not found')
                shipping_amount = float(shipping_row['base_cost'])

            subtotal_amount = round(
                sum(float(item['quantity']) * float(item['unit_price']) for item in cart_items),
                2,
            )
            tax_amount = float(body.get('tax_amount', 0))
            discount_amount = float(body.get('discount_amount', 0))
            total_amount = round(subtotal_amount + shipping_amount + tax_amount - discount_amount, 2)

            next_sequence = connection.execute('SELECT COUNT(*) + 1 FROM orders').fetchone()[0]
            order_number = f"BH-{datetime.now(UTC).strftime('%Y%m%d')}-{next_sequence:04d}"
            placed_at = body.get('placed_at', utc_timestamp())

            order_cursor = connection.execute(
                '''
                INSERT INTO orders (
                    order_number, user_id, cart_id, status, payment_status, fulfillment_status,
                    currency_code, subtotal_amount, shipping_amount, tax_amount, discount_amount,
                    total_amount, shipping_address_id, billing_address_id, placed_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                (
                    order_number,
                    body.get('user_id', cart['user_id']),
                    cart_id,
                    body.get('status', 'pending'),
                    body.get('payment_status', 'unpaid'),
                    body.get('fulfillment_status', 'unfulfilled'),
                    body.get('currency_code', cart['currency_code']),
                    subtotal_amount,
                    shipping_amount,
                    tax_amount,
                    discount_amount,
                    total_amount,
                    body.get('shipping_address_id'),
                    body.get('billing_address_id'),
                    placed_at,
                ),
            )
            order_id = order_cursor.lastrowid

            for item in cart_items:
                line_total = round(float(item['quantity']) * float(item['unit_price']), 2)
                connection.execute(
                    '''
                    INSERT INTO order_items (order_id, product_id, sku, product_name, quantity, unit_price, line_total)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''',
                    (
                        order_id,
                        item['product_id'],
                        item['sku'],
                        item['name'],
                        item['quantity'],
                        item['unit_price'],
                        line_total,
                    ),
                )
                connection.execute(
                    '''
                    INSERT OR REPLACE INTO inventory_reservations (order_id, product_id, quantity, status, created_at, updated_at)
                    VALUES (?, ?, ?, 'reserved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ''',
                    (order_id, item['product_id'], item['quantity']),
                )
                warehouse = connection.execute('SELECT id FROM warehouses ORDER BY id ASC LIMIT 1').fetchone()
                if warehouse is not None:
                    connection.execute(
                        '''
                        INSERT INTO inventory_movements (
                            product_id, warehouse_id, movement_type, quantity_change, reference_type, reference_id, note
                        ) VALUES (?, ?, 'reservation', ?, 'order', ?, ?)
                        ''',
                        (
                            item['product_id'],
                            warehouse['id'],
                            -int(item['quantity']),
                            order_id,
                            f'Reserved for order {order_number}.',
                        ),
                    )

            connection.execute(
                '''
                INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, note)
                VALUES (?, NULL, ?, ?, ?)
                ''',
                (
                    order_id,
                    body.get('status', 'pending'),
                    body.get('changed_by_user_id'),
                    body.get('note', 'Order created via API.'),
                ),
            )

            payment_method_id = body.get('payment_method_id')
            if payment_method_id or body.get('create_payment', True):
                connection.execute(
                    '''
                    INSERT INTO payments (
                        order_id, user_id, payment_method_id, provider, provider_payment_ref, amount,
                        currency_code, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ''',
                    (
                        order_id,
                        body.get('user_id', cart['user_id']),
                        payment_method_id,
                        body.get('payment_provider', 'manual'),
                        body.get('provider_payment_ref'),
                        total_amount,
                        body.get('currency_code', cart['currency_code']),
                        body.get('payment_record_status', 'pending'),
                    ),
                )

            if shipping_method_id:
                shipping_method = connection.execute(
                    'SELECT carrier_name FROM shipping_methods WHERE id = ?',
                    (shipping_method_id,),
                ).fetchone()
                connection.execute(
                    '''
                    INSERT INTO shipments (
                        order_id, shipping_method_id, tracking_number, carrier_name, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ''',
                    (
                        order_id,
                        shipping_method_id,
                        body.get('tracking_number'),
                        body.get('carrier_name', shipping_method['carrier_name']),
                        body.get('shipment_status', 'pending'),
                    ),
                )

            connection.execute('UPDATE carts SET status = ? WHERE id = ?', ('converted', cart_id))
            return order_id

        order_id = db.run_transaction(create_order)
        self.send_json(build_order_payload(order_id), HTTPStatus.CREATED)

    def handle_update_order_status(self, order_id, body):
        order = db.fetch_one('SELECT status, payment_status, fulfillment_status FROM orders WHERE id = ?', (order_id,))
        if order is None:
            return self.send_json({'error': 'Order not found'}, HTTPStatus.NOT_FOUND)

        new_status = body.get('status', order['status'])
        payment_status = body.get('payment_status', order['payment_status'])
        fulfillment_status = body.get('fulfillment_status', order['fulfillment_status'])

        db.execute(
            'UPDATE orders SET status = ?, payment_status = ?, fulfillment_status = ? WHERE id = ?',
            (new_status, payment_status, fulfillment_status, order_id),
        )
        db.execute(
            '''
            INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by_user_id, note)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (
                order_id,
                order['status'],
                new_status,
                body.get('changed_by_user_id'),
                body.get('note'),
            ),
        )
        self.send_json(build_order_payload(order_id))

    def handle_get_payments(self):
        rows = db.fetch_all(
            '''
            SELECT p.id, p.order_id, p.user_id, p.provider, p.provider_payment_ref, p.amount,
                   p.currency_code, p.status, p.authorized_at, p.captured_at, p.paid_at,
                   o.order_number
            FROM payments p
            LEFT JOIN orders o ON o.id = p.order_id
            ORDER BY p.id DESC
            '''
        )
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_create_payment(self, body):
        order_id = body.get('order_id')
        provider = body.get('provider', 'manual')
        if not order_id:
            raise ValueError('order_id is required')

        order = db.fetch_one('SELECT user_id, total_amount, currency_code FROM orders WHERE id = ?', (order_id,))
        if order is None:
            return self.send_json({'error': 'Order not found'}, HTTPStatus.NOT_FOUND)

        payment_id = db.execute(
            '''
            INSERT INTO payments (
                order_id, user_id, payment_method_id, provider, provider_payment_ref, amount,
                currency_code, status, authorized_at, captured_at, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                order_id,
                order['user_id'],
                body.get('payment_method_id'),
                provider,
                body.get('provider_payment_ref'),
                body.get('amount', order['total_amount']),
                body.get('currency_code', order['currency_code']),
                body.get('status', 'pending'),
                body.get('authorized_at'),
                body.get('captured_at'),
                body.get('paid_at'),
            ),
        )

        db.execute(
            '''
            INSERT INTO payment_transactions (
                payment_id, transaction_type, provider_transaction_ref, amount, currency_code, status, raw_response
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                payment_id,
                body.get('transaction_type', 'sale'),
                body.get('provider_transaction_ref'),
                body.get('amount', order['total_amount']),
                body.get('currency_code', order['currency_code']),
                body.get('transaction_status', 'success'),
                json.dumps(body.get('raw_response', {})),
            ),
        )

        payment = db.fetch_one('SELECT * FROM payments WHERE id = ?', (payment_id,))
        self.send_json(row_to_dict(payment), HTTPStatus.CREATED)

    def handle_update_payment(self, payment_id, body):
        payment = db.fetch_one('SELECT * FROM payments WHERE id = ?', (payment_id,))
        if payment is None:
            return self.send_json({'error': 'Payment not found'}, HTTPStatus.NOT_FOUND)

        status = body.get('status', payment['status'])
        authorized_at = body.get('authorized_at', payment['authorized_at'])
        captured_at = body.get('captured_at', payment['captured_at'])
        paid_at = body.get('paid_at', payment['paid_at'])
        refunded_at = body.get('refunded_at', payment['refunded_at'])
        failure_reason = body.get('failure_reason', payment['failure_reason'])

        db.execute(
            '''
            UPDATE payments
            SET status = ?, authorized_at = ?, captured_at = ?, paid_at = ?, refunded_at = ?, failure_reason = ?
            WHERE id = ?
            ''',
            (status, authorized_at, captured_at, paid_at, refunded_at, failure_reason, payment_id),
        )
        updated = db.fetch_one('SELECT * FROM payments WHERE id = ?', (payment_id,))
        self.send_json(row_to_dict(updated))

    def handle_get_shipments(self):
        rows = db.fetch_all(
            '''
            SELECT s.id, s.order_id, s.shipping_method_id, s.tracking_number, s.carrier_name,
                   s.status, s.shipped_at, s.delivered_at, o.order_number
            FROM shipments s
            LEFT JOIN orders o ON o.id = s.order_id
            ORDER BY s.id DESC
            '''
        )
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_create_shipment(self, body):
        if not body.get('order_id'):
            raise ValueError('order_id is required')

        shipment_id = db.execute(
            '''
            INSERT INTO shipments (
                order_id, shipping_method_id, tracking_number, carrier_name, status, shipped_at, delivered_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                body['order_id'],
                body.get('shipping_method_id'),
                body.get('tracking_number'),
                body.get('carrier_name'),
                body.get('status', 'pending'),
                body.get('shipped_at'),
                body.get('delivered_at'),
            ),
        )
        shipment = db.fetch_one('SELECT * FROM shipments WHERE id = ?', (shipment_id,))
        self.send_json(row_to_dict(shipment), HTTPStatus.CREATED)

    def handle_update_shipment(self, shipment_id, body):
        shipment = db.fetch_one('SELECT * FROM shipments WHERE id = ?', (shipment_id,))
        if shipment is None:
            return self.send_json({'error': 'Shipment not found'}, HTTPStatus.NOT_FOUND)

        db.execute(
            '''
            UPDATE shipments
            SET tracking_number = ?, carrier_name = ?, status = ?, shipped_at = ?, delivered_at = ?
            WHERE id = ?
            ''',
            (
                body.get('tracking_number', shipment['tracking_number']),
                body.get('carrier_name', shipment['carrier_name']),
                body.get('status', shipment['status']),
                body.get('shipped_at', shipment['shipped_at']),
                body.get('delivered_at', shipment['delivered_at']),
                shipment_id,
            ),
        )
        updated = db.fetch_one('SELECT * FROM shipments WHERE id = ?', (shipment_id,))
        self.send_json(row_to_dict(updated))

    def handle_view_query(self, view_name):
        rows = db.fetch_all(f'SELECT * FROM {view_name}')
        self.send_json({'items': rows_to_dicts(rows)})

    def handle_single_view(self, view_name):
        row = db.fetch_one(f'SELECT * FROM {view_name}')
        self.send_json(row_to_dict(row))

    def handle_get_dashboard(self):
        dashboard = {
            'total_revenue': row_to_dict(db.fetch_one('SELECT * FROM view_total_revenue')),
            'trending_products': rows_to_dicts(db.fetch_all('SELECT * FROM view_trending_products LIMIT 5')),
            'best_seller_categories': rows_to_dicts(db.fetch_all('SELECT * FROM view_best_seller_categories LIMIT 5')),
            'recent_orders': rows_to_dicts(db.fetch_all('SELECT * FROM view_order_overview ORDER BY order_id DESC LIMIT 5')),
        }
        self.send_json(dashboard)

    def _build_full_user_payload(self, user_id):
        user = db.fetch_one(
            '''
            SELECT id, email, first_name, last_name, phone, landline, role, is_active, last_login_at, created_at, updated_at
            FROM users
            WHERE id = ?
            ''',
            (user_id,),
        )
        if user is None:
            return None

        addresses = db.fetch_all('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY id ASC', (user_id,))
        payment_methods = db.fetch_all(
            'SELECT id, method_type, provider, card_brand, card_last4, expiry_month, expiry_year, is_default, is_active, created_at FROM payment_methods WHERE user_id = ? ORDER BY id ASC',
            (user_id,),
        )
        order_rows = db.fetch_all('SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC', (user_id,))
        orders = [build_order_payload(row['id']) for row in order_rows]
        invoice_profiles = fetch_invoice_profiles(user_id)
        primary_address = db.fetch_one(
            '''
            SELECT id, label, recipient_name, line_1, line_2, city, postal_code, region, country_code,
                   is_default_shipping, is_default_billing, created_at
            FROM user_addresses
            WHERE user_id = ?
            ORDER BY is_default_shipping DESC, is_default_billing DESC, id ASC
            LIMIT 1
            ''',
            (user_id,),
        )

        payload = row_to_dict(user)
        payload['addresses'] = rows_to_dicts(addresses)
        payload['primary_address'] = row_to_dict(primary_address)
        payload['payment_methods'] = rows_to_dicts(payment_methods)
        payload['orders'] = orders
        payload['invoice_profiles'] = rows_to_dicts(invoice_profiles)
        payload['invoice_profile'] = row_to_dict(invoice_profiles[0]) if invoice_profiles else None
        return payload

    def serve_static(self, path):
        requested_path = 'index.html' if path == '/' else path.lstrip('/')
        file_path = (ROOT_DIR / requested_path).resolve()
        if ROOT_DIR not in file_path.parents and file_path != ROOT_DIR:
            return self.send_json({'error': 'Route not found'}, HTTPStatus.NOT_FOUND)
        if not file_path.exists() or file_path.suffix.lower() not in STATIC_EXTENSIONS:
            return self.send_json({'error': 'Route not found'}, HTTPStatus.NOT_FOUND)

        content_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
        body = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self._send_common_headers(content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _safe_user(self, user_id):
        user = db.fetch_one(
            '''
            SELECT id, email, first_name, last_name, phone, landline, role, is_active, last_login_at, created_at, updated_at
            FROM users
            WHERE id = ?
            ''',
            (user_id,),
        )
        return row_to_dict(user)

    def _create_session(self, user_id):
        session_token = secrets.token_hex(24)
        db.execute(
            '''
            INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, last_seen_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ''',
            (
                user_id,
                session_token,
                self.client_address[0] if self.client_address else None,
                self.headers.get('User-Agent'),
                utc_timestamp(),
                session_expiry(),
            ),
        )
        return session_token

    def _send_common_headers(self, content_type):
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, default=str).encode('utf-8')
        self.send_response(status)
        self._send_common_headers('application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_server(host=HOST, port=PORT):
    server = ThreadingHTTPServer((host, port), StoreRequestHandler)
    print(f'Store backend running on http://{host}:{port}')
    server.serve_forever()


if __name__ == '__main__':
    run_server()