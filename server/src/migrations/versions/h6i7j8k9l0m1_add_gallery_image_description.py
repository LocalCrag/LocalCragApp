"""Add description column to gallery_images

Revision ID: h6i7j8k9l0m1
Revises: g5h6i7j8k9l0
Create Date: 2026-07-27 21:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "h6i7j8k9l0m1"
down_revision = "g5h6i7j8k9l0"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("gallery_images", schema=None) as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table("gallery_images", schema=None) as batch_op:
        batch_op.drop_column("description")
