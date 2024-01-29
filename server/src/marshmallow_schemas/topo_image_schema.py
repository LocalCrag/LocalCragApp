from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class TopoImageSchema(BaseEntitySchema):
    image = fields.Nested(file_schema, attribute='file')


topo_image_schema = TopoImageSchema()
topo_images_schema = TopoImageSchema(many=True)
