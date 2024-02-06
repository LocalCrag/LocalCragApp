from sqlalchemy import func

from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.mixins.has_slug import HasSlug


class Sector(HasSlug, BaseEntity):
    """
    Model of a climbing crag's sector. Could be e.g. "Mordor". Contains one or more areas.
    """
    __tablename__ = 'sectors'

    slug_blocklist = ['edit', 'create-sector', 'areas', 'gallery', 'ascents']
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    crag_id = db.Column(UUID(), db.ForeignKey('crags.id'), nullable=False)
    portrait_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    portrait_image = db.relationship('File', lazy='joined')
    areas = db.relationship("Area", cascade="all,delete", backref="sector", lazy="select")
    order_index = db.Column(db.Integer, nullable=False, server_default='0')

    @classmethod
    def find_max_order_index(cls, crag_id) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.crag_id == crag_id).first()

        if not max_order_index:
            return -1

        return max_order_index[0]
