import datetime

import pytz
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from extensions import db


class TabuArea(db.Model):
    """A forbidden-hold polygon on one topo image.

    ``id`` is the string the client already uses, which is not always a UUID.
    Rows copied from the old JSON column are owned by the superadmin. Rows
    created afterwards are owned by the user who added them.
    """

    __tablename__ = "tabu_areas"

    id = db.Column(db.String(64), primary_key=True)
    topo_image_id = db.Column(UUID(), db.ForeignKey("topo_images.id", ondelete="CASCADE"), primary_key=True)
    path = db.Column(JSON, nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    created_by_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="SET NULL"))
    created_by = relationship("User", foreign_keys=[created_by_id])
    time_created = db.Column(db.DateTime, default=lambda: datetime.datetime.now(pytz.utc))
    time_updated = db.Column(db.DateTime, onupdate=lambda: datetime.datetime.now(pytz.utc))
    topo_image = relationship("TopoImage", back_populates="tabu_areas")
