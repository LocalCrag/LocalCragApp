import uuid

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class TopoQualitySnapshot(db.Model):
    """Quality percent of the region or one crag, stored once per week.

    History starts when this table does. Earlier weeks cannot be rebuilt from
    the live rows.
    """

    __tablename__ = "topo_quality_snapshots"
    __table_args__ = (db.UniqueConstraint("week_start", "scope_key", name="uq_topo_quality_snapshots_week_scope"),)

    id = db.Column(UUID(), default=lambda: uuid.uuid4(), primary_key=True)
    week_start = db.Column(db.Date(), nullable=False, index=True)
    scope_key = db.Column(db.String(64), nullable=False)
    name = db.Column(db.String(120), nullable=False, default="")
    percent = db.Column(db.Integer, nullable=False)
    earned = db.Column(db.Integer, nullable=False)
    max_points = db.Column(db.Integer, nullable=False)
    bonus = db.Column(db.Integer, nullable=False)
