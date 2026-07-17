from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.base_entity import BaseEntity
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.line import Line
from models.mixins.has_order_index import HasOrderIndex
from models.mixins.has_slug import HasSlug
from models.mixins.is_closable import IsClosable
from models.mixins.is_searchable import IsSearchable
from models.mixins.is_secret import IsSecret
from util.entity_count_cache import get_cached_ascent_count, get_cached_line_count
from util.secret_service import SecretService
from util.topo_tab_counts import count_gallery_images, count_root_comments


class Sector(HasSlug, HasOrderIndex, IsSearchable, IsClosable, IsSecret, BaseEntity):
    """
    Model of a climbing crag's sector. Could be e.g. "Mordor". Contains one or more areas.
    """

    __tablename__ = "sectors"

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
    rules = db.Column(db.Text, nullable=True)
    rankings = db.relationship("Ranking", cascade="all,delete", lazy="select")
    crag_slug = association_proxy("crag", "slug")
    map_markers = db.relationship("MapMarker", back_populates="sector")
    default_boulder_scale = db.Column(db.String(32), nullable=True)
    default_sport_scale = db.Column(db.String(32), nullable=True)
    default_trad_scale = db.Column(db.String(32), nullable=True)
    blocweather_url = db.Column(db.String(255), nullable=True)

    @hybrid_property
    def line_count(self):
        cached = get_cached_line_count(self)
        if cached is not None:
            return cached
        query = (
            db.session.query(func.count(Line.id)).join(Area, Line.area_id == Area.id).where(Area.sector_id == self.id)
        )
        query = SecretService.apply_line_filter(query)
        return query.scalar()

    @hybrid_property
    def area_count(self):
        query = db.session.query(func.count(Area.id)).where(Area.sector_id == self.id)
        query = SecretService.apply_topo_entity_filter(query, Area)
        return query.scalar()

    @hybrid_property
    def ascent_count(self):
        cached = get_cached_ascent_count(self)
        if cached is not None:
            return cached
        query = (
            db.session.query(func.count(Ascent.id))
            .join(Line)
            .join(Area, Line.area_id == Area.id)
            .where(Area.sector_id == self.id)
        )
        query = SecretService.apply_line_filter(query)
        return query.scalar()

    @hybrid_property
    def comment_count(self):
        return count_root_comments("Sector", self.id)

    @hybrid_property
    def image_count(self):
        return count_gallery_images("Sector", self.id)

    @hybrid_property
    def task_count(self):
        from util.moderator_task_scope import count_open_moderator_tasks

        return count_open_moderator_tasks("Sector", self.id)

    @classmethod
    def find_max_order_index(cls, crag_id) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.crag_id == crag_id).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]
