from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class MenuPageSchema(BaseEntitySchema):
    title = fields.String()
    text = fields.String()
    slug = fields.String()


menu_page_schema = MenuPageSchema()
menu_pages_schema = MenuPageSchema(many=True)
