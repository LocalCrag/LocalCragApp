from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import UserMinSchema


class ReactionUserListSchema(ma.Schema):
    emoji = fields.String(required=True)
    user = fields.Nested(UserMinSchema, required=True)
