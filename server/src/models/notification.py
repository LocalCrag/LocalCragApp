import datetime
import uuid

import pytz
from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user = db.relationship("User", foreign_keys=[user_id])

    type = db.Column(
        db.Enum(
            NotificationTypeEnum,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="notificationtypeenum",
        ),
        nullable=False,
        index=True,
    )
    actor_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor = db.relationship("User", foreign_keys=[actor_id], lazy="joined")

    entity_type = db.Column(db.String(50), nullable=True)
    entity_id = db.Column(UUID(), nullable=True)

    time_created = db.Column(db.DateTime(), default=lambda: datetime.datetime.now(pytz.utc), nullable=False)
    delivered_at = db.Column(db.DateTime(), nullable=True)
    dismissed_at = db.Column(db.DateTime(), nullable=True)
