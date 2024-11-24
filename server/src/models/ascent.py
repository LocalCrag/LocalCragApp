from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.base_entity import BaseEntity


class Ascent(BaseEntity):
    __tablename__ = "ascents"

    line_id = db.Column(UUID(), db.ForeignKey("lines.id"), nullable=False)
    line = db.relationship("Line", lazy="joined")
    flash = db.Column(db.Boolean, nullable=False, default=False)
    with_kneepad = db.Column(db.Boolean, nullable=False, default=False)
    fa = db.Column(db.Boolean, nullable=False, default=False)
    soft = db.Column(db.Boolean, nullable=False, default=False)
    hard = db.Column(db.Boolean, nullable=False, default=False)
    grade_value = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Integer, nullable=True)
    comment = db.Column(db.Text, nullable=True)
    year = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date(), nullable=True)
    crag_id = db.Column(UUID(), db.ForeignKey("crags.id"), nullable=False)
    crag = db.relationship("Crag", lazy="joined")
    sector_id = db.Column(UUID(), db.ForeignKey("sectors.id"), nullable=False)
    sector = db.relationship("Sector", lazy="joined")
    area_id = db.Column(UUID(), db.ForeignKey("areas.id"), nullable=False)
    area = db.relationship("Area", lazy="joined")
    created_by_id = db.Column(UUID(), db.ForeignKey("users.id"), nullable=False)

    ascent_date = db.Column(db.Date(), nullable=False)
