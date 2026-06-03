"""Moderator tasks and notification types.

Revision ID: e8f3a2b1c904
Revises: c9e2a1b0d3f4
Create Date: 2026-05-22

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "e8f3a2b1c904"
down_revision = "c9e2a1b0d3f4"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'moderator_task_completed'")
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'moderator_task_created'")
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'moderator_task_created_and_assigned'")
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'moderator_task_assigned'")

    op.create_table(
        "moderator_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("time_created", sa.DateTime(timezone=True), nullable=True),
        sa.Column("time_updated", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("time_finished", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("object_type", sa.Unicode(length=255), nullable=False),
        sa.Column("object_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["finished_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )

    with op.batch_alter_table("account_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "moderator_task_notifications_enabled",
                sa.Boolean(),
                server_default="true",
                nullable=False,
            )
        )


def downgrade():
    with op.batch_alter_table("account_settings", schema=None) as batch_op:
        batch_op.drop_column("moderator_task_notifications_enabled")

    op.drop_table("moderator_tasks")
