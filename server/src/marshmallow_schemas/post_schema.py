from marshmallow import fields, post_dump

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class PostSchema(BaseEntitySchema):
    title = fields.String()
    text = fields.String()
    slug = fields.String()

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data["text"] = replace_bucket_placeholders(data["text"])
        return data


post_schema = PostSchema()
posts_schema = PostSchema(many=True)
