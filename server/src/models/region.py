from extensions import db
from models.base_entity import BaseEntity


class Region(BaseEntity):
    """
    Model of a climbing region. Could be e.g. "Eifel". Contains one or more crags.
    """
    __tablename__ = 'regions'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
