from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.file_schema import FileSchema


class UserTinySchema(ma.SQLAlchemySchema):
    """Small user representation (no avatar)."""

    id = fields.String()
    slug = fields.String()
    firstname = fields.String()
    lastname = fields.String()


class UserMinSchema(UserTinySchema):
    avatar = ma.Nested(FileSchema)


class UserSchema(BaseEntitySchema):
    email = fields.String()
    firstname = fields.String()
    lastname = fields.String()
    slug = fields.String()
    accountLanguage = fields.String(attribute="account_settings.language")
    superadmin = fields.Boolean()
    admin = fields.Boolean()
    moderator = fields.Boolean()
    member = fields.Boolean()
    activated = fields.Boolean()
    activatedAt = fields.DateTime(attribute="activated_at")
    avatar = ma.Nested(FileSchema)


user_list_schema = UserSchema(many=True)
user_schema = UserSchema()
user_min_schema = UserMinSchema()
