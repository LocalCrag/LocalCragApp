import uuid

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class AccountSettings(db.Model):
    __tablename__ = "account_settings"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    user_id = db.Column(
        UUID(), db.ForeignKey("users.id", name="fk_account_settings_user_id"), nullable=False, unique=True
    )
    # Whether the user wants to receive emails when someone replies to their comment
    comment_reply_mails_enabled = db.Column(db.Boolean, nullable=False, default=True, server_default="true")

    user = db.relationship("User", back_populates="account_settings")
