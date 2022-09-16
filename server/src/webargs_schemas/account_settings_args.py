from webargs import fields

from error_handling.http_exceptions.bad_request import BadRequest
from messages.messages import ResponseMessage
from webargs_schemas.language_args import language_args

valid_color_schemes = [
    'CLARITY_DARK',
    'CLARITY_BRIGHT'
]


def valid_color_scheme(scheme):
    if scheme not in valid_color_schemes:
        raise BadRequest(ResponseMessage.INVALID_COLOR_SCHEME.value)


account_settings_args = {
    "colorScheme": fields.Str(required=True, validate=valid_color_scheme),
    "avatar": fields.Integer(required=False, allow_none=True),
    "language": fields.Nested(language_args, required=True)
}

user_account_settings_args = {
    "language": fields.Nested(language_args, required=True)
}
