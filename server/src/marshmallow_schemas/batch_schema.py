from marshmallow import fields

from extensions import ma
from marshmallow_schemas.line_schema import LineSchemaMin
from marshmallow_schemas.topo_image_schema import topo_image_schema


class BatchSchema(ma.SQLAlchemySchema):
    topoImages = fields.List(fields.Nested(topo_image_schema), attribute="topo_images")
    lines = fields.List(fields.Nested(LineSchemaMin), attribute="lines")


batch_schema = BatchSchema()
