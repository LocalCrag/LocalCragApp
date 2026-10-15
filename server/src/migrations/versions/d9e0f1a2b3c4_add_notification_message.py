"""Add an optional plain-text message to notifications.

Revision ID: d9e0f1a2b3c4
Revises: c8e1a4b7d2f9
Create Date: 2026-10-14

FA removal notes are stored on the notification itself. One language, no markup.
"""

import sqlalchemy as sa
from alembic import op

revision = "d9e0f1a2b3c4"
down_revision = "c8e1a4b7d2f9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("notifications", sa.Column("message", sa.String(length=2000), nullable=True))


def downgrade():
    op.drop_column("notifications", "message")
