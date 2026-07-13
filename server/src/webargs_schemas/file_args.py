from marshmallow import Schema, fields, validate


class FileFocusArgsSchema(Schema):
    focusY = fields.Float(required=True, allow_none=True, validate=validate.Range(min=0, max=1))


file_focus_args = FileFocusArgsSchema()
