from extensions import db
from models.base_entity import BaseEntity
from models.mixins.has_slug import HasSlug


class Region(HasSlug, BaseEntity):
    """
    Model of a climbing region. Could be e.g. "Eifel". Contains one or more crags.
    """
    __tablename__ = 'regions'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
