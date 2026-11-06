from marshmallow import validate
from webargs import fields

passkey_registration_args = {
    "credential": fields.Dict(required=True),
    "name": fields.Str(required=False, allow_none=True, validate=validate.Length(max=120)),
}

passkey_authentication_args = {
    "credential": fields.Dict(required=True),
}

passkey_rename_args = {
    "name": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
}
