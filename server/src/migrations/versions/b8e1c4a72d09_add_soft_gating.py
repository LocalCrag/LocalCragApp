"""Add the instance setting for soft gating.

Revision ID: b8e1c4a72d09
Revises: d1a4b7c82e05
Create Date: 2026-11-07
"""

import sqlalchemy as sa
from alembic import op

revision = "b8e1c4a72d09"
down_revision = "d1a4b7c82e05"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "instance_settings",
        sa.Column("soft_gating", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade():
    op.drop_column("instance_settings", "soft_gating")
