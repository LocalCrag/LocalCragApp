from marshmallow import fields

from extensions import ma
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class CragSchema(BaseEntitySchema):
    name = fields.String()
    shortDescription = fields.String(attribute='short_description')
    slug = fields.String()


class CragDetailSchema(CragSchema):
    rules = fields.String()
    description = fields.String()


crag_schema = CragDetailSchema()
crags_schema = CragSchema(many=True)
