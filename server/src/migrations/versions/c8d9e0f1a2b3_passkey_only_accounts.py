"""passkey only accounts

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-11-05 21:40:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c8d9e0f1a2b3"
down_revision = "b7c8d9e0f1a2"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("users", "password", existing_type=sa.String(length=120), nullable=True)
    op.add_column("webauthn_challenges", sa.Column("signup_email", sa.String(length=120), nullable=True))
    op.add_column("webauthn_challenges", sa.Column("signup_firstname", sa.String(length=120), nullable=True))
    op.add_column("webauthn_challenges", sa.Column("signup_lastname", sa.String(length=120), nullable=True))
    op.add_column("webauthn_challenges", sa.Column("signup_user_id", postgresql.UUID(), nullable=True))


def downgrade():
    op.drop_column("webauthn_challenges", "signup_user_id")
    op.drop_column("webauthn_challenges", "signup_lastname")
    op.drop_column("webauthn_challenges", "signup_firstname")
    op.drop_column("webauthn_challenges", "signup_email")
    op.alter_column("users", "password", existing_type=sa.String(length=120), nullable=False)
