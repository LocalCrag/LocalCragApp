from marshmallow import fields, post_dump

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class PostSearchSchema(BaseEntitySchema):
    title = fields.String()
    slug = fields.String()


class PostSchema(PostSearchSchema):
    text = fields.String()

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data["text"] = replace_bucket_placeholders(data["text"])
        return data


post_schema = PostSchema()
posts_schema = PostSchema(many=True)
