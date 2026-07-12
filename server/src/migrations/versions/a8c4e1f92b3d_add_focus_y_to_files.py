"""Add focus_y field to files

Revision ID: a8c4e1f92b3d
Revises: f3a8c1d2e4b6
Create Date: 2026-07-12 00:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "a8c4e1f92b3d"
down_revision = "f3a8c1d2e4b6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.add_column(sa.Column("focus_y", sa.Float(), nullable=True))


def downgrade():
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.drop_column("focus_y")
