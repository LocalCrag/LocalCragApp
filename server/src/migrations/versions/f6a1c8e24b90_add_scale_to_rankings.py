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


def upgrade():
    with op.batch_alter_table("rankings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("scale", sa.String(length=120), nullable=False, server_default=""))
    op.execute("DELETE FROM rankings")
    with op.batch_alter_table("rankings", schema=None) as batch_op:
        batch_op.alter_column("scale", server_default=None)


def downgrade():
    with op.batch_alter_table("rankings", schema=None) as batch_op:
        batch_op.drop_column("scale")
