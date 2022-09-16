from marshmallow import fields

from extensions import ma
from marshmallow_schemas.language_schema import LanguageSchema
from marshmallow_schemas.media_schema import MediaSchema
from models.account_settings import AccountSettings


class AccountSettingsSchema(ma.SQLAlchemySchema):
    class Meta:
        model = AccountSettings

    colorScheme = fields.String(attribute='color_scheme')
    language = ma.Nested(LanguageSchema)
    avatar = ma.Nested(MediaSchema)
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")


class UserAccountSettingsAvatarSchema(ma.SQLAlchemySchema):
    class Meta:
        model = AccountSettings

    avatar = ma.Nested(MediaSchema)


class UserAccountSettingsSchema(ma.SQLAlchemySchema):
    class Meta:
        model = AccountSettings

    language = ma.Nested(LanguageSchema)


account_settings_schema = AccountSettingsSchema()

user_account_settings_schema = UserAccountSettingsSchema()
