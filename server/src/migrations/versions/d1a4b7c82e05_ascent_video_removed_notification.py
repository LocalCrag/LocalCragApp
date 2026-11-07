"""Notify the climber when a moderator removes an ascent video.

Revision ID: d1a4b7c82e05
Revises: c9f2a6e18b31
Create Date: 2026-11-07
"""

from alembic import op

revision = "d1a4b7c82e05"
down_revision = "c9f2a6e18b31"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'ascent_video_removed'")


def downgrade():
    pass
