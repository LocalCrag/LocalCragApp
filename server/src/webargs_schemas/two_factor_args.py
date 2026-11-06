from marshmallow import validate
from webargs import fields

two_factor_code_args = {
    "code": fields.Str(required=True, validate=validate.Length(min=6, max=6)),
}

two_factor_login_args = {
    "challengeToken": fields.Str(required=True, validate=validate.Length(max=64)),
    "code": fields.Str(required=True, validate=validate.Length(min=6, max=12)),
}

two_factor_token_args = {
    "challengeToken": fields.Str(required=True, validate=validate.Length(max=64)),
}

two_factor_disable_args = {
    "password": fields.Str(required=False, allow_none=True, validate=validate.Length(max=120)),
}
