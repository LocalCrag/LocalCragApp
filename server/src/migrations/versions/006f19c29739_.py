"""empty message

Revision ID: 006f19c29739
Revises: a33b19f3f3b9
Create Date: 2024-04-21 11:02:31.964962

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006f19c29739'
down_revision = 'a33b19f3f3b9'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('rankings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('crag_id', sa.UUID(), nullable=True),
    sa.Column('sector_id', sa.UUID(), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('top_10', sa.Integer(), nullable=True),
    sa.Column('top_25', sa.Integer(), nullable=True),
    sa.Column('top_10_fa', sa.Integer(), nullable=True),
    sa.Column('total', sa.Integer(), nullable=True),
    sa.Column('total_fa', sa.Integer(), nullable=True),
    sa.Column('type', postgresql.ENUM(name='linetypeenum', create_type=False), nullable=False),
    sa.ForeignKeyConstraint(['crag_id'], ['crags.id'], ),
    sa.ForeignKeyConstraint(['sector_id'], ['sectors.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('rankings')
    # ### end Alembic commands ###
