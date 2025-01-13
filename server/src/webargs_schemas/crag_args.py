from marshmallow import validate
from webargs import fields

from webargs_schemas.map_marker_args import map_marker_args

crag_args = {
    "name": fields.Str(required=True, validate=validate.Length(max=120)),
    "description": fields.Str(required=True, allow_none=True),
    "shortDescription": fields.Str(required=True, allow_none=True),
    "rules": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True),
    "secret": fields.Boolean(required=True, allow_none=False),
    "mapMarkers": fields.List(fields.Nested(map_marker_args), required=True, allow_none=False),
    "defaultBoulderScale": fields.Str(required=True, allow_none=True),
    "defaultSportScale": fields.Str(required=True, allow_none=True),
    "defaultTradScale": fields.Str(required=True, allow_none=True),
}
