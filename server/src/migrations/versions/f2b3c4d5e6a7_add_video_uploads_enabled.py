"""Add the instance setting for line video uploads.

Revision ID: f2b3c4d5e6a7
Revises: e9f0a1b2c3d4
Create Date: 2026-11-06
"""

import sqlalchemy as sa
from alembic import op

revision = "f2b3c4d5e6a7"
down_revision = "e9f0a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "instance_settings",
        sa.Column("video_uploads_enabled", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade():
    op.drop_column("instance_settings", "video_uploads_enabled")
