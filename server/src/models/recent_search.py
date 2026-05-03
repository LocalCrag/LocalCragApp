import datetime
import uuid

import pytz
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils import generic_relationship

from extensions import db


class RecentSearch(db.Model):
    __tablename__ = "recent_searches"
    __table_args__ = (UniqueConstraint("user_id", "object_type", "object_id", name="uq_recent_search_user_object"),)

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", lazy="joined")

    object_type = db.Column(db.Unicode(255), nullable=False)
    object_id = db.Column(UUID(), nullable=False)
    object = generic_relationship(object_type, object_id)

    time_created = db.Column(db.DateTime(), default=lambda: datetime.datetime.now(pytz.utc), nullable=False)
