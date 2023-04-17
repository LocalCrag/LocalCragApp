from extensions import db
from models.base_entity import BaseEntity


class Crag(BaseEntity):
    """
    Model of a climbing crag. Could be e.g. "Glees". Contains one or more sectors.
    """
    __tablename__ = 'crags'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
