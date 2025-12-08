from webargs import fields

from util.validators import validate_language

account_settings_args = {
    "commentReplyMailsEnabled": fields.Boolean(required=True),
    "language": fields.Str(required=True, validate=validate_language),
}
