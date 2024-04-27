from sqlalchemy import func

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.mixins.has_slug import HasSlug
from models.mixins.is_searchable import IsSearchable


class Crag(HasSlug, IsSearchable, BaseEntity):
    """
    Model of a climbing crag. Could be e.g. "Glees". Contains one or more sectors.
    """
    __tablename__ = 'crags'

    slug_blocklist = ['create-crag', 'edit-region', 'areas', 'gallery', 'ascents', 'rules']
    searchable_type = SearchableItemTypeEnum.CRAG
    name = db.Column(db.String(120), nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
    portrait_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    portrait_image = db.relationship('File', lazy='joined')
    sectors = db.relationship("Sector", cascade="all,delete", backref="crag", lazy="select", order_by='Sector.order_index.asc()')
    order_index = db.Column(db.Integer, nullable=False, server_default='0')
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    ascent_count = db.Column(db.Integer, nullable=False, server_default='0')
    rankings = db.relationship("Ranking", cascade="all,delete", lazy="select")



    @classmethod
    def find_max_order_index(cls) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]


