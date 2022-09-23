from webargs import fields

from error_handling.http_exceptions.bad_request import BadRequest
from messages.messages import ResponseMessage
from webargs_schemas.language_args import language_args

valid_color_schemes = [
    'LARA_LIGHT_TEAL',
    'LARA_DARK_TEAL'
]


def valid_color_scheme(scheme):
    if scheme not in valid_color_schemes:
        raise BadRequest(ResponseMessage.INVALID_COLOR_SCHEME.value)


user_args = {
    "firstname": fields.String(required=True),
    "lastname": fields.String(required=True),
    "email": fields.String(required=True),
    "colorScheme": fields.Str(required=True, validate=valid_color_scheme),
    "avatar": fields.Integer(required=False, allow_none=True),
    "language": fields.Str(required=True)}

user_id_args = {
    "id": fields.Integer(required=True)
}

user_contact_data_args = {
    "firstname": fields.String(required=True),
    "lastname": fields.String(required=True),
    "email": fields.String(required=True),
}
