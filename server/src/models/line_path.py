from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSON

from models.base_entity import BaseEntity


class LinePath(BaseEntity):
    __tablename__ = "line_paths"

    line_id: Mapped[UUID] = mapped_column(db.ForeignKey("lines.id"), primary_key=True)
    topo_image_id: Mapped[UUID] = mapped_column(db.ForeignKey("topo_images.id"), primary_key=True)
    line: Mapped["Line"] = relationship()
    topo_image: Mapped["TopoImage"] = relationship()
    path = db.Column(JSON, nullable=False)

    @classmethod
    def exists_for_topo_image(cls, topo_image_id, line_id):
        entity = cls.query.filter_by(topo_image_id=topo_image_id, line_id=line_id).first()
        return entity is not None
