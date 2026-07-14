"""Rename main_bg_image_id to bg_image_id on instance_settings

Revision ID: c7d8e9f0a1b2
Revises: a8c4e1f92b3d
Create Date: 2026-07-12 10:05:00.000000

"""

from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c7d8e9f0a1b2"
down_revision = "a8c4e1f92b3d"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.alter_column(
            "main_bg_image_id",
            new_column_name="bg_image_id",
            existing_type=postgresql.UUID(),
            existing_nullable=True,
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.alter_column(
            "bg_image_id",
            new_column_name="main_bg_image_id",
            existing_type=postgresql.UUID(),
            existing_nullable=True,
        )
