"""One default scale per line type.

Revision ID: e7b3a9c14d20
Revises: d5e9b2c83a01
Create Date: 2026-11-04

Marks FB, French, and British as the defaults and drops the per-crag,
per-sector, and per-area default scale columns.
"""

import sqlalchemy as sa
from alembic import op

revision = "e7b3a9c14d20"
down_revision = "d5e9b2c83a01"
branch_labels = None
depends_on = None

_DEFAULTS = (
    ("BOULDER", "FB"),
    ("SPORT", "French"),
    ("TRAD", "British"),
)
_TABLES = ("crags", "sectors", "areas")
_COLUMNS = ("default_boulder_scale", "default_sport_scale", "default_trad_scale")


def upgrade():
    op.add_column("scales", sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()))
    connection = op.get_bind()
    for line_type, name in _DEFAULTS:
        connection.execute(
            sa.text("UPDATE scales SET is_default = true WHERE type = :line_type AND name = :name"),
            {"line_type": line_type, "name": name},
        )
    op.create_index(
        "uq_scales_one_default_per_type",
        "scales",
        ["type"],
        unique=True,
        postgresql_where=sa.text("is_default"),
    )
    for table in _TABLES:
        for column in _COLUMNS:
            op.drop_column(table, column)


def downgrade():
    for table in _TABLES:
        for column in _COLUMNS:
            op.add_column(table, sa.Column(column, sa.String(length=32), nullable=True))
    op.drop_index("uq_scales_one_default_per_type", table_name="scales")
    op.drop_column("scales", "is_default")
