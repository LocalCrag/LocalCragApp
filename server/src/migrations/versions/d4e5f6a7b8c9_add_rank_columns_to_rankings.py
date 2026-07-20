"""Add competition rank columns to rankings

Revision ID: d4e5f6a7b8c9
Revises: c7d8e9f0a1b2
Create Date: 2026-07-18 09:35:00.000000

"""

import sqlalchemy as sa
from alembic import op

from util.build_rankings import assign_competition_ranks

revision = "d4e5f6a7b8c9"
down_revision = "c7d8e9f0a1b2"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("rankings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rank_top_10", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("rank_top_50", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("rank_total_count", sa.Integer(), nullable=True))

    # Must use Alembic's connection — db.session would deadlock waiting on the
    # uncommitted ALTER TABLE lock held by this migration transaction.
    assign_competition_ranks(connection=op.get_bind())


def downgrade():
    with op.batch_alter_table("rankings", schema=None) as batch_op:
        batch_op.drop_column("rank_total_count")
        batch_op.drop_column("rank_top_50")
        batch_op.drop_column("rank_top_10")
