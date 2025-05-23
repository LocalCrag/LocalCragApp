"""empty message

Revision ID: 7a7a88d89055
Revises: a5fadc00eef7
Create Date: 2024-03-14 15:56:46.768929

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7a7a88d89055"
down_revision = "a5fadc00eef7"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("topo_images", schema=None) as batch_op:
        batch_op.add_column(sa.Column("lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("lng", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("title", sa.String(length=120), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("topo_images", schema=None) as batch_op:
        batch_op.drop_column("title")
        batch_op.drop_column("description")
        batch_op.drop_column("lng")
        batch_op.drop_column("lat")

    # ### end Alembic commands ###
