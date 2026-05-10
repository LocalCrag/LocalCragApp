import uuid

from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.enums.release_note_item_type_enum import ReleaseNoteItemTypeEnum


class ReleaseNoteItem(db.Model):
    __tablename__ = "release_note_items"

    id = db.Column(UUID(), default=lambda: uuid.uuid4(), unique=True, primary_key=True)
    item_key = db.Column(db.String(120), nullable=False, unique=True)
    note_type = db.Column(
        db.Enum(
            ReleaseNoteItemTypeEnum,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="releasenoteitemtypeenum",
            native_enum=False,
        ),
        nullable=False,
    )

    bundle_id = db.Column(
        UUID(), db.ForeignKey("release_note_bundles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    bundle = db.relationship("ReleaseNoteBundle", back_populates="items")
