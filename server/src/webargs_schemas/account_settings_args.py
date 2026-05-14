from marshmallow import validate
from webargs import fields

from models.enums.notification_digest_frequency_enum import (
    NotificationDigestFrequencyEnum,
)
from util.validators import validate_language

account_settings_args = {
    "commentReplyMailsEnabled": fields.Boolean(required=True),
    "reactionNotificationsEnabled": fields.Boolean(required=True),
    "systemNotificationsEnabled": fields.Boolean(required=True),
    "notificationDigestFrequency": fields.Str(
        required=True,
        validate=validate.OneOf([member.value for member in NotificationDigestFrequencyEnum]),
    ),
    "language": fields.Str(required=True, validate=validate_language),
}
