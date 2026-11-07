"""Create the videos table before file-link cleanup.

Revision ID: d0e5a2c84b17
Revises: e1b7c4a90d32
Create Date: 2026-11-07

The file-link backfill reads every mapped table, including videos. Databases
that already passed this point create the table later, in c9f2a6e18b31, which
also copies the old lines.videos JSON. This revision only creates the empty
table. Downgrade drops it when a later revision has not already done so.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "d0e5a2c84b17"
down_revision = "e1b7c4a90d32"
branch_labels = None
depends_on = None


def upgrade():
    _create_videos_table()


def downgrade():
    if not sa.inspect(op.get_bind()).has_table("videos"):
        return
    op.drop_index("ix_videos_ascent_id", table_name="videos")
    op.drop_index("ix_videos_line_id", table_name="videos")
    op.drop_table("videos")


def _create_videos_table():
    op.create_table(
        "videos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("line_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ascent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=120), server_default="Video", nullable=False),
        sa.Column("source", sa.String(length=20), nullable=True),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("start_seconds", sa.Integer(), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "(line_id IS NOT NULL AND ascent_id IS NULL) OR (line_id IS NULL AND ascent_id IS NOT NULL)",
            name="videos_one_owner",
        ),
        sa.UniqueConstraint(
            "ascent_id",
            name="uq_videos_one_per_ascent",
            deferrable=True,
            initially="DEFERRED",
        ),
        sa.ForeignKeyConstraint(["ascent_id"], ["ascents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["line_id"], ["lines.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_videos_line_id", "videos", ["line_id"])
    op.create_index("ix_videos_ascent_id", "videos", ["ascent_id"])
