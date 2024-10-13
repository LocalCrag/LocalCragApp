from marshmallow import fields
from marshmallow_enum import EnumField

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from models.enums.map_marker_type_enum import MapMarkerType


class MapMarkerSchema(BaseEntitySchema):
    name = fields.String()
    lat = fields.Float()
    lng = fields.Float()
    type = EnumField(MapMarkerType, by_value=True)
    description = fields.String()


map_marker_schema = MapMarkerSchema()
