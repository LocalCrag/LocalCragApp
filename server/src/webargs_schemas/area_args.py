from marshmallow import validate
from webargs import fields

from webargs_schemas.map_marker_args import map_marker_args

area_args = {
    "name": fields.Str(required=True, validate=validate.Length(max=120)),
    "description": fields.Str(required=True, allow_none=True),
    "shortDescription": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True),
    "secret": fields.Boolean(required=True, allow_none=False),
    "archived": fields.Boolean(required=False, allow_none=True),
    "mapMarkers": fields.List(fields.Nested(map_marker_args), required=True, allow_none=False),
}
