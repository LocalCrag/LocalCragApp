"""Add variant flag to lines.

Revision ID: f7a1c3e9b2d4
Revises: e1f2a3b4c5d6
Create Date: 2026-10-18

"""

import sqlalchemy as sa
from alembic import op

revision = "f7a1c3e9b2d4"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("variant", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("variant")
