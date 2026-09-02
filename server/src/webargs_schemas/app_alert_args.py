from marshmallow import validate
from webargs import fields

from models.enums.app_alert_severity_enum import AppAlertSeverityEnum
from util.validators import http_url_validator

app_alert_args = {
    "message": fields.Str(required=True, validate=validate.Length(max=500)),
    "severity": fields.Str(
        required=True,
        validate=validate.OneOf([e.value for e in AppAlertSeverityEnum]),
    ),
    "readMoreUrl": fields.Str(
        required=False,
        allow_none=True,
        load_default=None,
        validate=[validate.Length(max=500), http_url_validator],
    ),
    "startsAt": fields.DateTime(required=True),
    "endsAt": fields.DateTime(required=True),
}
