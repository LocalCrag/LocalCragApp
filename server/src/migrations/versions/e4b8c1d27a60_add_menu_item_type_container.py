"""Add CONTAINER value to menu item type enum.

Revision ID: e4b8c1d27a60
Revises: c3a9e7b15d42
Create Date: 2026-10-31

"""

from alembic import op

revision = "e4b8c1d27a60"
down_revision = "c3a9e7b15d42"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE menuitemtypeenum ADD VALUE 'CONTAINER'")


def downgrade():
    pass
