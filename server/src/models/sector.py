from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID


class Sector(BaseEntity):
    """
    Model of a climbing crag's sector. Could be e.g. "Mordor". Contains one or more areas.
    """
    __tablename__ = 'sectors'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    crag_id = db.Column(UUID(), db.ForeignKey('crags.id'), nullable=False)

