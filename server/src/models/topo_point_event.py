import datetime
import uuid

import pytz
from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class TopoPointEvent(db.Model):
    """One award of topo points. The ranking is the sum of these rows.

    ``opening_balance`` is the score a user already had before this log
    existed. Those rows stay in the ranking and stay out of the weekly chart
    and the weekly summary, so old points do not show up as a fake first week.
    Restarting the game deletes every row, including these.
    """

    __tablename__ = "topo_point_events"

    id = db.Column(UUID(), default=lambda: uuid.uuid4(), primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    points = db.Column(db.Integer, nullable=False)
    time_created = db.Column(db.DateTime(), default=lambda: datetime.datetime.now(pytz.utc), nullable=False, index=True)
    opening_balance = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
