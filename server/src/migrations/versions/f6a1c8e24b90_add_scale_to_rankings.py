"""Add scale to rankings

Revision ID: f6a1c8e24b90
Revises: e4b8c1d27a60
Create Date: 2026-11-01

Rankings are derived. Rows that mixed every scale of a line type cannot be
split in place, so they are removed and rebuilt by the next build_rankings run.
"""

import sqlalchemy as sa
from alembic import op

revision = "f6a1c8e24b90"
down_revision = "e4b8c1d27a60"
branch_labels = None
depends_on = None


def _has_column(table_name, column_name):
    columns = sa.inspect(op.get_bind()).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def upgrade():
    # Added earlier with the competition ranks. Databases that already ran that
    # revision before this column existed still need it here.
    if not _has_column("rankings", "scale"):
        op.add_column(
            "rankings",
            sa.Column("scale", sa.String(length=120), nullable=False, server_default=""),
        )
    op.execute("DELETE FROM rankings")
    op.alter_column("rankings", "scale", server_default=None)


def downgrade():
    if _has_column("rankings", "scale"):
        op.drop_column("rankings", "scale")
