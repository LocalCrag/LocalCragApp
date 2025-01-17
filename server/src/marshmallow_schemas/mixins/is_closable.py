from marshmallow import fields


class IsClosableSchemaMixin:
    closed = fields.Boolean()
    closedReason = fields.String(attribute="closed_reason")
