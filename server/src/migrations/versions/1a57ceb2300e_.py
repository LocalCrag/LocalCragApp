"""empty message

Revision ID: 1a57ceb2300e
Revises: cda23343448f
Create Date: 2024-02-08 22:45:32.372862

"""
import json

from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.declarative import declarative_base

# revision identifiers, used by Alembic.
revision = '1a57ceb2300e'
down_revision = 'cda23343448f'
branch_labels = None
depends_on = None


Base = declarative_base()


class Line(Base):
    __tablename__ = 'lines'

    id = sa.Column(sa.String, primary_key=True)
    video = sa.Column(sa.String)
    videos = sa.Column(JSON)




def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('lines', schema=None) as batch_op:
        batch_op.add_column(sa.Column('videos', postgresql.JSON(astext_type=sa.Text()), nullable=True))

    # Set initial order IDs
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    lines = session.query(Line).all()
    session.add_all(lines)
    for line in lines:
        if line.video:
            line.videos = [{
                'url': line.video,
                'title': 'Video'
            }]
    session.commit()

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('lines', schema=None) as batch_op:
        batch_op.drop_column('videos')

    # ### end Alembic commands ###
