"""empty message

Revision ID: cf79a883dac4
Revises: fcfd87218a90
Create Date: 2024-03-28 08:19:01.031566

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cf79a883dac4'
down_revision = 'fcfd87218a90'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('menu_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('icon', sa.String(length=120), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('menu_items', schema=None) as batch_op:
        batch_op.drop_column('icon')

    # ### end Alembic commands ###