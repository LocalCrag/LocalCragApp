"""empty message

Revision ID: 626e3b6d3994
Revises: 7a7a88d89055
Create Date: 2024-03-23 12:38:30.743337

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '626e3b6d3994'
down_revision = '7a7a88d89055'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('menu_pages',
    sa.Column('title', sa.String(length=120), nullable=False),
    sa.Column('text', sa.Text(), nullable=True),
    sa.Column('slug', sa.String(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('time_created', sa.DateTime(), nullable=True),
    sa.Column('time_updated', sa.DateTime(), nullable=True),
    sa.Column('created_by_id', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('id'),
    sa.UniqueConstraint('slug')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('menu_pages')
    # ### end Alembic commands ###
