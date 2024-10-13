"""empty message

Revision ID: 17271423167a
Revises: ba171c2ccd15
Create Date: 2024-04-09 13:59:40.061818

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '17271423167a'
down_revision = 'ba171c2ccd15'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE menuitemtypeenum ADD VALUE 'ASCENTS'")


def downgrade():
    pass
