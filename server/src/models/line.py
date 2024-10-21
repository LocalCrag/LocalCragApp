from sqlalchemy import func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.ascent import Ascent
from models.base_entity import BaseEntity
from models.enums.line_type_enum import LineTypeEnum
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.mixins.has_slug import HasSlug
from models.mixins.is_searchable import IsSearchable


class Line(HasSlug, IsSearchable, BaseEntity):
    """
    Model of a line in a sector. Can be a boulder or route.
    """

    __tablename__ = "lines"

    slug_blocklist = ["edit", "create-line", "gallery", "ascents", "add-topo-image"]
    searchable_type = SearchableItemTypeEnum.LINE
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    videos = db.Column(JSON, nullable=True)
    grade_name = db.Column(db.String(120), nullable=False)
    grade_scale = db.Column(db.String(120), nullable=False)
    # grade_value could be inferred from name and scale, but value is needed for ordering at db level
    grade_value = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Enum(LineTypeEnum), nullable=False)
    rating = db.Column(db.Integer, nullable=True)
    area_id = db.Column(UUID(), db.ForeignKey("areas.id"), nullable=False)
    fa_year = db.Column(db.Integer, nullable=True)
    fa_name = db.Column(db.String(120), nullable=True)
    starting_position = db.Column(db.Enum(StartingPositionEnum), nullable=False)
    archived = db.Column(db.Boolean, nullable=False, default=False, server_default="false")

    eliminate = db.Column(db.Boolean, nullable=False, default=False)
    traverse = db.Column(db.Boolean, nullable=False, default=False)
    highball = db.Column(db.Boolean, nullable=False, default=False)
    lowball = db.Column(db.Boolean, nullable=False, default=False)
    no_topout = db.Column(db.Boolean, nullable=False, default=False)
    morpho = db.Column(db.Boolean, nullable=False, default=False, server_default="0")
    bad_dropzone = db.Column(db.Boolean, nullable=False, default=False)
    child_friendly = db.Column(db.Boolean, nullable=False, default=False)

    roof = db.Column(db.Boolean, nullable=False, default=False)
    slab = db.Column(db.Boolean, nullable=False, default=False)
    vertical = db.Column(db.Boolean, nullable=False, default=False)
    overhang = db.Column(db.Boolean, nullable=False, default=False)

    athletic = db.Column(db.Boolean, nullable=False, default=False)
    technical = db.Column(db.Boolean, nullable=False, default=False)
    endurance = db.Column(db.Boolean, nullable=False, default=False)
    cruxy = db.Column(db.Boolean, nullable=False, default=False)
    dyno = db.Column(db.Boolean, nullable=False, default=False)

    jugs = db.Column(db.Boolean, nullable=False, default=False)
    sloper = db.Column(db.Boolean, nullable=False, default=False)
    crimps = db.Column(db.Boolean, nullable=False, default=False)
    pockets = db.Column(db.Boolean, nullable=False, default=False)
    pinches = db.Column(db.Boolean, nullable=False, default=False)

    crack = db.Column(db.Boolean, nullable=False, default=False)
    dihedral = db.Column(db.Boolean, nullable=False, default=False)
    compression = db.Column(db.Boolean, nullable=False, default=False)
    arete = db.Column(db.Boolean, nullable=False, default=False)
    mantle = db.Column(db.Boolean, nullable=False, default=False)

    line_paths = db.relationship(
        "LinePath", cascade="all,delete", lazy="select", order_by="LinePath.order_index_for_line.asc()"
    )

    ascents = db.relationship("Ascent", cascade="all,delete", lazy="select", overlaps="line")
    secret = db.Column(db.Boolean, default=False, server_default="0")

    area_slug = association_proxy("area", "slug")
    sector_slug = association_proxy("area", "sector_slug")
    crag_slug = association_proxy("area", "crag_slug")

    # Needed for delete cascade
    todos = db.relationship("Todo", cascade="all,delete", lazy="select", overlaps="line")

    @hybrid_property
    def ascent_count(self):
        return db.session.query(func.count(Ascent.id)).where(Ascent.line_id == self.id).scalar()
