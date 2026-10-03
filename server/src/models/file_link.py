import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils import generic_relationship

from extensions import db


class FileLink(db.Model):
    """A file embedded in persisted rich text.

    Foreign keys such as portraits and avatars stay on their own columns.
    Rich text only stores an image URL, so this row is the durable link.
    Cleanup uses it to tell an embedded file from an orphaned file row.
    """

    __tablename__ = "file_links"

    id = db.Column(UUID(), primary_key=True, default=lambda: uuid.uuid4())
    file_id = db.Column(UUID(), db.ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    object_type = db.Column(db.Unicode(255), nullable=False)
    object_id = db.Column(UUID(), nullable=False)
    object = generic_relationship(object_type, object_id)
    field_name = db.Column(db.String(64), nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            "file_id",
            "object_type",
            "object_id",
            "field_name",
            name="uq_file_links_reference",
        ),
        db.Index("ix_file_links_object", "object_type", "object_id"),
    )
