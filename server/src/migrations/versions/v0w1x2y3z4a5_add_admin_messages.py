"""Add admin_messages, admin_message notification type, and settings toggle.

Revision ID: v0w1x2y3z4a5
Revises: u9v0w1x2y3z4
Create Date: 2026-09-02
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "v0w1x2y3z4a5"
down_revision = "u9v0w1x2y3z4"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'admin_message'")

    op.create_table(
        "admin_messages",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", UUID(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_admin_messages_created_by_id"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_messages")),
    )

    with op.batch_alter_table("account_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "admin_message_notifications_enabled",
                sa.Boolean(),
                nullable=False,
                server_default="true",
            )
        )


def downgrade():
    with op.batch_alter_table("account_settings", schema=None) as batch_op:
        batch_op.drop_column("admin_message_notifications_enabled")

    op.drop_table("admin_messages")
    # PostgreSQL cannot remove enum values safely; leave admin_message in place.
