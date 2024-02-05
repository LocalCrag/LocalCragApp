from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from marshmallow_schemas.line_schema import line_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class LinePathSchema(BaseEntitySchema):
    line = fields.Nested(line_schema, attribute='line')
    path = fields.List(fields.Float)

class LinePathSchemaForLines(BaseEntitySchema):
    path = fields.List(fields.Float)
    topoImage = fields.Nested("TopoImageSchemaForLines", attribute='topo_image')


line_path_schema = LinePathSchema()
line_paths_schema = LinePathSchema(many=True)
