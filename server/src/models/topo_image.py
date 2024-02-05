from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from sqlalchemy.dialects.postgresql import UUID

from models.base_entity import BaseEntity


class TopoImage(BaseEntity):
    __tablename__ = "topo_images"

    area_id: Mapped[UUID] = mapped_column(db.ForeignKey("areas.id"), primary_key=True)
    file_id: Mapped[UUID] = mapped_column(db.ForeignKey("files.id"), primary_key=True)
    file: Mapped["File"] = relationship()
    line_paths = db.relationship("LinePath", cascade="all,delete", lazy="select")

