"""empty message

Revision ID: 5ab4c99a8ecd
Revises: 538e17ab1cad
Create Date: 2024-04-10 08:38:45.505915

"""
from alembic import op
import sqlalchemy as sa

from util.scripts.add_initial_user_slugs import add_initial_user_slugs

# revision identifiers, used by Alembic.
revision = '5ab4c99a8ecd'
down_revision = '538e17ab1cad'
branch_labels = None
depends_on = None


def upgrade():
    add_initial_user_slugs()


def downgrade():
    pass
