from marshmallow import fields

from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from models.closure_schedule import ClosureSchedule


class ClosureScheduleSchema(BaseEntityMinSchema):
    class Meta:
        model = ClosureSchedule

    scheduleType = fields.Function(lambda obj: obj.schedule_type.value)
    reason = fields.String()
    startDate = fields.Date(attribute="start_date")
    endDate = fields.Date(attribute="end_date")
    startMonth = fields.Integer(attribute="start_month")
    startDay = fields.Integer(attribute="start_day")
    endMonth = fields.Integer(attribute="end_month")
    endDay = fields.Integer(attribute="end_day")


closure_schedules_schema = ClosureScheduleSchema(many=True)
