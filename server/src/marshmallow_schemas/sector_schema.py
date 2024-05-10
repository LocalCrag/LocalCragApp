from marshmallow import fields, post_dump

from extensions import ma
from marshmallow_schemas.area_schema import AreaMenuSchema
from marshmallow_schemas.file_schema import file_schema

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class SectorSchema(BaseEntitySchema):
    name = fields.String()
    slug = fields.String()
    shortDescription = fields.String(attribute='short_description')
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')
    orderIndex = fields.Int(attribute='order_index')
    ascentCount = fields.Integer(attribute='ascent_count')
    secret = fields.Boolean()


class SectorDetailSchema(SectorSchema):
    description = fields.String()
    lat = fields.Float()
    lng = fields.Float()
    rules = fields.String()

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data['description'] = replace_bucket_placeholders(data['description'])
        data['rules'] = replace_bucket_placeholders(data['rules'])
        return data


class SectorMenuSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    areas = fields.List(fields.Nested(AreaMenuSchema()))


sector_schema = SectorDetailSchema()
sectors_schema = SectorSchema(many=True)
