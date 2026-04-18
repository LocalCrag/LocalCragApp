from marshmallow import fields, post_dump

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class PostSearchSchema(BaseEntitySchema):
    title = fields.String()
    slug = fields.String()
    commentCount = fields.Method("get_comment_count")

    def get_comment_count(self, obj):
        return int(getattr(obj, "_comment_count", 0))


class PostSchema(PostSearchSchema):
    text = fields.String()

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data["text"] = replace_bucket_placeholders(data["text"])
        return data


post_schema = PostSchema()
posts_schema = PostSchema(many=True)
