from marshmallow import validate
from webargs import fields

reset_password_args = {
    "resetPasswordHash": fields.Str(required=True),
    "newPassword": fields.Str(required=True, validate=validate.Length(max=120)),
}
