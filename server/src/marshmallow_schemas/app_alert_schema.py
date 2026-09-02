from marshmallow import fields
from marshmallow_enum import EnumField

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from models.enums.app_alert_severity_enum import AppAlertSeverityEnum


class AppAlertSchema(BaseEntitySchema):
    message = fields.String()
    severity = EnumField(AppAlertSeverityEnum, by_value=True)
    readMoreUrl = fields.String(attribute="read_more_url", allow_none=True)
    startsAt = fields.DateTime(attribute="starts_at")
    endsAt = fields.DateTime(attribute="ends_at")


app_alert_schema = AppAlertSchema()
app_alerts_schema = AppAlertSchema(many=True)
