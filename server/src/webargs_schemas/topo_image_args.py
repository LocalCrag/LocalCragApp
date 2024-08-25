from marshmallow import validate
from webargs import fields

from webargs_schemas.map_marker_args import map_marker_args

topo_image_args = {
    "image": fields.String(required=True, allow_none=False),
    "lat": fields.Float(required=True, allow_none=True, validate=lambda x: abs(x) <= 90),
    "lng": fields.Float(required=True, allow_none=True, validate=lambda x: abs(x) <= 180),
    "description": fields.Str(required=True, allow_none=True),
    "title": fields.Str(required=True, allow_none=True, validate=validate.Length(max=120)),
    "mapMarkers": fields.List(fields.Nested(map_marker_args), required=True, allow_none=False),
}
