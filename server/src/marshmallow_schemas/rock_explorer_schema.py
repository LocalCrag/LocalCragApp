from marshmallow import fields
from marshmallow_enum import EnumField

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from util.search_result_serialization import serialize_search_result
from util.secret_service import SecretService


def _topo_leaf(obj):
    """Return (object_type, object_id) for the single-leaf topo FK, if any.

    Priority: line → area → sector → crag (matches app single-leaf invariant).
    """
    if getattr(obj, "line_id", None):
        return "Line", obj.line_id
    if getattr(obj, "area_id", None):
        return "Area", obj.area_id
    if getattr(obj, "sector_id", None):
        return "Sector", obj.sector_id
    if getattr(obj, "crag_id", None):
        return "Crag", obj.crag_id
    return None, None


def get_topo_link(obj):
    """Serialize nested searchable-shaped topo link, or None if missing/secret."""
    object_type, object_id = _topo_leaf(obj)
    if not object_type or not object_id:
        return None
    if SecretService.is_secret(object_id) and not SecretService.can_view_secrets():
        return None
    return serialize_search_result(object_type, object_id)


class RockExplorerClusterSchema(BaseEntitySchema):
    title = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    potential = EnumField(RockExplorerPotentialEnum, by_value=True, allow_none=True)
    rockQuality = EnumField(RockExplorerRockQualityEnum, by_value=True, attribute="rock_quality", allow_none=True)
    rockType = EnumField(RockExplorerRockTypeEnum, by_value=True, attribute="rock_type", allow_none=True)
    gradeLineType = EnumField(LineTypeEnum, by_value=True, attribute="grade_line_type", allow_none=True)
    gradeScale = fields.String(attribute="grade_scale", allow_none=True)
    gradeValueMin = fields.Integer(attribute="grade_value_min", allow_none=True)
    gradeValueMax = fields.Integer(attribute="grade_value_max", allow_none=True)
    accessIssues = fields.List(fields.String(), attribute="access_issues")
    cragId = fields.String(attribute="crag_id", allow_none=True)
    sectorId = fields.String(attribute="sector_id", allow_none=True)
    areaId = fields.String(attribute="area_id", allow_none=True)
    lineId = fields.String(attribute="line_id", allow_none=True)
    topoLink = fields.Method("get_topo_link")
    featureIds = fields.Method("get_feature_ids")

    def get_feature_ids(self, obj):
        return [str(f.id) for f in (obj.features or [])]

    def get_topo_link(self, obj):
        return get_topo_link(obj)


class RockExplorerFeatureSchema(BaseEntitySchema):
    title = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    potential = EnumField(RockExplorerPotentialEnum, by_value=True, allow_none=True)
    rockQuality = EnumField(RockExplorerRockQualityEnum, by_value=True, attribute="rock_quality", allow_none=True)
    rockType = EnumField(RockExplorerRockTypeEnum, by_value=True, attribute="rock_type", allow_none=True)
    gradeLineType = EnumField(LineTypeEnum, by_value=True, attribute="grade_line_type", allow_none=True)
    gradeScale = fields.String(attribute="grade_scale", allow_none=True)
    gradeValueMin = fields.Integer(attribute="grade_value_min", allow_none=True)
    gradeValueMax = fields.Integer(attribute="grade_value_max", allow_none=True)
    accessIssues = fields.List(fields.String(), attribute="access_issues")
    geometry = fields.Dict(required=True)
    clusterId = fields.String(attribute="cluster_id", allow_none=True)
    cragId = fields.String(attribute="crag_id", allow_none=True)
    sectorId = fields.String(attribute="sector_id", allow_none=True)
    areaId = fields.String(attribute="area_id", allow_none=True)
    lineId = fields.String(attribute="line_id", allow_none=True)
    topoLink = fields.Method("get_topo_link")

    def get_topo_link(self, obj):
        return get_topo_link(obj)


rock_explorer_feature_schema = RockExplorerFeatureSchema()
rock_explorer_features_schema = RockExplorerFeatureSchema(many=True)
rock_explorer_cluster_schema = RockExplorerClusterSchema()
rock_explorer_clusters_schema = RockExplorerClusterSchema(many=True)
