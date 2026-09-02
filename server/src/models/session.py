import secrets
from datetime import datetime, timedelta

import pytz
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import joinedload

from extensions import db


class Session(db.Model):
    """
    Server-side browser session. Cookie holds only the opaque id.
    """

    __tablename__ = "sessions"

    id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    csrf_token = db.Column(db.String(64), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(pytz.utc))

    user = db.relationship("User", foreign_keys=[user_id])

    @staticmethod
    def generate_id() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def generate_csrf_token() -> str:
        return secrets.token_urlsafe(32)

    @classmethod
    def create_for_user(cls, user, lifetime: timedelta) -> "Session":
        session = cls(
            id=cls.generate_id(),
            user_id=user.id,
            csrf_token=cls.generate_csrf_token(),
            expires_at=datetime.now(pytz.utc) + lifetime,
        )
        db.session.add(session)
        db.session.flush()
        return session

    @classmethod
    def find_valid(cls, session_id: str | None) -> "Session | None":
        if not session_id:
            return None
        session = cls.query.options(joinedload(cls.user)).filter_by(id=session_id).first()
        if not session:
            return None
        if session.expires_at < datetime.now(pytz.utc):
            db.session.delete(session)
            db.session.flush()
            return None
        return session

    def delete(self):
        db.session.delete(self)
        db.session.flush()
