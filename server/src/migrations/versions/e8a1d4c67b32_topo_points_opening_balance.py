"""Move the stored topo score onto an opening-balance event.

Revision ID: e8a1d4c67b32
Revises: c4e9b2a81d17
Create Date: 2026-10-28

The ranking is the sum of topo_point_events. Points earned before the log
existed become one opening_balance row per user. Charts and the weekly
summary ignore those rows, so they do not appear as a week. The copy is the
column minus events already recorded, which keeps a total that already
includes those events from being counted twice.
"""

import sqlalchemy as sa
from alembic import op

revision = "e8a1d4c67b32"
down_revision = "c4e9b2a81d17"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "topo_point_events",
        sa.Column("opening_balance", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.execute(
        """
        INSERT INTO topo_point_events (id, user_id, points, time_created, opening_balance)
        SELECT gen_random_uuid(),
               users.id,
               users.topo_points - COALESCE(sums.points, 0),
               NOW(),
               TRUE
        FROM users
        LEFT JOIN (
            SELECT user_id, SUM(points) AS points
            FROM topo_point_events
            GROUP BY user_id
        ) AS sums ON sums.user_id = users.id
        WHERE users.topo_points - COALESCE(sums.points, 0) > 0
        """
    )
    op.drop_column("users", "topo_points")


def downgrade():
    op.add_column("users", sa.Column("topo_points", sa.Integer(), nullable=False, server_default="0"))
    op.execute(
        """
        UPDATE users
        SET topo_points = COALESCE((
            SELECT SUM(points) FROM topo_point_events WHERE user_id = users.id
        ), 0)
        """
    )
    op.execute("DELETE FROM topo_point_events WHERE opening_balance IS TRUE")
    op.drop_column("topo_point_events", "opening_balance")
