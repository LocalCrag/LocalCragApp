from sqlalchemy import text

from app import app
from extensions import db


def add_postgres_extensions():
    with app.app_context():
        db.session.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        print('Added uuid-ossp extension to database.')


if __name__ == "__main__":
    add_postgres_extensions()
