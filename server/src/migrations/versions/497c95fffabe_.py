"""empty message

Revision ID: 497c95fffabe
Revises: 081433dc06d6
Create Date: 2024-04-23 10:28:13.624718

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '497c95fffabe'
down_revision = '081433dc06d6'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE menuitemtypeenum ADD VALUE 'RANKING'")


def downgrade():
    pass
