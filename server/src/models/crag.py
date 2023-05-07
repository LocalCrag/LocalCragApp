from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID


class Crag(BaseEntity):
    """
    Model of a climbing crag. Could be e.g. "Glees". Contains one or more sectors.
    """
    __tablename__ = 'crags'

    name = db.Column(db.String(120), nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
    region_id = db.Column(UUID(), db.ForeignKey('regions.id'), nullable=False)
    slug = db.Column(db.String(120), nullable=False)
