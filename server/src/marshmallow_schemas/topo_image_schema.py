from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from marshmallow_schemas.line_path_schema import line_path_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema, BaseEntityMinSchema


class TopoImageSchema(BaseEntityMinSchema):
    image = fields.Nested(file_schema, attribute='file')
    linePaths = fields.List(fields.Nested(line_path_schema), attribute='line_paths')
    orderIndex = fields.Int(attribute='order_index')
    lat = fields.Float()
    lng = fields.Float()
    description = fields.String()
    title = fields.String()



class TopoImageSchemaForLines(BaseEntityMinSchema):
    image = fields.Nested(file_schema, attribute='file')
    orderIndex = fields.Int(attribute='order_index')
    lat = fields.Float()
    lng = fields.Float()
    description = fields.String()
    title = fields.String()


topo_image_schema = TopoImageSchema()
topo_images_schema = TopoImageSchema(many=True)
