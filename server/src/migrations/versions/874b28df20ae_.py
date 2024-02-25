"""empty message

Revision ID: 874b28df20ae
Revises: 194d06ba24db
Create Date: 2024-02-25 22:06:22.311650

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '874b28df20ae'
down_revision = '194d06ba24db'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('regions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rules', sa.Text(), nullable=True))

    with op.batch_alter_table('sectors', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rules', sa.Text(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('sectors', schema=None) as batch_op:
        batch_op.drop_column('rules')

    with op.batch_alter_table('regions', schema=None) as batch_op:
        batch_op.drop_column('rules')

    # ### end Alembic commands ###
