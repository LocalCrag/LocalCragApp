import secrets
from datetime import datetime

import pytz
from sqlalchemy.dialects.postgresql import UUID

from extensions import db

CHALLENGE_KIND_REGISTRATION = "registration"
CHALLENGE_KIND_AUTHENTICATION = "authentication"
CHALLENGE_KIND_SIGNUP = "signup"


class WebAuthnChallenge(db.Model):
    """
    Single-use WebAuthn challenge. The raw challenge bytes are what the authenticator signs.
    """

    __tablename__ = "webauthn_challenges"

    id = db.Column(db.String(64), primary_key=True)
    challenge = db.Column(db.LargeBinary(), nullable=False, unique=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    kind = db.Column(db.String(32), nullable=False)
    signup_email = db.Column(db.String(120), nullable=True)
    signup_firstname = db.Column(db.String(120), nullable=True)
    signup_lastname = db.Column(db.String(120), nullable=True)
    signup_user_id = db.Column(UUID(), nullable=True)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(pytz.utc))

    user = db.relationship("User", back_populates="webauthn_challenges")

    @staticmethod
    def generate_id() -> str:
        return secrets.token_urlsafe(32)
