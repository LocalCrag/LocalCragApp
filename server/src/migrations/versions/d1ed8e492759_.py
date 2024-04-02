"""empty message

Revision ID: d1ed8e492759
Revises: 7b47a461ea3b
Create Date: 2024-03-31 16:08:12.280281

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'd1ed8e492759'
down_revision = '7b47a461ea3b'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(text("UPDATE users SET admin = true"))
    conn.execute(text("UPDATE users SET member = true"))


def downgrade():
    pass
