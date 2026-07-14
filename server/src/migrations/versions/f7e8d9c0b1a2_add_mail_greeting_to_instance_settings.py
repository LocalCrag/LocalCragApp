"""Add mail_greeting to instance_settings

Revision ID: f7e8d9c0b1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-06-21 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "f7e8d9c0b1a2"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("mail_greeting", sa.String(length=120), nullable=False, server_default="Best regards")
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("mail_greeting")
