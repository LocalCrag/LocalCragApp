from marshmallow import Schema, fields

from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.file_schema import file_schema
from marshmallow_schemas.line_path_schema import line_path_schema
from marshmallow_schemas.map_marker_schema import map_marker_schema


class TabuAreaSchema(Schema):
    id = fields.String(required=True)
    path = fields.List(fields.Float)


class TopoImageSchema(BaseEntityMinSchema):
    image = fields.Nested(file_schema, attribute="file")
    linePaths = fields.List(fields.Nested(line_path_schema), attribute="line_paths")
    tabuAreas = fields.List(fields.Nested(TabuAreaSchema), attribute="tabu_areas", dump_default=list)
    orderIndex = fields.Int(attribute="order_index")
    description = fields.String()
    title = fields.String()
    mapMarkers = fields.List(fields.Nested(map_marker_schema), attribute="map_markers")
    archived = fields.Boolean()


class TopoImageSchemaForLines(BaseEntityMinSchema):
    image = fields.Nested(file_schema, attribute="file")
    tabuAreas = fields.List(fields.Nested(TabuAreaSchema), attribute="tabu_areas", dump_default=list)
    orderIndex = fields.Int(attribute="order_index")
    description = fields.String()
    title = fields.String()
    mapMarkers = fields.List(fields.Nested(map_marker_schema), attribute="map_markers")
    archived = fields.Boolean()


topo_image_schema = TopoImageSchema()
topo_images_schema = TopoImageSchema(many=True)
