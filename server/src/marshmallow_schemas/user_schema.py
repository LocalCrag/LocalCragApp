from marshmallow import fields

from extensions import ma
from marshmallow_schemas.account_settings_schema import UserAccountSettingsSchema, UserAccountSettingsAvatarSchema
from marshmallow_schemas.permission_schema import PermissionSchema
from models.user import User


class UserMinSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User

    id = ma.auto_field()
    email = ma.auto_field()
    firstname = ma.auto_field()
    lastname = ma.auto_field()
    accountSettings = fields.Nested(UserAccountSettingsAvatarSchema, attribute="account_settings")


class UserTaskSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User

    id = ma.auto_field()
    email = ma.auto_field()
    firstname = ma.auto_field()
    lastname = ma.auto_field()


users_task_schema = UserTaskSchema(many=True)


class UserSchema(UserMinSchema):
    activated = ma.auto_field()
    locked = ma.auto_field()
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")


users_schema = UserSchema(many=True)


class UserDetailSchema(UserSchema):
    permissions = fields.Nested(PermissionSchema, many=True)
    activatedAt = fields.DateTime(attribute="activated_at")
    accountSettings = fields.Nested(UserAccountSettingsSchema, attribute="account_settings")


user_schema = UserDetailSchema()
