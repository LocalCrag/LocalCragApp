from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.ascent import Ascent
from models.base_entity import BaseEntity
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.line import Line
from models.mixins.has_slug import HasSlug
from models.mixins.is_searchable import IsSearchable
from util.secret_spots_auth import get_show_secret


class Area(HasSlug, IsSearchable, BaseEntity):
    """
    Model of a sector's area. Could be e.g. "Black Gate". Contains one or more lines.
    """
    __tablename__ = 'areas'

    slug_blocklist = ['edit', 'create-area', 'areas', 'gallery', 'ascents', 'rules']
    searchable_type = SearchableItemTypeEnum.AREA
    name = db.Column(db.String(120), nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    portrait_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    portrait_image = db.relationship('File', lazy='joined')
    sector_id = db.Column(UUID(), db.ForeignKey('sectors.id'), nullable=False)
    lines = db.relationship("Line", cascade="all,delete", backref="area", lazy="select")
    topo_images = db.relationship("TopoImage", cascade="all,delete", backref="area", lazy="select")
    order_index = db.Column(db.Integer, nullable=False, server_default='0')
    secret = db.Column(db.Boolean, default=False, server_default='0')

    sector_slug = association_proxy('sector', 'slug')
    crag_slug = association_proxy('sector', 'crag_slug')
    map_markers = db.relationship('MapMarker', back_populates='area')

    @hybrid_property
    def ascent_count(self):
        query = db.session.query(func.count(Ascent.id)).join(Line).where(Ascent.area_id == self.id)
        if not get_show_secret():
            query = query.where(Line.secret.is_(False))
        return query.scalar()

    @classmethod
    def find_max_order_index(cls, sector_id) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.sector_id == sector_id).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]
