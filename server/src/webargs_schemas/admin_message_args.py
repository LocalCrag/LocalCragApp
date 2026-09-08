from marshmallow import validate
from webargs import fields

admin_message_args = {
    "title": fields.Str(required=True, validate=validate.Length(min=1, max=200)),
    "text": fields.Str(required=True, validate=validate.Length(min=1, max=10000)),
}
