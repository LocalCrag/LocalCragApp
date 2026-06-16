from marshmallow import Schema, fields

from util.scheduled_closure import upcoming_closure_warnings


class UpcomingClosureWarningSchema(Schema):
    startsOn = fields.Date()
    reason = fields.String(allow_none=True)
    startDate = fields.Date(allow_none=True)
    endDate = fields.Date(allow_none=True)
    startMonth = fields.Integer(allow_none=True)
    startDay = fields.Integer(allow_none=True)
    endMonth = fields.Integer(allow_none=True)
    endDay = fields.Integer(allow_none=True)


upcoming_closure_warning_schema = UpcomingClosureWarningSchema(many=True)


class UpcomingClosureWarningsMixin:
    upcomingClosureWarnings = fields.Method("get_upcoming_closure_warnings")

    def get_upcoming_closure_warnings(self, obj):
        return upcoming_closure_warning_schema.dump(upcoming_closure_warnings(obj))
