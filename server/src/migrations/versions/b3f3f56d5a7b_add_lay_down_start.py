"""empty message

Revision ID: b3f3f56d5a7b
Revises: 55a7e0a820e3
Create Date: 2025-09-30 21:44:02.095455

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "b3f3f56d5a7b"
down_revision = "55a7e0a820e3"
branch_labels = None
depends_on = None


def upgrade():
    # Add 'LAYDOWN' to the StartingPositionEnum type
    op.execute(
        """
        ALTER TYPE startingpositionenum ADD VALUE IF NOT EXISTS 'LAYDOWN';
    """
    )


def downgrade():
    pass
