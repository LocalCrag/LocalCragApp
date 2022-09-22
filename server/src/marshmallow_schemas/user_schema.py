from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.file_schema import FileSchema


class UserMinSchema(BaseEntitySchema):
    email = fields.String()
    firstname = fields.String()
    lastname = fields.String()


class UserSchema(UserMinSchema):
    activated = fields.Boolean()
    locked = fields.Boolean()
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")


class UserDetailSchema(UserSchema):
    activatedAt = fields.DateTime(attribute="activated_at")
    colorScheme = fields.String(attribute='color_scheme')
    language = fields.String()
    avatar = ma.Nested(FileSchema)


user_min_list_schema = UserMinSchema(many=True)
user_list_schema = UserSchema(many=True)
user_schema = UserDetailSchema()
