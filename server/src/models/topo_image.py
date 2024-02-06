from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from sqlalchemy.dialects.postgresql import UUID

from models.base_entity import BaseEntity


class TopoImage(BaseEntity):
    __tablename__ = "topo_images"

    area_id: Mapped[UUID] = mapped_column(db.ForeignKey("areas.id"), primary_key=True)
    file_id: Mapped[UUID] = mapped_column(db.ForeignKey("files.id"), primary_key=True)
    file: Mapped["File"] = relationship()
    line_paths = db.relationship("LinePath", cascade="all,delete", lazy="select", order_by='LinePath.order_index.asc()')
    order_index = db.Column(db.Integer, nullable=False, server_default='0')

    @classmethod
    def find_max_order_index(cls, area_id) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.area_id == area_id).first()

        if not max_order_index:
            return -1

        return max_order_index[0]


