"""Add drying to lines

Revision ID: e7f8a9b0c1d2
Revises: d4e5f6a7b8c9
Create Date: 2026-07-23 13:40:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e7f8a9b0c1d2"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade():
    dryingenum = sa.Enum("FAST", "SLOW", name="dryingenum")
    dryingenum.create(op.get_bind(), checkfirst=True)

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("drying", dryingenum, nullable=True))


def downgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("drying")

    sa.Enum(name="dryingenum").drop(op.get_bind(), checkfirst=True)
