"""empty message

Revision ID: c605261e6290
Revises: 0f6f40500708
Create Date: 2024-04-02 17:58:25.096648

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'c605261e6290'
down_revision = '0f6f40500708'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(text("UPDATE users SET moderator = true"))


def downgrade():
    pass
