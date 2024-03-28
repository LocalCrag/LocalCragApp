from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from marshmallow_schemas.sector_schema import SectorMenuSchema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class CragSchema(BaseEntitySchema):
    name = fields.String()
    orderIndex = fields.Int(attribute='order_index')
    shortDescription = fields.String(attribute='short_description')
    slug = fields.String()
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')


class CragDetailSchema(CragSchema):
    lat = fields.Float()
    lng = fields.Float()
    rules = fields.String()
    description = fields.String()


class CragMenuSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    sectors = fields.List(fields.Nested(SectorMenuSchema()))


crag_schema = CragDetailSchema()
crags_schema = CragSchema(many=True)
crags_menu_schema = CragMenuSchema(many=True)
