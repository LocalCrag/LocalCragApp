"""Add app_alerts and app_alert_dismissals tables

Revision ID: u9v0w1x2y3z4
Revises: t8u9v0w1x2y3
Create Date: 2026-09-02
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM, UUID

revision = "u9v0w1x2y3z4"
down_revision = "t8u9v0w1x2y3"
branch_labels = None
depends_on = None


def upgrade():
    # postgresql.ENUM + create_type=False: sa.Enum on create_table still emits CREATE TYPE.
    severity_enum = ENUM("info", "warning", "danger", name="app_alert_severity_enum", create_type=False)
    severity_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "app_alerts",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", UUID(), nullable=True),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("severity", severity_enum, nullable=False),
        sa.Column("read_more_url", sa.String(length=500), nullable=True),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            name=op.f("fk_app_alerts_created_by_id"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_app_alerts")),
    )
    op.create_table(
        "app_alert_dismissals",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("alert_id", UUID(), nullable=False),
        sa.Column("dismissed_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["alert_id"],
            ["app_alerts.id"],
            name=op.f("fk_app_alert_dismissals_alert_id"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_app_alert_dismissals_user_id"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_app_alert_dismissals")),
        sa.UniqueConstraint("user_id", "alert_id", name="uq_app_alert_dismissals_user_alert"),
    )
    with op.batch_alter_table("app_alert_dismissals", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_app_alert_dismissals_alert_id"), ["alert_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_app_alert_dismissals_user_id"), ["user_id"], unique=False)


def downgrade():
    with op.batch_alter_table("app_alert_dismissals", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_app_alert_dismissals_user_id"))
        batch_op.drop_index(batch_op.f("ix_app_alert_dismissals_alert_id"))
    op.drop_table("app_alert_dismissals")
    op.drop_table("app_alerts")
    ENUM(name="app_alert_severity_enum", create_type=False).drop(op.get_bind(), checkfirst=True)
