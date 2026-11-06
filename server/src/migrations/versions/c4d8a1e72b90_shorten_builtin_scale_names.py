"""Drop the line type from built-in scale names.

Revision ID: c4d8a1e72b90
Revises: a91c4e7b2d08
Create Date: 2026-11-03

Instances that already stored "Boulder (FB)" and the other type-prefixed
built-in names are renamed. A name an instance already uses for something
else is left alone.
"""

import sqlalchemy as sa
from alembic import op

revision = "c4d8a1e72b90"
down_revision = "a91c4e7b2d08"
branch_labels = None
depends_on = None

_RENAMES = (
    ("BOULDER", "Boulder (FB)", "FB", "default_boulder_scale"),
    ("BOULDER", "Boulder (V)", "V", "default_boulder_scale"),
    ("SPORT", "Sport (UIAA)", "UIAA", "default_sport_scale"),
    ("SPORT", "Sport (French)", "French", "default_sport_scale"),
)


def _rename_scale(connection, line_type: str, old_name: str, new_name: str, default_column: str) -> None:
    existing = connection.execute(
        sa.text("SELECT 1 FROM scales WHERE name = :name AND type = :line_type"),
        {"name": old_name, "line_type": line_type},
    ).first()
    if existing is None:
        return
    taken = connection.execute(
        sa.text("SELECT 1 FROM scales WHERE name = :name AND type = :line_type"),
        {"name": new_name, "line_type": line_type},
    ).first()
    if taken is not None:
        return

    params = {"old_name": old_name, "new_name": new_name, "line_type": line_type}
    connection.execute(
        sa.text("UPDATE lines SET grade_scale = :new_name WHERE grade_scale = :old_name AND type = :line_type"),
        params,
    )
    connection.execute(
        sa.text("UPDATE rankings SET scale = :new_name WHERE scale = :old_name AND type = :line_type"),
        params,
    )
    connection.execute(
        sa.text(
            "UPDATE rock_explorer_features SET grade_scale = :new_name "
            "WHERE grade_scale = :old_name AND grade_line_type = :line_type"
        ),
        params,
    )
    for table in ("crags", "sectors", "areas"):
        connection.execute(
            sa.text(f"UPDATE {table} SET {default_column} = :new_name WHERE {default_column} = :old_name"),
            params,
        )
    connection.execute(
        sa.text("UPDATE scales SET name = :new_name WHERE name = :old_name AND type = :line_type"),
        params,
    )


def upgrade():
    connection = op.get_bind()
    for line_type, old_name, new_name, default_column in _RENAMES:
        _rename_scale(connection, line_type, old_name, new_name, default_column)


def downgrade():
    connection = op.get_bind()
    for line_type, old_name, new_name, default_column in _RENAMES:
        _rename_scale(connection, line_type, new_name, old_name, default_column)
