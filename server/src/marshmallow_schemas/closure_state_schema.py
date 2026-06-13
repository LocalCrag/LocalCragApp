from marshmallow import Schema, fields

from marshmallow_schemas.closure_reason_alert_schema import closure_reason_alert_schema
from util.scheduled_closure import effective_closure_reason_alerts


class ClosureStateSchema(Schema):
    closed = fields.Boolean()
    closedReasons = fields.Method("get_closed_reasons")

    def get_closed_reasons(self, obj):
        return closure_reason_alert_schema.dump(effective_closure_reason_alerts(obj))


closure_state_schema = ClosureStateSchema()
