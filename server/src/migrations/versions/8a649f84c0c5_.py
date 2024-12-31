"""empty message

Revision ID: 8a649f84c0c5
Revises: eb63587cb28b
Create Date: 2024-12-16 21:55:46.239399

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "8a649f84c0c5"
down_revision = "eb63587cb28b"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE menuitemtypeenum ADD VALUE 'HISTORY'")


def downgrade():
    pass
