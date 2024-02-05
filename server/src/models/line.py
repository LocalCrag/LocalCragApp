from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.enums.line_type_enum import LineTypeEnum
from models.mixins.has_slug import HasSlug


class Line(HasSlug, BaseEntity):
    """
    Model of a line in a sector. Can be a boulder or route.
    """
    __tablename__ = 'lines'

    slug_blocklist = ['edit', 'create-line', 'gallery', 'ascents']
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    video = db.Column(db.String(120), nullable=True)
    grade_name = db.Column(db.String(120), nullable=False)
    grade_scale = db.Column(db.String(120), nullable=False)
    type = db.Column(db.Enum(LineTypeEnum), nullable=False)
    rating = db.Column(db.Integer, nullable=True)
    area_id = db.Column(UUID(), db.ForeignKey('areas.id'), nullable=False)
    fa_year = db.Column(db.Integer, nullable=True)
    fa_name = db.Column(db.String(120), nullable=True)

    sitstart = db.Column(db.Boolean, nullable=False, default=False)
    eliminate = db.Column(db.Boolean, nullable=False, default=False)
    traverse = db.Column(db.Boolean, nullable=False, default=False)
    highball = db.Column(db.Boolean, nullable=False, default=False)
    no_topout = db.Column(db.Boolean, nullable=False, default=False)

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

    line_paths = db.relationship("LinePath", cascade="all,delete", lazy="select")
