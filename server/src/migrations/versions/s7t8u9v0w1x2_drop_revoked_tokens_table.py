"""Drop revoked_tokens table (JWT blocklist no longer used).

Revision ID: s7t8u9v0w1x2
Revises: r6s7t8u9v0w1
Create Date: 2026-08-25
"""

import sqlalchemy as sa
from alembic import op

revision = "s7t8u9v0w1x2"
down_revision = "r6s7t8u9v0w1"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("revoked_tokens")


def downgrade():
    op.create_table(
        "revoked_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
