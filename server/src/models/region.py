from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.ascent import Ascent
from models.base_entity import BaseEntity
from models.line import Line
from util.secret_spots_auth import get_show_secret


class Region(BaseEntity):
    """
    Model of a climbing region. Could be e.g. "Eifel". Contains one or more crags.
    """
    __tablename__ = 'regions'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)

    @hybrid_property
    def ascent_count(self):
        query = db.session.query(func.count(Ascent.id)).join(Line)
        if not get_show_secret():
            query = query.where(Line.secret.is_(False))
        return query.scalar()

    @classmethod
    def return_it(cls):
        return cls.query.first()
