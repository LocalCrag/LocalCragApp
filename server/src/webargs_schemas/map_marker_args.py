from marshmallow import validate
from webargs import fields

from models.enums.map_marker_type_enum import MapMarkerType


def validate_latitude(value):
    if abs(value) > 90:
        raise validate.ValidationError("Latitude must be between -90 and 90.")


def validate_longitude(value):
    if abs(value) > 180:
        raise validate.ValidationError("Longitude must be between -180 and 180.")


map_marker_args = {
    "id": fields.Str(required=False, allow_none=True),
    "name": fields.Str(required=True, allow_none=True, validate=validate.Length(max=120)),
    "lat": fields.Float(required=True, allow_none=False, validate=validate_latitude),
    "lng": fields.Float(required=True, allow_none=False, validate=validate_longitude),
    "description": fields.Str(required=True, allow_none=True),
    "type": fields.Enum(MapMarkerType, required=True, allow_none=False),
}
