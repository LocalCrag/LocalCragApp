from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.base_entity import BaseEntity
from models.enums.closure_schedule_type_enum import ClosureScheduleTypeEnum


class ClosureSchedule(BaseEntity):
    """A single closure window attached to one closable topo entity."""

    __tablename__ = "closure_schedules"

    schedule_type = db.Column(db.Enum(ClosureScheduleTypeEnum), nullable=False)
    reason = db.Column(db.Text, nullable=True)

    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    start_month = db.Column(db.SmallInteger, nullable=True)
    start_day = db.Column(db.SmallInteger, nullable=True)
    end_month = db.Column(db.SmallInteger, nullable=True)
    end_day = db.Column(db.SmallInteger, nullable=True)

    crag_id = db.Column(UUID(), db.ForeignKey("crags.id", ondelete="CASCADE"), nullable=True)
    sector_id = db.Column(UUID(), db.ForeignKey("sectors.id", ondelete="CASCADE"), nullable=True)
    area_id = db.Column(UUID(), db.ForeignKey("areas.id", ondelete="CASCADE"), nullable=True)
    line_id = db.Column(UUID(), db.ForeignKey("lines.id", ondelete="CASCADE"), nullable=True)

    crag = db.relationship(
        "Crag",
        backref=db.backref("closure_schedules", lazy="select", cascade="all, delete-orphan"),
    )
    sector = db.relationship(
        "Sector",
        backref=db.backref("closure_schedules", lazy="select", cascade="all, delete-orphan"),
    )
    area = db.relationship(
        "Area",
        backref=db.backref("closure_schedules", lazy="select", cascade="all, delete-orphan"),
    )
    line = db.relationship(
        "Line",
        backref=db.backref("closure_schedules", lazy="select", cascade="all, delete-orphan"),
    )
