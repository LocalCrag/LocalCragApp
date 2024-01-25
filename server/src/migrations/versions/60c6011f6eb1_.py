"""empty message

Revision ID: 60c6011f6eb1
Revises: 82ab4143b435
Create Date: 2024-01-23 13:21:09.853627

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '60c6011f6eb1'
down_revision = '82ab4143b435'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('lines', schema=None) as batch_op:
        batch_op.add_column(sa.Column('crimps', sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column('pinches', sa.Boolean(), nullable=False))
        batch_op.drop_column('wall')
        batch_op.drop_column('crimpy')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('lines', schema=None) as batch_op:
        batch_op.add_column(sa.Column('crimpy', sa.BOOLEAN(), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('wall', sa.BOOLEAN(), autoincrement=False, nullable=False))
        batch_op.drop_column('pinches')
        batch_op.drop_column('crimps')

    # ### end Alembic commands ###
