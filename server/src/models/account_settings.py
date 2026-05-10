import uuid

from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.enums.notification_digest_frequency_enum import (
    NotificationDigestFrequencyEnum,
)


class AccountSettings(db.Model):
    __tablename__ = "account_settings"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    user_id = db.Column(
        UUID(), db.ForeignKey("users.id", name="fk_account_settings_user_id"), nullable=False, unique=True
    )
    # Whether the user wants to receive emails when someone replies to their comment
    comment_reply_mails_enabled = db.Column(db.Boolean, nullable=False, default=True, server_default="true")
    # Whether reactions on own content should create notifications
    reaction_notifications_enabled = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    # Whether system notifications should create notifications (e.g. moderator FA removals)
    system_notifications_enabled = db.Column(db.Boolean, nullable=False, default=True, server_default="true")
    # Notifications for bundled release notes
    release_notes_notifications_enabled = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    # Digest schedule for email delivery ("daily", "weekly")
    notification_digest_frequency = db.Column(
        db.Enum(
            NotificationDigestFrequencyEnum,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="notificationdigestfrequencyenum",
        ),
        nullable=False,
        default=NotificationDigestFrequencyEnum.DAILY,
        server_default=NotificationDigestFrequencyEnum.DAILY.value,
    )
    # Preferred language for the account
    language = db.Column(db.String(10), nullable=False, default="en", server_default="en")
    user = db.relationship("User", back_populates="account_settings")
