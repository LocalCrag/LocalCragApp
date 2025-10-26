from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.ascent import Ascent
from models.base_entity import BaseEntity
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.line import Line
from models.mixins.has_slug import HasSlug
from models.mixins.is_closable import IsClosable
from models.mixins.is_searchable import IsSearchable
from util.secret_spots_auth import get_show_secret


class Crag(HasSlug, IsSearchable, IsClosable, BaseEntity):
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
    order_index = db.Column(db.Integer, nullable=False, server_default="0")
    rankings = db.relationship("Ranking", cascade="all,delete", lazy="select")
    secret = db.Column(db.Boolean, default=False, server_default="0")
    map_markers = db.relationship("MapMarker", back_populates="crag")
    default_boulder_scale = db.Column(db.String(32), nullable=True)
    default_sport_scale = db.Column(db.String(32), nullable=True)
    default_trad_scale = db.Column(db.String(32), nullable=True)

    @hybrid_property
    def ascent_count(self):
        query = db.session.query(func.count(Ascent.id)).join(Line).where(Ascent.crag_id == self.id)
        if not get_show_secret():
            query = query.where(Line.secret.is_(False))
        return query.scalar()

    @classmethod
    def find_max_order_index(cls) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]
