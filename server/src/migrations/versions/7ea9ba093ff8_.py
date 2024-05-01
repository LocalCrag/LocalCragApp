"""empty message

Revision ID: 7ea9ba093ff8
Revises: 9c48b5f52c82
Create Date: 2024-04-29 11:53:19.812012

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import declarative_base
from sqlalchemy.util.preloaded import orm

from models.enums.searchable_item_type_enum import SearchableItemTypeEnum

# revision identifiers, used by Alembic.
revision = '7ea9ba093ff8'
down_revision = '9c48b5f52c82'
branch_labels = None
depends_on = None

Base = declarative_base()


class Line(Base):
    __tablename__ = 'lines'

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String)


class Area(Base):
    __tablename__ = 'areas'

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String)


class Sector(Base):
    __tablename__ = 'sectors'

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String)


class Crag(Base):
    __tablename__ = 'crags'

    id = sa.Column(sa.String, primary_key=True)
    name = sa.Column(sa.String)


class User(Base):
    __tablename__ = 'users'

    id = sa.Column(sa.String, primary_key=True)
    firstname = sa.Column(sa.String)
    lastname = sa.Column(sa.String)


class Searchable(Base):
    __tablename__ = 'searchables'

    name = sa.Column(sa.String(120))
    type = sa.Column(sa.Enum(SearchableItemTypeEnum), nullable=False, primary_key=True)
    id = sa.Column(sa.String, primary_key=True)


def upgrade():
    bind = op.get_bind()
    session = orm.Session(bind=bind)

    lines = session.query(Line).all()
    for line in lines:
        searchable = Searchable()
        searchable.name = line.name
        searchable.type = SearchableItemTypeEnum.LINE
        searchable.id = line.id
        session.add(searchable)

    areas = session.query(Area).all()
    for area in areas:
        searchable = Searchable()
        searchable.name = area.name
        searchable.type = SearchableItemTypeEnum.AREA
        searchable.id = area.id
        session.add(searchable)

    sectors = session.query(Sector).all()
    for sector in sectors:
        searchable = Searchable()
        searchable.name = sector.name
        searchable.type = SearchableItemTypeEnum.SECTOR
        searchable.id = sector.id
        session.add(searchable)

    crags = session.query(Crag).all()
    for crag in crags:
        searchable = Searchable()
        searchable.name = crag.name
        searchable.type = SearchableItemTypeEnum.CRAG
        searchable.id = crag.id
        session.add(searchable)

    users = session.query(User).all()
    for user in users:
        searchable = Searchable()
        searchable.name = user.firstname + ' ' + user.lastname
        searchable.type = SearchableItemTypeEnum.USER
        searchable.id = user.id
        session.add(searchable)

    session.commit()


def downgrade():
    pass
