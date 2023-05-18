"""empty message

Revision ID: ffc01ae8a3f5
Revises: 90792bd238d6
Create Date: 2023-05-18 14:24:56.551441

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ffc01ae8a3f5'
down_revision = '90792bd238d6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('crags', schema=None) as batch_op:
        batch_op.add_column(sa.Column('portrait_image_id', sa.UUID(), nullable=True))
        batch_op.create_foreign_key(None, 'files', ['portrait_image_id'], ['id'])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('crags', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('portrait_image_id')

    # ### end Alembic commands ###
