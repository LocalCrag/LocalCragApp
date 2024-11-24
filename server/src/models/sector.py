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


class Sector(HasSlug, IsSearchable, BaseEntity):
    """
    Model of a climbing crag's sector. Could be e.g. "Mordor". Contains one or more areas.
    """

    __tablename__ = "sectors"
    __versioned__ = {}

    slug_blocklist = ["edit", "create-sector", "sectors", "gallery", "ascents", "rules", "gallery"]
    searchable_type = SearchableItemTypeEnum.SECTOR
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    short_description = db.Column(db.Text, nullable=True)
    crag_id = db.Column(UUID(), db.ForeignKey("crags.id"), nullable=False)
    portrait_image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    portrait_image = db.relationship("File", lazy="joined")
    areas = db.relationship(
        "Area", cascade="all,delete", backref="sector", lazy="select", order_by="Area.order_index.asc()"
    )
    order_index = db.Column(db.Integer, nullable=False, server_default="0")
    rules = db.Column(db.Text, nullable=True)
    rankings = db.relationship("Ranking", cascade="all,delete", lazy="select")
    secret = db.Column(db.Boolean, default=False, server_default="0")
    crag_slug = association_proxy("crag", "slug")
    map_markers = db.relationship("MapMarker", back_populates="sector")

    @hybrid_property
    def ascent_count(self):
        query = db.session.query(func.count(Ascent.id)).join(Line).where(Ascent.sector_id == self.id)
        if not get_show_secret():
            query = query.where(Line.secret.is_(False))
        return query.scalar()

    @classmethod
    def find_max_order_index(cls, crag_id) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.crag_id == crag_id).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]
