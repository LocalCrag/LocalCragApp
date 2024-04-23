from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.file_schema import FileSchema, FileSchemaWithoutUser


class UserMinSchema(ma.SQLAlchemySchema):
    firstname = fields.String()
    lastname = fields.String()
    slug = fields.String()
    avatar = ma.Nested(FileSchemaWithoutUser)


class UserSchema(BaseEntitySchema):
    email = fields.String()
    firstname = fields.String()
    lastname = fields.String()
    slug = fields.String()
    language = fields.String()
    admin = fields.Boolean()
    moderator = fields.Boolean()
    member = fields.Boolean()
    activated = fields.Boolean()
    activatedAt = fields.DateTime(attribute="activated_at")
    avatar = ma.Nested(FileSchemaWithoutUser)


user_list_schema = UserSchema(many=True)
user_schema = UserSchema()
user_min_schema = UserMinSchema()
