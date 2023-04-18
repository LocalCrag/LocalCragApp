from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID


class Area(BaseEntity):
    """
    Model of a sector's area. Could be e.g. "Black Gate". Contains one or more lines.
    """
    __tablename__ = 'areas'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    crag_id = db.Column(UUID(), db.ForeignKey('crags.id'), nullable=False)

