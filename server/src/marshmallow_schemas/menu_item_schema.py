from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from marshmallow_schemas.menu_page_schema import menu_page_schema, menu_page_min_schema
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class MenuItemSchema(BaseEntitySchema):
    type = EnumField(MenuItemTypeEnum, by_value=True)
    position = EnumField(MenuItemPositionEnum, by_value=True)
    menuPage = fields.Nested(menu_page_min_schema, attribute='menu_page')
    orderIndex = fields.Int(attribute='order_index')


menu_item_schema = MenuItemSchema()
menu_items_schema = MenuItemSchema(many=True)
