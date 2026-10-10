"""Add assumed grade bounds to lines.

Revision ID: b4c8e2a91d06
Revises: f5c2a8e1b4d7
Create Date: 2026-10-03

Projects can store a lower and upper grade. That interval is what grade
filters use to include hard or easy projects.
"""

import sqlalchemy as sa
from alembic import op

revision = "b4c8e2a91d06"
down_revision = "f5c2a8e1b4d7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("assumed_grade_min", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("assumed_grade_max", sa.Integer(), nullable=True))


def downgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("assumed_grade_max")
        batch_op.drop_column("assumed_grade_min")
