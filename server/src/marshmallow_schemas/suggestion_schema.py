from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.line_path_schema import LinePathSchemaForLines
from marshmallow_schemas.topo_image_schema import TopoImageSchema
from marshmallow_schemas.user_schema import UserMinSchema


class SuggestionLineSchema(BaseEntityMinSchema):
    name = fields.String()
    slug = fields.String()
    color = fields.String()
    createdBy = fields.Nested(UserMinSchema, attribute="created_by", allow_none=True)
    linePaths = fields.List(fields.Nested(LinePathSchemaForLines), attribute="line_paths")
    cragSlug = fields.String(attribute="crag_slug")
    sectorSlug = fields.String(attribute="sector_slug")
    areaSlug = fields.String(attribute="area_slug")
    cragName = fields.String(attribute="area.sector.crag.name")
    sectorName = fields.String(attribute="area.sector.name")
    areaName = fields.String(attribute="area.name")


class SuggestionTopoImageSchema(TopoImageSchema):
    createdBy = fields.Nested(UserMinSchema, attribute="created_by", allow_none=True)
    cragSlug = fields.String(attribute="area.sector.crag.slug")
    sectorSlug = fields.String(attribute="area.sector.slug")
    areaSlug = fields.String(attribute="area.slug")
    cragName = fields.String(attribute="area.sector.crag.name")
    sectorName = fields.String(attribute="area.sector.name")
    areaName = fields.String(attribute="area.name")


class SuggestionQueueSchema(ma.Schema):
    lines = fields.List(fields.Nested(SuggestionLineSchema))
    topoImages = fields.List(fields.Nested(SuggestionTopoImageSchema))


suggestion_queue_schema = SuggestionQueueSchema()
