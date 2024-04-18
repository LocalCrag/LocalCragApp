from marshmallow import validate
from webargs import fields

post_args = {
    "title": fields.Str(required=True, validate=validate.Length(max=120)),
    "text": fields.Str(required=True),
}
