from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class SectorSchema(BaseEntitySchema):
    name = fields.String()
    slug = fields.String()
    shortDescription = fields.String(attribute='short_description')
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')


class SectorDetailSchema(SectorSchema):
    description = fields.String()


sector_schema = SectorDetailSchema()
sectors_schema = SectorSchema(many=True)