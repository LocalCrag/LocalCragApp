from flask_marshmallow import Schema
from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import UserSchema


class BaseEntityWithoutID(Schema):
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")
    createdBy = ma.Nested(UserSchema, attribute='created_by')
    isEditable = fields.Boolean(attribute='is_editable')
    isDeletable = fields.Boolean(attribute='is_deletable')


class BaseEntitySchema(BaseEntityWithoutID):
    id = fields.Integer()
