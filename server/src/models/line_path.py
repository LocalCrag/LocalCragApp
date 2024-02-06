from sqlalchemy import func
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
    order_index = db.Column(db.Integer, nullable=False, server_default='0')

    @classmethod
    def exists_for_topo_image(cls, topo_image_id, line_id):
        entity = cls.query.filter_by(topo_image_id=topo_image_id, line_id=line_id).first()
        return entity is not None

    @classmethod
    def find_max_order_index(cls, topo_image_id) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.topo_image_id == topo_image_id).first()

        if not max_order_index:
            return -1

        return max_order_index[0]
