import uuid
from datetime import datetime

import pytz
from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class PasskeyCredential(db.Model):
    """
    A WebAuthn credential a user can sign in with.
    """

    __tablename__ = "passkey_credentials"

    id = db.Column(UUID(), default=lambda: uuid.uuid4(), primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    credential_id = db.Column(db.LargeBinary(), nullable=False, unique=True)
    public_key = db.Column(db.LargeBinary(), nullable=False)
    sign_count = db.Column(db.Integer(), nullable=False, default=0, server_default="0")
    transports = db.Column(db.String(255), nullable=True)
    aaguid = db.Column(db.String(36), nullable=True)
    name = db.Column(db.String(120), nullable=False)
    backed_up = db.Column(db.Boolean(), nullable=False, default=False, server_default="false")
    backup_eligible = db.Column(db.Boolean(), nullable=False, default=False, server_default="false")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(pytz.utc))
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship("User", back_populates="passkeys")
