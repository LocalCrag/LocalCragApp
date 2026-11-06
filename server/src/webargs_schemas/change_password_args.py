from marshmallow import validate
from webargs import fields

change_password_args = {
    "oldPassword": fields.Str(required=False, allow_none=True, validate=validate.Length(max=120)),
    "newPassword": fields.Str(required=True, validate=validate.Length(max=120)),
}
