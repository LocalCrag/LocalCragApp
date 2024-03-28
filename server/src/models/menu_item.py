from sqlalchemy import func, desc
from sqlalchemy.orm import Mapped, mapped_column, relationship

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.mixins.has_slug import HasSlug


class MenuItem(BaseEntity):
    """
    Model of a menu item. Can
    """
    __tablename__ = 'menu_items'

    type = db.Column(db.Enum(MenuItemTypeEnum), nullable=False)
    position = db.Column(db.Enum(MenuItemPositionEnum), nullable=False)
    icon = db.Column(db.String(120), nullable=True)
    order_index = db.Column(db.Integer, nullable=False, server_default='0')
    menu_page_id: Mapped[UUID] = mapped_column(db.ForeignKey("menu_pages.id"), nullable=True)
    menu_page: Mapped["MenuPage"] = relationship()

    @classmethod
    def find_max_order_index_at_position(cls, position) -> int:
        max_order_index = db.session.query(func.max(cls.order_index)).filter(cls.position == position).first()

        if len(max_order_index) == 0 or max_order_index[0] is None:
            return -1

        return max_order_index[0]


