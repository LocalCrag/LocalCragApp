from marshmallow import validate
from webargs import fields

region_args = {
    "name": fields.Str(required=True, validate=validate.Length(max=120)),
    "description": fields.Str(required=True, allow_none=True),
    "rules": fields.Str(required=True, allow_none=True),
    "image": fields.String(required=True, allow_none=True),
}
