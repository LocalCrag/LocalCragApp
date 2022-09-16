from marshmallow import fields

from extensions import ma
from marshmallow_schemas.account_settings_schema import AccountSettingsSchema
from marshmallow_schemas.language_schema import LanguageSchema
from marshmallow_schemas.permission_schema import PermissionSchema
from marshmallow_schemas.user_schema import UserSchema


class AuthResponseSchema(ma.Schema):
    message = fields.String()
    accessToken = fields.String(attribute='access_token')
    refreshToken = fields.String(attribute='refresh_token')
    user = ma.Nested(UserSchema)
    accountSettings = ma.Nested(AccountSettingsSchema, attribute='account_settings')
    permissions = fields.Nested(PermissionSchema, many=True)
    languages = fields.Nested(LanguageSchema, many=True)


auth_response_schema = AuthResponseSchema()
