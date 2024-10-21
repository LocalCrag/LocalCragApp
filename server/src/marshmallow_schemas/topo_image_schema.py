from marshmallow import fields

from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.file_schema import file_schema
from marshmallow_schemas.line_path_schema import line_path_schema
from marshmallow_schemas.map_marker_schema import map_marker_schema


class TopoImageSchema(BaseEntityMinSchema):
    image = fields.Nested(file_schema, attribute="file")
    linePaths = fields.List(fields.Nested(line_path_schema), attribute="line_paths")
    orderIndex = fields.Int(attribute="order_index")
    description = fields.String()
    title = fields.String()
    mapMarkers = fields.List(fields.Nested(map_marker_schema), attribute="map_markers")
    archived = fields.Boolean()


class TopoImageSchemaForLines(BaseEntityMinSchema):
    image = fields.Nested(file_schema, attribute="file")
    orderIndex = fields.Int(attribute="order_index")
    description = fields.String()
    title = fields.String()
    mapMarkers = fields.List(fields.Nested(map_marker_schema), attribute="map_markers")
    archived = fields.Boolean()


topo_image_schema = TopoImageSchema()
topo_images_schema = TopoImageSchema(many=True)
