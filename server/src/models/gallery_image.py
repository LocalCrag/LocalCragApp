from sqlalchemy import Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from models.base_entity import BaseEntity
from models.file import File
from models.tag import Tag

gallery_image_tags = Table(
    "gallery_image_tags",
    db.metadata,
    db.Column("tag_id", db.ForeignKey("tags.id")),
    db.Column("gallery_image_id", db.ForeignKey("gallery_images.id")),
)


class GalleryImage(BaseEntity):
    __tablename__ = "gallery_images"

    file_id: Mapped[UUID] = mapped_column(db.ForeignKey("files.id"), primary_key=True)
    file: Mapped[File] = relationship("File")
    tags = db.relationship(Tag, secondary=gallery_image_tags)
