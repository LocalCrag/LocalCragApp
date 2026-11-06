from marshmallow import fields

from extensions import ma


class PasskeySchema(ma.Schema):
    id = fields.String()
    name = fields.String()
    createdAt = fields.DateTime(attribute="created_at")
    lastUsedAt = fields.DateTime(attribute="last_used_at")
    backedUp = fields.Boolean(attribute="backed_up")


passkey_schema = PasskeySchema()
