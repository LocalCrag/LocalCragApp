from extensions import db
from models.base_entity import BaseEntity


class Sector(BaseEntity):
    """
    Model of a climbing crag's sector. Could be e.g. "Mordor". Contains one or more areas.
    """
    __tablename__ = 'sectors'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
