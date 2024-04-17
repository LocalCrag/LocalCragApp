from marshmallow import fields, post_dump

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class AreaSchema(BaseEntitySchema):
    name = fields.String()
    slug = fields.String()
    shortDescription = fields.String(attribute='short_description')
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')
    orderIndex = fields.Int(attribute='order_index')
    ascentCount = fields.Integer(attribute='ascent_count')


class AreaDetailSchema(AreaSchema):
    lat = fields.Float()
    lng = fields.Float()
    description = fields.String(attribute='description')

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data['description'] = replace_bucket_placeholders(data['description'])
        return data


class AreaMenuSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()


area_schema = AreaDetailSchema()
areas_schema = AreaSchema(many=True)
