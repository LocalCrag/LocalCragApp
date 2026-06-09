from marshmallow import fields

from marshmallow_schemas.closure_schedule_schema import closure_schedules_schema


class IsClosableSchemaMixin:
    closed = fields.Boolean()
    closedReason = fields.String(attribute="closed_reason")
    closureSchedules = fields.Nested(closure_schedules_schema, attribute="closure_schedules")
