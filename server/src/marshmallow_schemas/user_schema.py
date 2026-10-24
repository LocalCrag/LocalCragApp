from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.file_schema import FileSchema
from util.suggestions import suggestions_enabled


class UserMinSchema(ma.SQLAlchemySchema):
    id = fields.String()
    slug = fields.String()
    firstname = fields.String()
    lastname = fields.String()


class UserMinWithAvatarSchema(UserMinSchema):
    avatar = ma.Nested(FileSchema)


class UserSchema(BaseEntitySchema):
    email = fields.String()
    firstname = fields.String()
    lastname = fields.String()
    slug = fields.String()
    accountLanguage = fields.String(attribute="account_settings.language")
    accountColorScheme = fields.Function(lambda obj: obj.account_settings.color_scheme.value)
    todoListPrivate = fields.Boolean(attribute="account_settings.todo_list_private")
    superadmin = fields.Boolean()
    admin = fields.Boolean()
    moderator = fields.Boolean()
    member = fields.Boolean()
    suggestionsEnabled = fields.Method("get_suggestions_enabled")
    activated = fields.Boolean()
    activatedAt = fields.DateTime(attribute="activated_at")
    avatar = ma.Nested(FileSchema)

    def get_suggestions_enabled(self, obj):
        return suggestions_enabled(obj)


user_list_schema = UserSchema(many=True)
user_schema = UserSchema()
user_min_with_avatar_schema = UserMinWithAvatarSchema()
