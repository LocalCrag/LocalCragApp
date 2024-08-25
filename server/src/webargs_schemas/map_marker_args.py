from marshmallow import validate
from webargs import fields

from models.enums.map_marker_type_enum import MapMarkerType

map_marker_args = {
    "id": fields.Str(required=False, allow_none=True),
    "name": fields.Str(required=True, allow_none=True, validate=validate.Length(max=120)),
    "lat": fields.Float(required=True, allow_none=False, validate=lambda x: abs(x) <= 90),
    "lng": fields.Float(required=True, allow_none=False, validate=lambda x: abs(x) <= 180),
    "description": fields.Str(required=True, allow_none=True),
    "type": fields.Enum(MapMarkerType, required=True, allow_none=False),
}