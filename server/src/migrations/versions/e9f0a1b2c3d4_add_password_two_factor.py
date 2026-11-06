"""password two-factor authentication

Revision ID: e9f0a1b2c3d4
Revises: c8d9e0f1a2b3
Create Date: 2026-11-05 22:20:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "e9f0a1b2c3d4"
down_revision = "c8d9e0f1a2b3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("totp_secret", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("totp_pending_secret", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("totp_last_counter", sa.Integer(), nullable=True))
    op.add_column(
        "users",
        sa.Column("email_two_factor_enabled", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column("users", sa.Column("email_two_factor_setup_hash", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("email_two_factor_setup_expires", sa.DateTime(timezone=True), nullable=True))
    op.create_table(
        "two_factor_challenges",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("email_code_hash", sa.String(length=120), nullable=True),
        sa.Column("email_code_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_two_factor_challenge_user_id", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_two_factor_challenges_user_id", "two_factor_challenges", ["user_id"])
    op.create_index("ix_two_factor_challenges_expires_at", "two_factor_challenges", ["expires_at"])


def downgrade():
    op.drop_index("ix_two_factor_challenges_expires_at", table_name="two_factor_challenges")
    op.drop_index("ix_two_factor_challenges_user_id", table_name="two_factor_challenges")
    op.drop_table("two_factor_challenges")
    op.drop_column("users", "email_two_factor_setup_expires")
    op.drop_column("users", "email_two_factor_setup_hash")
    op.drop_column("users", "email_two_factor_enabled")
    op.drop_column("users", "totp_last_counter")
    op.drop_column("users", "totp_pending_secret")
    op.drop_column("users", "totp_secret")
