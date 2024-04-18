from marshmallow import validate
from webargs import fields

sector_args = {
    "name": fields.Str(required=True, validate=validate.Length(max=120)),
    "description": fields.Str(required=True, allow_none=True),
    "shortDescription": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True),
    "lat": fields.Float(required=True, allow_none=True, validate=lambda x: abs(x) <= 90),
    "lng": fields.Float(required=True, allow_none=True, validate=lambda x: abs(x) <= 180),
    "rules": fields.Str(required=True, allow_none=True),
}
