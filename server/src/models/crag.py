from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
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
from models.sector import Sector
from util.entity_count_cache import get_cached_ascent_count, get_cached_line_count
from util.secret_service import SecretService
from util.topo_tab_counts import count_gallery_images, count_root_comments


class Crag(HasSlug, HasOrderIndex, IsSearchable, IsClosable, IsSecret, BaseEntity):
    """
    Model of a climbing crag. Could be e.g. "Glees". Contains one or more sectors.
    """

    __tablename__ = "crags"

    searchable_type = SearchableItemTypeEnum.CRAG
    name = db.Column(db.String(120), nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
    portrait_image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    portrait_image = db.relationship("File", lazy="joined")
    sectors = db.relationship(
        "Sector", cascade="all,delete", backref="crag", lazy="select", order_by="Sector.order_index.asc()"
    )
    rankings = db.relationship("Ranking", cascade="all,delete", lazy="select")
    map_markers = db.relationship("MapMarker", back_populates="crag")
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
            db.session.query(func.count(Line.id))
            .join(Area, Line.area_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .where(Sector.crag_id == self.id)
        )
        query = SecretService.apply_line_filter(query)
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
            .join(Sector, Area.sector_id == Sector.id)
            .where(Sector.crag_id == self.id)
        )
        query = SecretService.apply_line_filter(query)
        return query.scalar()

    @hybrid_property
    def comment_count(self):
        return count_root_comments("Crag", self.id)

    @hybrid_property
    def image_count(self):
        return count_gallery_images("Crag", self.id)

    @classmethod
    def find_max_order_index(cls) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]
