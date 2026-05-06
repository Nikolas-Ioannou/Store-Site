from pathlib import Path
import sqlite3


ROOT_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT_DIR / 'database' / 'schema.sql'
SEED_PATHS = [
    ROOT_DIR / 'database' / 'seed_products.sql',
    ROOT_DIR / 'database' / 'seed_commerce.sql',
]
DB_PATH = ROOT_DIR / 'database' / 'store.db'


class StoreDatabase:
    def __init__(self, db_path: Path | None = None) -> None:
        self.db_path = db_path or DB_PATH

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute('PRAGMA foreign_keys = ON;')
        return connection

    def initialize(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA_PATH.read_text())
            self._ensure_column(connection, 'users', 'landline', 'TEXT')
            self._ensure_invoice_profiles_table(connection)
            category_count = connection.execute(
                'SELECT COUNT(*) FROM categories'
            ).fetchone()[0]
            if category_count == 0:
                for seed_path in SEED_PATHS:
                    connection.executescript(seed_path.read_text())
            connection.commit()

    def _ensure_column(self, connection: sqlite3.Connection, table_name: str, column_name: str, column_definition: str) -> None:
        existing_columns = {
            row['name']
            for row in connection.execute(f'PRAGMA table_info({table_name})').fetchall()
        }
        if column_name not in existing_columns:
            connection.execute(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}')

    def _ensure_invoice_profiles_table(self, connection: sqlite3.Connection) -> None:
        create_sql = connection.execute(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'invoice_profiles'"
        ).fetchone()
        if create_sql is None:
            return

        sql_text = str(create_sql['sql'] or '')
        if 'user_id INTEGER NOT NULL UNIQUE' not in sql_text:
            return

        connection.executescript(
            '''
            ALTER TABLE invoice_profiles RENAME TO invoice_profiles_legacy;

            CREATE TABLE invoice_profiles (
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

            INSERT INTO invoice_profiles (
                id, user_id, company_name, tax_id, tax_office, profession, line_1, city, postal_code, region, phone, created_at, updated_at
            )
            SELECT
                id, user_id, company_name, tax_id, tax_office, profession, line_1, city, postal_code, region, phone, created_at, updated_at
            FROM invoice_profiles_legacy;

            DROP TABLE invoice_profiles_legacy;
            '''
        )

    def fetch_all(self, query: str, params: tuple = ()) -> list[sqlite3.Row]:
        with self.connect() as connection:
            cursor = connection.execute(query, params)
            return cursor.fetchall()

    def fetch_one(self, query: str, params: tuple = ()) -> sqlite3.Row | None:
        with self.connect() as connection:
            cursor = connection.execute(query, params)
            return cursor.fetchone()

    def execute(self, query: str, params: tuple = ()) -> int:
        with self.connect() as connection:
            cursor = connection.execute(query, params)
            connection.commit()
            return cursor.lastrowid

    def run_transaction(self, callback):
        with self.connect() as connection:
            result = callback(connection)
            connection.commit()
            return result