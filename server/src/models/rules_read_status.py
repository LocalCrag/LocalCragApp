import datetime
import uuid

import pytz
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class RulesReadStatus(db.Model):
    """
    Stores, per user, when the rules of a topo entity (region, crag or sector) were last read.
    """

    __tablename__ = "rules_read_status"
    __table_args__ = (UniqueConstraint("user_id", "entity_type", "entity_id", name="uq_rules_read_status_user_entity"),)

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", lazy="joined")

    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(UUID(), nullable=False)

    read_at = db.Column(db.DateTime(), default=lambda: datetime.datetime.now(pytz.utc), nullable=False)
    acknowledged_rules_updated_at = db.Column(db.DateTime(), nullable=True)
