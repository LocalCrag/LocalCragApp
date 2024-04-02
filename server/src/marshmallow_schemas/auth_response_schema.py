from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import UserSchema


class AuthResponseSchema(ma.Schema):
    message = fields.String()
    accessToken = fields.String(attribute='access_token')
    refreshToken = fields.String(attribute='refresh_token')
    user = ma.Nested(UserSchema)


auth_response_schema = AuthResponseSchema()
