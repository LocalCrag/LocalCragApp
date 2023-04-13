from marshmallow import fields

from extensions import ma


class SimpleMessageSchema(ma.Schema):
    message = fields.String()


simple_message_schema = SimpleMessageSchema()
