"""Add user privacy settings

Revision ID: c8e1a4b7d2f9
Revises: b4c8e2a91d06
Create Date: 2026-10-07

Existing to-do lists stay private. New accounts default to a public list.
Rankings stay inclusive until a user opts out.
"""

import sqlalchemy as sa
from alembic import op

revision = "c8e1a4b7d2f9"
down_revision = "b4c8e2a91d06"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "account_settings",
        sa.Column("exclude_from_rankings", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Backfill existing rows as private, then switch the default so new rows are public.
    op.add_column(
        "account_settings",
        sa.Column("todo_list_private", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column(
        "account_settings",
        "todo_list_private",
        server_default=sa.false(),
    )


def downgrade():
    op.drop_column("account_settings", "todo_list_private")
    op.drop_column("account_settings", "exclude_from_rankings")
