from flask_marshmallow import Schema
from webargs import fields


class ClosureScheduleArgsSchema(Schema):
    id = fields.UUID(required=False, allow_none=True)
    scheduleType = fields.Str(required=True)
    reason = fields.Str(required=False, allow_none=True, load_default=None)
    startDate = fields.Date(required=False, allow_none=True, load_default=None)
    endDate = fields.Date(required=False, allow_none=True, load_default=None)
    startMonth = fields.Int(required=False, allow_none=True, load_default=None)
    startDay = fields.Int(required=False, allow_none=True, load_default=None)
    endMonth = fields.Int(required=False, allow_none=True, load_default=None)
    endDay = fields.Int(required=False, allow_none=True, load_default=None)


closure_schedule_args = ClosureScheduleArgsSchema()
closure_schedules_field = fields.List(fields.Nested(closure_schedule_args), required=True)
