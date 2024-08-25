from marshmallow import fields, post_dump

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from marshmallow_schemas.map_marker_schema import MapMarkerSchema, map_marker_schema
from marshmallow_schemas.sector_schema import SectorMenuSchema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema, BaseEntityMinSchema
from util.bucket_placeholders import replace_bucket_placeholders


class AscentAndTodoCragSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()

class CragSchema(BaseEntityMinSchema):
    name = fields.String()
    orderIndex = fields.Int(attribute='order_index')
    shortDescription = fields.String(attribute='short_description')
    slug = fields.String()
    portraitImage = fields.Nested(file_schema, attribute='portrait_image')
    ascentCount = fields.Integer(attribute='ascent_count')
    secret = fields.Boolean()


class CragDetailSchema(CragSchema):
    lat = fields.Float()
    lng = fields.Float()
    rules = fields.String()
    description = fields.String()
    mapMarkers = fields.List(fields.Nested(map_marker_schema), attribute='map_markers')

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data['description'] = replace_bucket_placeholders(data['description'])
        data['rules'] = replace_bucket_placeholders(data['rules'])
        return data


class CragMenuSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    sectors = fields.List(fields.Nested(SectorMenuSchema()))


crag_schema = CragDetailSchema()
crags_schema = CragSchema(many=True)
crags_menu_schema = CragMenuSchema(many=True)
