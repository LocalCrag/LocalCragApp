from marshmallow import fields, post_dump
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.tag_schema import TagSchema
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_feature_status_enum import RockExplorerFeatureStatusEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum


class RockExplorerFeatureSchema(BaseEntitySchema):
    title = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    status = EnumField(RockExplorerFeatureStatusEnum, by_value=True)
    recordingDeviceId = fields.String(attribute="recording_device_id", allow_none=True)
    recordingUpdatedAt = fields.DateTime(attribute="recording_updated_at", allow_none=True)
    potential = EnumField(RockExplorerPotentialEnum, by_value=True, allow_none=True)
    rockQuality = EnumField(RockExplorerRockQualityEnum, by_value=True, attribute="rock_quality", allow_none=True)
    rockType = EnumField(RockExplorerRockTypeEnum, by_value=True, attribute="rock_type", allow_none=True)
    gradeLineType = EnumField(LineTypeEnum, by_value=True, attribute="grade_line_type", allow_none=True)
    gradeScale = fields.String(attribute="grade_scale", allow_none=True)
    gradeValueMin = fields.Integer(attribute="grade_value_min", allow_none=True)
    gradeValueMax = fields.Integer(attribute="grade_value_max", allow_none=True)
    accessIssues = fields.List(fields.String(), attribute="access_issues")
    geometry = fields.Dict(allow_none=True)
    parkingSites = fields.List(fields.Dict(), attribute="parking_sites", dump_default=list)
    paths = fields.List(fields.Dict(), dump_default=list)
    topoLinks = fields.Nested(TagSchema, attribute="topo_links", many=True)


class RockExplorerGeoJSONFeatureSchema(ma.Schema):
    """Map layer + list view: id, title, potential (paint), quality/type (list)."""

    id = fields.String()
    geometry = fields.Dict()
    title = fields.String(allow_none=True)
    potential = EnumField(RockExplorerPotentialEnum, by_value=True, allow_none=True)
    rockQuality = EnumField(RockExplorerRockQualityEnum, by_value=True, attribute="rock_quality", allow_none=True)
    rockType = EnumField(RockExplorerRockTypeEnum, by_value=True, attribute="rock_type", allow_none=True)

    @post_dump
    def to_geojson_feature(self, data, **kwargs):
        geometry = data.pop("geometry")
        return {
            "type": "Feature",
            "id": data["id"],
            "geometry": geometry,
            "properties": data,
        }


rock_explorer_feature_schema = RockExplorerFeatureSchema()
rock_explorer_geojson_features_schema = RockExplorerGeoJSONFeatureSchema(many=True)


def dump_rock_explorer_geojson_collection(features):
    return {
        "type": "FeatureCollection",
        "features": rock_explorer_geojson_features_schema.dump(features),
    }
