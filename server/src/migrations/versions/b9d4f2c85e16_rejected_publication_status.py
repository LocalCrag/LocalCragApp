"""Add rejected publication status.

Revision ID: b9d4f2c85e16
Revises: a8c3e1b74d05
Create Date: 2026-10-21

"""

from alembic import op

revision = "b9d4f2c85e16"
down_revision = "a8c3e1b74d05"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE publicationstatusenum ADD VALUE IF NOT EXISTS 'rejected'")


def downgrade():
    pass
