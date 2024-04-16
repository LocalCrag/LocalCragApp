from marshmallow import fields, post_dump

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class RegionSchema(BaseEntitySchema):
    name = fields.String()
    description = fields.String()
    slug = fields.String()
    rules = fields.String()
    ascentCount = fields.Integer(attribute='ascent_count')

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data['rules'] = replace_bucket_placeholders(data['rules'])
        data['description'] = replace_bucket_placeholders(data['description'])
        return data


region_schema = RegionSchema()
