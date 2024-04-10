"""empty message

Revision ID: a326d5fb1d1d
Revises: 5ab4c99a8ecd
Create Date: 2024-04-10 08:41:50.291774

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a326d5fb1d1d'
down_revision = '5ab4c99a8ecd'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('slug',
               existing_type=sa.VARCHAR(),
               nullable=False)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('slug',
               existing_type=sa.VARCHAR(),
               nullable=True)

    # ### end Alembic commands ###
