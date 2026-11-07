"""Move line videos into their own table.

Revision ID: c9f2a6e18b31
Revises: a7c3e1b94d20
Create Date: 2026-11-06

Existing JSON entries on lines are copied in their original order. An ascent
has at most one video. The JSON column is then removed. Fresh databases already
have the table from d0e5a2c84b17; databases that passed that point before this
branch create it here.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c9f2a6e18b31"
down_revision = "a7c3e1b94d20"
branch_labels = None
depends_on = None

_UUID = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

_COPY_LINE_VIDEOS = sa.text(
    f"""
    INSERT INTO videos (
        id, line_id, ascent_id, order_index, url, title, source, file_id, start_seconds,
        created_by_id, time_created
    )
    SELECT
        gen_random_uuid(),
        lines.id,
        NULL,
        (ordinality - 1)::integer,
        elem->>'url',
        LEFT(COALESCE(NULLIF(elem->>'title', ''), 'Video'), 120),
        NULLIF(elem->>'source', ''),
        CASE
            WHEN elem->>'fileId' ~ '{_UUID}'
             AND EXISTS (SELECT 1 FROM files WHERE files.id = (elem->>'fileId')::uuid)
            THEN (elem->>'fileId')::uuid
            ELSE NULL
        END,
        CASE
            WHEN elem->>'startSeconds' ~ '^[0-9]+$'
             AND (elem->>'startSeconds')::integer > 0
             AND (elem->>'startSeconds')::integer <= 86400
            THEN (elem->>'startSeconds')::integer
            ELSE NULL
        END,
        lines.created_by_id,
        COALESCE(lines.time_updated, lines.time_created, CURRENT_TIMESTAMP)
    FROM lines
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(lines.videos, '[]'::json)::jsonb)
        WITH ORDINALITY AS items(elem, ordinality)
    WHERE jsonb_typeof(COALESCE(lines.videos, '[]'::json)::jsonb) = 'array'
      AND jsonb_typeof(elem) = 'object'
      AND COALESCE(elem->>'url', '') <> ''
    """
)


def upgrade():
    if not sa.inspect(op.get_bind()).has_table("videos"):
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
    op.execute(_COPY_LINE_VIDEOS)
    op.drop_column("lines", "videos")


def downgrade():
    op.add_column("lines", sa.Column("videos", postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.execute(
        sa.text(
            """
            UPDATE lines
            SET videos = (
                SELECT json_agg(
                    json_build_object(
                        'url', videos.url,
                        'title', videos.title,
                        'source', videos.source,
                        'fileId', videos.file_id,
                        'startSeconds', videos.start_seconds
                    )
                    ORDER BY videos.order_index
                )
                FROM videos
                WHERE videos.line_id = lines.id
            )
            """
        )
    )
    op.drop_index("ix_videos_ascent_id", table_name="videos")
    op.drop_index("ix_videos_line_id", table_name="videos")
    op.drop_table("videos")
