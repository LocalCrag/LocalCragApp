"""Wipe a deployed instance down to the superadmin and load demo data.

Run from the server source directory (``/app/src`` in the server image):

    LOCALCRAG_DEMO_SEED=destroy python ../scripts/seed_demo_instance.py

The script refuses to run unless ``LOCALCRAG_DEMO_SEED`` is ``destroy`` and the
database has exactly one superadmin. It logs that user's email and the
database host before deleting. SMTP settings stay as deployed. Seeded users use
``.invalid`` addresses, which ``send_generic_mail`` does not hand to SMTP.
"""

import logging
import os
import re

from sqlalchemy import text
from sqlalchemy.engine.url import make_url

logger = logging.getLogger(__name__)

CONFIRM_ENV = "LOCALCRAG_DEMO_SEED"
CONFIRM_VALUE = "destroy"
KEEP_TABLES = frozenset({"users", "account_settings", "instance_settings", "scales", "alembic_version"})
_TABLE_NAME = re.compile(r"^[a-z][a-z0-9_]*$")
_FK_COLUMNS = re.compile(r"^FOREIGN KEY \(([^)]+)\)", re.IGNORECASE)


def main():
    if os.environ.get(CONFIRM_ENV) != CONFIRM_VALUE:
        raise SystemExit(
            f"Refusing to run. Set {CONFIRM_ENV}={CONFIRM_VALUE} to wipe this instance and load demo data."
        )
    _run()


def _run():
    from create_migration_dummy_data import (
        MIGRATION_USER_PASSWORD,
        create_migration_dummy_data,
    )

    from app import app
    from extensions import db
    from migrations.util_scripts.add_initial_data import add_initial_data
    from models.user import User

    with app.app_context():
        superadmin = _require_single_superadmin(User)
        _log_target(superadmin.email)
        deleted = _empty_bucket()
        logger.info("Deleted %s storage object(s).", deleted)
        _wipe_content(db, superadmin.id)
        db.session.commit()
        logger.info("Database wiped. Loading demo data.")

    add_initial_data()
    create_migration_dummy_data(demo=True)
    logger.info(
        "Demo data ready. Test users sign in as migration-user-NNN@localcrag.invalid with password %s.",
        MIGRATION_USER_PASSWORD,
    )


def _require_single_superadmin(user_model):
    superadmins = user_model.query.filter_by(superadmin=True).all()
    if len(superadmins) != 1:
        raise SystemExit(f"Expected exactly one superadmin, found {len(superadmins)}.")
    return superadmins[0]


def _log_target(superadmin_email: str):
    from flask import current_app

    url = make_url(current_app.config["SQLALCHEMY_DATABASE_URI"])
    host = url.host or "localhost"
    port = url.port or 5432
    logger.info("Database: %s:%s/%s", host, port, url.database)
    logger.info("Keeping superadmin: %s", superadmin_email)
    logger.info("Deleting every other user, all content, and every object in the bucket.")


def _empty_bucket() -> int:
    from uploader.file_storage import (
        delete_storage_keys,
        object_sizes_in_bucket,
        object_storage_configured,
    )

    if not object_storage_configured():
        raise SystemExit("Object storage is not configured. Refusing to wipe this instance.")
    return delete_storage_keys(object_sizes_in_bucket())


def _wipe_content(db, superadmin_id):
    from models.searchable import Searchable
    from models.user import User

    # TRUNCATE refuses while a kept table, such as users.avatar_id, still references
    # a table being cleared. Null those columns, drop the constraints, then restore them.
    outbound_foreign_keys = _outbound_foreign_keys(db)
    _null_referencing_columns(db, outbound_foreign_keys)
    for foreign_key in outbound_foreign_keys:
        db.session.execute(
            text(f'ALTER TABLE "{foreign_key.table_name}" DROP CONSTRAINT "{foreign_key.constraint_name}"')
        )
    db.session.expire_all()
    tables = _content_tables(db)
    quoted = ", ".join(f'"{name}"' for name in tables)
    db.session.execute(text(f"TRUNCATE {quoted} RESTART IDENTITY"))
    db.session.execute(
        text("DELETE FROM account_settings WHERE user_id <> :user_id"),
        {"user_id": superadmin_id},
    )
    db.session.execute(text("DELETE FROM users WHERE id <> :user_id"), {"user_id": superadmin_id})
    for foreign_key in outbound_foreign_keys:
        db.session.execute(
            text(
                f'ALTER TABLE "{foreign_key.table_name}" '
                f'ADD CONSTRAINT "{foreign_key.constraint_name}" {foreign_key.definition}'
            )
        )
    db.session.expire_all()

    superadmin = User.query.filter_by(id=superadmin_id).one()
    if superadmin.should_be_searchable():
        searchable = Searchable()
        searchable.id = superadmin.id
        searchable.type = superadmin.searchable_type
        searchable.name = superadmin.get_search_name()
        db.session.add(searchable)
        db.session.flush()
    logger.info("Truncated %s tables and removed every user except the superadmin.", len(tables))


def _outbound_foreign_keys(db):
    rows = db.session.execute(
        text(
            """
            SELECT src.relname AS table_name,
                   dst.relname AS referenced_table,
                   con.conname AS constraint_name,
                   pg_get_constraintdef(con.oid) AS definition
            FROM pg_constraint con
            JOIN pg_class src ON src.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = src.relnamespace
            JOIN pg_class dst ON dst.oid = con.confrelid
            WHERE con.contype = 'f' AND ns.nspname = 'public'
            """
        )
    )
    outbound = []
    for row in rows:
        if row.table_name not in KEEP_TABLES or row.referenced_table in KEEP_TABLES:
            continue
        _require_identifier(row.table_name)
        _require_identifier(row.constraint_name)
        if not row.definition.strip().upper().startswith("FOREIGN KEY"):
            raise SystemExit(f"Unexpected foreign key definition {row.definition!r}.")
        outbound.append(row)
    return outbound


def _null_referencing_columns(db, outbound_foreign_keys):
    columns_by_table: dict[str, list[str]] = {}
    for foreign_key in outbound_foreign_keys:
        columns_by_table.setdefault(foreign_key.table_name, []).extend(_foreign_key_columns(foreign_key.definition))
    for table_name, columns in columns_by_table.items():
        assignments = ", ".join(f'"{column}" = NULL' for column in dict.fromkeys(columns))
        db.session.execute(text(f'UPDATE "{table_name}" SET {assignments}'))


def _foreign_key_columns(definition: str) -> list[str]:
    match = _FK_COLUMNS.match(definition.strip())
    if match is None:
        raise SystemExit(f"Unexpected foreign key definition {definition!r}.")
    columns = []
    for part in match.group(1).split(","):
        name = part.strip().strip('"')
        _require_identifier(name)
        columns.append(name)
    return columns


def _require_identifier(name: str):
    if not _TABLE_NAME.match(name):
        raise SystemExit(f"Refusing to touch unexpected identifier {name!r}.")


def _content_tables(db) -> list[str]:
    rows = db.session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"))
    tables = []
    for name in rows.scalars():
        if name in KEEP_TABLES:
            continue
        if not _TABLE_NAME.match(name):
            raise SystemExit(f"Refusing to truncate unexpected table name {name!r}.")
        tables.append(name)
    if not tables:
        raise SystemExit("Found no content tables to truncate.")
    return tables


if __name__ == "__main__":
    main()
