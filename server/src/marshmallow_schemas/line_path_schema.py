from marshmallow import fields

from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.line_schema import line_schema


class LinePathSchema(BaseEntityMinSchema):
    line = fields.Nested(line_schema, attribute="line", exclude=["linePaths"])
    path = fields.List(fields.Float)
    tabuAreaIds = fields.List(fields.String, attribute="tabu_area_ids", dump_default=list)
    orderIndex = fields.Int(attribute="order_index")


class LinePathSchemaForLines(BaseEntityMinSchema):
    path = fields.List(fields.Float)
    tabuAreaIds = fields.List(fields.String, attribute="tabu_area_ids", dump_default=list)
    topoImage = fields.Nested("TopoImageSchemaForLines", attribute="topo_image")
    orderIndex = fields.Int(attribute="order_index")


line_path_schema = LinePathSchema()
line_paths_schema = LinePathSchema(many=True)
