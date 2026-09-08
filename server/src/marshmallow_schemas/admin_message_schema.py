from marshmallow import fields

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class AdminMessageSchema(BaseEntitySchema):
    title = fields.String()
    text = fields.String()


admin_message_schema = AdminMessageSchema()
admin_messages_schema = AdminMessageSchema(many=True)
