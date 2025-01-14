from marshmallow import validate
from webargs import fields

from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum

menu_item_args = {
    "type": fields.Enum(MenuItemTypeEnum, required=True, allow_none=False),
    "position": fields.Enum(MenuItemPositionEnum, required=True, allow_none=False),
    "menuPage": fields.String(required=True, allow_none=True),
    "icon": fields.String(required=True, allow_none=True, validate=validate.Length(max=120)),
    "url": fields.String(required=True, allow_none=True, validate=validate.Length(max=120)),
    "title": fields.String(required=True, allow_none=True, validate=validate.Length(max=120)),
}
