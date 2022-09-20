from flask_marshmallow import Schema
from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import UserSchema


class BaseEntitySchema(ma.SQLAlchemySchema):
    id = fields.String()
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")
    createdBy = ma.Nested(UserSchema, attribute='created_by')
