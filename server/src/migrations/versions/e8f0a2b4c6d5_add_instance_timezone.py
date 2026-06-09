"""Add instance timezone for closure schedule day boundaries.

Revision ID: e8f0a2b4c6d5
Revises: d6e8f0a2b4c3
Create Date: 2026-06-04

"""

import sqlalchemy as sa
from alembic import op

revision = "e8f0a2b4c6d5"
down_revision = "d6e8f0a2b4c3"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("timezone", sa.String(length=64), nullable=True))

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE instance_settings
            SET timezone = CASE language
                WHEN 'de' THEN 'Europe/Berlin'
                WHEN 'en' THEN 'Europe/London'
                WHEN 'it' THEN 'Europe/Rome'
                WHEN 'nl' THEN 'Europe/Amsterdam'
                ELSE 'Europe/London'
            END
            """
        )
    )

    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.alter_column("timezone", nullable=False, server_default="UTC")


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("timezone")
