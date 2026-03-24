from sqlalchemy import UniqueConstraint
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
    created_by_id = db.Column(UUID(), db.ForeignKey("users.id"), nullable=False)

    ascent_date = db.Column(db.Date(), nullable=False)

    __table_args__ = (UniqueConstraint("created_by_id", "line_id", name="_user_line_uc"),)

    @property
    def area(self):
        return self.line.area if self.line else None

    @property
    def sector(self):
        area = self.area
        return area.sector if area else None

    @property
    def crag(self):
        sector = self.sector
        return sector.crag if sector else None

    @property
    def area_id(self):
        area = self.area
        return area.id if area else None

    @property
    def sector_id(self):
        sector = self.sector
        return sector.id if sector else None

    @property
    def crag_id(self):
        crag = self.crag
        return crag.id if crag else None
