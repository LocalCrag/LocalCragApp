"""Add lat/lng columns to files for EXIF GPS

Revision ID: i7j8k9l0m1n2
Revises: h6i7j8k9l0m1
Create Date: 2026-07-28 21:20:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "i7j8k9l0m1n2"
down_revision = "h6i7j8k9l0m1"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.add_column(sa.Column("lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("lng", sa.Float(), nullable=True))


def downgrade():
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.drop_column("lng")
        batch_op.drop_column("lat")
