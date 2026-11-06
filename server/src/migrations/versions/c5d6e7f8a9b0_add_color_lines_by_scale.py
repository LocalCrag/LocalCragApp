"""Add color_lines_by_scale to instance_settings.

Revision ID: c5d6e7f8a9b0
Revises: e7b3a9c14d20
Create Date: 2026-11-05
"""

import sqlalchemy as sa
from alembic import op

revision = "c5d6e7f8a9b0"
down_revision = "e7b3a9c14d20"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "color_lines_by_scale",
                sa.Boolean(),
                server_default="false",
                nullable=False,
            )
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("color_lines_by_scale")
