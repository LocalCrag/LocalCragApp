from marshmallow import Schema, fields


class ClosureStateSchema(Schema):
    closed = fields.Boolean()
    closedReason = fields.String(attribute="closed_reason")


closure_state_schema = ClosureStateSchema()
