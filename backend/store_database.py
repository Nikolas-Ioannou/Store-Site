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
            category_count = connection.execute(
                'SELECT COUNT(*) FROM categories'
            ).fetchone()[0]
            if category_count == 0:
                for seed_path in SEED_PATHS:
                    connection.executescript(seed_path.read_text())
            connection.commit()

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