from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.file_schema import FileSchema


class UserSchema(BaseEntitySchema):
    email = fields.String()
    firstname = fields.String()
    lastname = fields.String()
    activated = fields.Boolean()
    locked = fields.Boolean()


class UserDetailSchema(UserSchema):
    activatedAt = fields.DateTime(attribute="activated_at")
    colorScheme = fields.String(attribute='color_scheme')
    language = fields.String()
    avatar = ma.Nested(FileSchema)


user_list_schema = UserSchema(many=True)
user_schema = UserDetailSchema()
