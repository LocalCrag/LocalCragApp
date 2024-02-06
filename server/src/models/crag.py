from sqlalchemy import func

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.mixins.has_slug import HasSlug


class Crag(HasSlug, BaseEntity):
    """
    Model of a climbing crag. Could be e.g. "Glees". Contains one or more sectors.
    """
    __tablename__ = 'crags'

    slug_blocklist = ['create-crag', 'sectors', 'gallery', 'ascents']
    name = db.Column(db.String(120), nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
    region_id = db.Column(UUID(), db.ForeignKey('regions.id'), nullable=False)
    portrait_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    portrait_image = db.relationship('File', lazy='joined')
    sectors = db.relationship("Sector", cascade="all,delete", backref="crag", lazy="select")
    order_index = db.Column(db.Integer, nullable=False, server_default='0')

    @classmethod
    def find_max_order_index(cls) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).first()

        if not max_order_index:
            return -1

        return max_order_index[0]


