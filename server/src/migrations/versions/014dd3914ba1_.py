"""empty message

Revision ID: 014dd3914ba1
Revises: 2747132e7558
Create Date: 2024-04-11 08:58:21.417781

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "014dd3914ba1"
down_revision = "2747132e7558"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("ascent_count", sa.Integer(), server_default="0", nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("ascent_count")

    # ### end Alembic commands ###
