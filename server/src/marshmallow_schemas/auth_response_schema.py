from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import UserSchema


class AuthResponseSchema(ma.Schema):
    message = fields.String()
    user = ma.Nested(UserSchema)


auth_response_schema = AuthResponseSchema()
