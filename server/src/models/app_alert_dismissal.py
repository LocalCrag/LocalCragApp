import datetime
import uuid

import pytz
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class AppAlertDismissal(db.Model):
    """
    Stores, per user, when an app-level alert was dismissed.
    """

    __tablename__ = "app_alert_dismissals"
    __table_args__ = (UniqueConstraint("user_id", "alert_id", name="uq_app_alert_dismissals_user_alert"),)

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", lazy="joined")
    alert_id = db.Column(UUID(), db.ForeignKey("app_alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    alert = db.relationship("AppAlert", lazy="joined")
    dismissed_at = db.Column(db.DateTime(), default=lambda: datetime.datetime.now(pytz.utc), nullable=False)
