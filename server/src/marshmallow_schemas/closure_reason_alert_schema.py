from marshmallow import Schema, fields


class ClosureReasonAlertSchema(Schema):
    reason = fields.String(allow_none=True)
    startDate = fields.Date(allow_none=True)
    endDate = fields.Date(allow_none=True)
    startMonth = fields.Integer(allow_none=True)
    startDay = fields.Integer(allow_none=True)
    endMonth = fields.Integer(allow_none=True)
    endDay = fields.Integer(allow_none=True)


closure_reason_alert_schema = ClosureReasonAlertSchema(many=True)
