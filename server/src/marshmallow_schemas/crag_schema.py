from marshmallow import fields

from extensions import ma
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class CragSchema(BaseEntitySchema):
    name = fields.String()
    description = fields.String()
    rules = fields.String()


crag_schema = CragSchema()
crags_schema = CragSchema(many=True)
