import secrets
from datetime import datetime

import pytz
from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class TwoFactorChallenge(db.Model):
    """
    Single-use challenge issued after a correct password when two-factor authentication is on.
    The client receives the id. Email codes are stored only as a salted hash.
    """

    __tablename__ = "two_factor_challenges"

    id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email_code_hash = db.Column(db.String(120), nullable=True)
    email_code_expires_at = db.Column(db.DateTime(timezone=True), nullable=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    attempts = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(pytz.utc))

    user = db.relationship("User", back_populates="two_factor_challenges")

    @staticmethod
    def generate_id() -> str:
        return secrets.token_urlsafe(32)
