"""Add ROCK_EXPLORER_FEATURE to searchableitemtypeenum.

Revision ID: n2o3p4q5r6s7
Revises: m1n2o3p4q5r6
Create Date: 2026-08-08 16:45:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "n2o3p4q5r6s7"
down_revision = "m1n2o3p4q5r6"
branch_labels = None
depends_on = None


def upgrade():
    # New enum values cannot be used in the same transaction that adds them.
    op.execute("ALTER TYPE searchableitemtypeenum ADD VALUE IF NOT EXISTS 'ROCK_EXPLORER_FEATURE'")


def downgrade():
    # Postgres cannot remove enum values safely; leave ROCK_EXPLORER_FEATURE in place.
    pass
