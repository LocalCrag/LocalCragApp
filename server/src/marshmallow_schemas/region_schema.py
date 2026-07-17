from marshmallow import fields, post_dump

from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.file_schema import file_schema
from marshmallow_schemas.mixins.moderator_task_count import (
    ModeratorTaskCountSchemaMixin,
)
from util.bucket_placeholders import replace_bucket_placeholders


class RegionSchema(BaseEntityMinSchema, ModeratorTaskCountSchemaMixin):
    name = fields.String()
    description = fields.String()
    rules = fields.String()
    image = fields.Nested(file_schema, attribute="image")
    ascentCount = fields.Integer(attribute="ascent_count")
    imageCount = fields.Integer(attribute="image_count")
    commentCount = fields.Integer(attribute="comment_count")
    cragCount = fields.Integer(attribute="crag_count")
    lineCount = fields.Integer(attribute="line_count")

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data["rules"] = replace_bucket_placeholders(data["rules"])
        data["description"] = replace_bucket_placeholders(data["description"])
        return data


region_schema = RegionSchema()
