"""Add bolter and bolt_date to lines

Revision ID: a2b3c4d5e6f7
Revises: e7f8a9b0c1d2
Create Date: 2026-07-23 16:40:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a2b3c4d5e6f7"
down_revision = "e7f8a9b0c1d2"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("bolter", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("bolt_date", sa.Date(), nullable=True))


def downgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("bolt_date")
        batch_op.drop_column("bolter")
