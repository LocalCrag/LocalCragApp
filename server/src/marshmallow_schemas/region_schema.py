from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class RegionSchema(BaseEntitySchema):
    name = fields.String()
    description = fields.String()
    slug = fields.String()
    rules = fields.String()


region_schema = RegionSchema()
