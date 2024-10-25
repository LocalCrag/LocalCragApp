"""Added gym mode

Revision ID: 1c25754527db
Revises: 04cd54785ed2
Create Date: 2024-10-25 19:55:21.060132

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c25754527db'
down_revision = '04cd54785ed2'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('instance_settings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('gym_mode', sa.Boolean(), server_default='false', nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('instance_settings', schema=None) as batch_op:
        batch_op.drop_column('gym_mode')

    # ### end Alembic commands ###
