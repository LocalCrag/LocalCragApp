"""Add UNEXPLORED to rock explorer potential enum

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-07-26 10:12:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "d2e3f4a5b6c7"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        ALTER TYPE rockexplorerpotentialenum ADD VALUE IF NOT EXISTS 'UNEXPLORED';
        """
    )


def downgrade():
    pass
