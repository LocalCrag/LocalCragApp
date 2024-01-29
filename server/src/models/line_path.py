from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSON

from models.base_entity import BaseEntity


class LinePath(BaseEntity):
    __tablename__ = "line_paths"

    line_id: Mapped[UUID] = mapped_column(db.ForeignKey("lines.id"), primary_key=True)
    topo_image_id: Mapped[UUID] = mapped_column(db.ForeignKey("topo_images.id"), primary_key=True)
    line: Mapped["Line"] = relationship()
    path = db.Column(JSON, nullable=False)
