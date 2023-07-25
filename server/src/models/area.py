from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.mixins.has_slug import HasSlug


class Area(HasSlug, BaseEntity):
    """
    Model of a sector's area. Could be e.g. "Black Gate". Contains one or more lines.
    """
    __tablename__ = 'areas'

    slug_blocklist = ['edit', 'create-area', 'lines', 'gallery', 'ascents']
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    portrait_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    portrait_image = db.relationship('File', lazy='joined')
    sector_id = db.Column(UUID(), db.ForeignKey('sectors.id'), nullable=False)

