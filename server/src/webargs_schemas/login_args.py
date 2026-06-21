from marshmallow import validate
from webargs import fields

login_args = {
    "email": fields.Str(required=True, validate=validate.Length(max=120)),
    "password": fields.Str(required=True, validate=validate.Length(max=120)),
}
