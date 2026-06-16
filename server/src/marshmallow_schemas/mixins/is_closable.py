from marshmallow import fields

from marshmallow_schemas.closure_reason_alert_schema import closure_reason_alert_schema
from marshmallow_schemas.closure_schedule_schema import closure_schedules_schema
from marshmallow_schemas.upcoming_closure_warning_schema import (
    UpcomingClosureWarningsMixin,
)
from util.scheduled_closure import effective_closure_reason_alerts


class IsClosableListSchemaMixin:
    closed = fields.Boolean()
    closureIsPermanent = fields.Boolean(attribute="closure_is_permanent")


class IsClosableDetailSchemaMixin(UpcomingClosureWarningsMixin):
    closedReasons = fields.Method("get_closed_reasons")
    closureSchedules = fields.Nested(closure_schedules_schema, attribute="closure_schedules")

    def get_closed_reasons(self, obj):
        return closure_reason_alert_schema.dump(effective_closure_reason_alerts(obj))
