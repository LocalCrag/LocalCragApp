"""Add stored topo contribution points and the moderator-game switch.

Revision ID: b7e4a1c92d08
Revises: f3a9c2e71b04
Create Date: 2026-10-24

Existing points are credited to the creator of each line, topo image, and spot.
That misses later editors, and it is the closest starting point the current rows allow.
"""

import sqlalchemy as sa
from alembic import op

revision = "b7e4a1c92d08"
down_revision = "f3a9c2e71b04"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("topo_points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column(
        "instance_settings",
        sa.Column("moderator_game_enabled", sa.Boolean(), nullable=False, server_default="false"),
    )
    from util.topo_quality_backfill import backfill_creator_points

    backfill_creator_points(op.get_bind())


def downgrade():
    op.drop_column("instance_settings", "moderator_game_enabled")
    op.drop_column("users", "topo_points")
