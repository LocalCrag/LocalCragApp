from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.base_entity import BaseEntity


class Reaction(BaseEntity):
    """Generic reaction that can be attached to any entity."""

    __tablename__ = "reactions"

    target_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(UUID(), nullable=False)
    emoji = db.Column(db.String(8), nullable=False)

    __table_args__ = (UniqueConstraint("created_by_id", "target_type", "target_id", name="_reaction_user_target_uc"),)
