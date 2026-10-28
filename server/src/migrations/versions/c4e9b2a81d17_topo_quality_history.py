"""Store weekly topo quality and the points behind the moderator summary.

Revision ID: c4e9b2a81d17
Revises: b7e4a1c92d08
Create Date: 2026-10-28
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "c4e9b2a81d17"
down_revision = "b7e4a1c92d08"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'topo_points_weekly'")
    op.create_table(
        "topo_point_events",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_topo_point_events_user_id"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topo_point_events")),
    )
    op.create_index("ix_topo_point_events_user_id", "topo_point_events", ["user_id"])
    op.create_index("ix_topo_point_events_time_created", "topo_point_events", ["time_created"])
    op.create_table(
        "topo_quality_snapshots",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("scope_key", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("percent", sa.Integer(), nullable=False),
        sa.Column("earned", sa.Integer(), nullable=False),
        sa.Column("max_points", sa.Integer(), nullable=False),
        sa.Column("bonus", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_topo_quality_snapshots")),
        sa.UniqueConstraint("week_start", "scope_key", name="uq_topo_quality_snapshots_week_scope"),
    )
    op.create_index("ix_topo_quality_snapshots_week_start", "topo_quality_snapshots", ["week_start"])
    op.create_table(
        "topo_week_summaries",
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("notified_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("week_start", name=op.f("pk_topo_week_summaries")),
    )


def downgrade():
    op.drop_table("topo_week_summaries")
    op.drop_index("ix_topo_quality_snapshots_week_start", table_name="topo_quality_snapshots")
    op.drop_table("topo_quality_snapshots")
    op.drop_index("ix_topo_point_events_time_created", table_name="topo_point_events")
    op.drop_index("ix_topo_point_events_user_id", table_name="topo_point_events")
    op.drop_table("topo_point_events")
    # PostgreSQL cannot remove enum values safely; leave topo_points_weekly in place.
