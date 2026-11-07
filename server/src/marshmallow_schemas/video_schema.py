from marshmallow import fields

from extensions import ma


class VideoSchema(ma.Schema):
    url = fields.String()
    title = fields.String()
    source = fields.String(allow_none=True)
    fileId = fields.String(attribute="file_id", allow_none=True)
    startSeconds = fields.Integer(attribute="start_seconds", allow_none=True)


video_schema = VideoSchema()
