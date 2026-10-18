from marshmallow import Schema, fields, validate


class FileFocusArgsSchema(Schema):
    focusY = fields.Float(required=True, allow_none=True, validate=validate.Range(min=0, max=1))


class ImageCropArgsSchema(Schema):
    x = fields.Integer(required=True, validate=validate.Range(min=0))
    y = fields.Integer(required=True, validate=validate.Range(min=0))
    width = fields.Integer(required=True, validate=validate.Range(min=1))
    height = fields.Integer(required=True, validate=validate.Range(min=1))


class FileTransformArgsSchema(Schema):
    rotation = fields.Integer(required=True, validate=validate.OneOf([0, 90, 180, 270]))
    crop = fields.Nested(ImageCropArgsSchema, load_default=None, allow_none=True)


file_focus_args = FileFocusArgsSchema()
file_transform_args = FileTransformArgsSchema()
