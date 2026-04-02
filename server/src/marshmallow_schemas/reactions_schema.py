from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import UserTinySchema


class ReactionUserListSchema(ma.Schema):
    emoji = fields.String(required=True)
    user = fields.Nested(UserTinySchema, required=True)
