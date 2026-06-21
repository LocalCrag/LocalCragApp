from marshmallow import validate
from webargs import fields

forgot_password_args = {
    "email": fields.Str(required=True, validate=validate.Length(max=120)),
}
