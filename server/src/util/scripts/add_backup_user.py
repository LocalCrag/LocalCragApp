import os
from urllib.parse import urlparse

from sqlalchemy import text

from app import app
from extensions import db


def add_backup_user():
    with app.app_context():
        # Fetch the password from environment variables
        backup_password = os.environ.get("POSTGRES_BACKUP_PASSWORD")
        if not backup_password:
            print("Environment variable POSTGRES_BACKUP_PASSWORD is not set. Skipping backup user creation.")
            return

        # Fetch the database URI and extract the database name
        database_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        if not database_uri:
            print("Environment variable SQLALCHEMY_DATABASE_URI is not set. Skipping backup user creation.")
            return

        parsed_uri = urlparse(database_uri)
        database_name = parsed_uri.path.lstrip("/")
        if not database_name:
            print("Failed to extract database name from SQLALCHEMY_DATABASE_URI. Skipping backup user creation.")
            return

        # Create the backup user with the fetched password
        db.session.execute(
            text(
                f"""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'backup') THEN
                EXECUTE format('CREATE USER backup WITH PASSWORD %L', '{backup_password}');
            END IF;
        END $$;
        """
            )
        )
        db.session.commit()
        print("Backup user created or already exists.")

        # Grant privileges
        db.session.execute(text(f"GRANT CONNECT ON DATABASE {database_name} TO backup;"))
        db.session.execute(text("GRANT USAGE ON SCHEMA public TO backup;"))
        db.session.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup;"))
        db.session.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup;"))
        db.session.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO backup;"))
        db.session.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO backup;"))
        db.session.commit()
        print("Privileges granted to backup user.")


if __name__ == "__main__":
    add_backup_user()
