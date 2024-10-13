from marshmallow import fields, post_dump

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.file_schema import file_schema
from marshmallow_schemas.map_marker_schema import map_marker_schema
from util.bucket_placeholders import replace_bucket_placeholders


class AscentAndTodoAreaSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()


class AreaSchema(BaseEntityMinSchema):
    name = fields.String()
    slug = fields.String()
    shortDescription = fields.String(attribute='short_description')
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')
    orderIndex = fields.Int(attribute='order_index')
    ascentCount = fields.Integer(attribute='ascent_count')
    secret = fields.Boolean()


class AreaDetailSchema(AreaSchema):
    description = fields.String(attribute='description')
    mapMarkers = fields.List(fields.Nested(map_marker_schema), attribute='map_markers')

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data['description'] = replace_bucket_placeholders(data['description'])
        return data


class AreaMenuSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()


area_schema = AreaDetailSchema()
areas_schema = AreaSchema(many=True)
