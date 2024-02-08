from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class AreaSchema(BaseEntitySchema):
    name = fields.String()
    slug = fields.String()
    lat = fields.Float()
    lng = fields.Float()
    description = fields.String(attribute='description')
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')
    orderIndex = fields.Int(attribute='order_index') # todo tests


area_schema = AreaSchema()
areas_schema = AreaSchema(many=True)
