from sqlalchemy import Index, text
from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.base_entity import BaseEntity
from models.enums.permission_effect_enum import (
    PermissionEffectEnum,
    permission_effect_type,
)

SUGGESTION_CREATE = "suggestion.create"


class Permission(BaseEntity):
    """Extensible per-user grant or deny.

    ``resource_type`` and ``resource_id`` are empty for a global permission such as
    ``suggestion.create``. A later permission can target one record, for example
    allowing a single user to view one secret spot.
    """

    __tablename__ = "permissions"
    __table_args__ = (
        Index(
            "uq_permissions_global",
            "user_id",
            "key",
            "effect",
            unique=True,
            postgresql_where=text("resource_type IS NULL AND resource_id IS NULL"),
        ),
        Index(
            "uq_permissions_resource",
            "user_id",
            "key",
            "effect",
            "resource_type",
            "resource_id",
            unique=True,
            postgresql_where=text("resource_type IS NOT NULL AND resource_id IS NOT NULL"),
        ),
    )

    user_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key = db.Column(db.String(120), nullable=False)
    effect = db.Column(permission_effect_type, nullable=False)
    resource_type = db.Column(db.String(64), nullable=True)
    resource_id = db.Column(UUID(), nullable=True)

    user = db.relationship("User", foreign_keys=[user_id])

    @classmethod
    def global_deny(cls, user_id, key):
        return cls.query.filter(
            cls.user_id == user_id,
            cls.key == key,
            cls.effect == PermissionEffectEnum.DENY,
            cls.resource_type.is_(None),
            cls.resource_id.is_(None),
        ).first()
