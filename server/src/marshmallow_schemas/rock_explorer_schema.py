from marshmallow import fields
from marshmallow_enum import EnumField

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.tag_schema import TagSchema
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from util.secret_service import SecretService


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
    parkingSites = fields.List(fields.Dict(), attribute="parking_sites", dump_default=list)
    paths = fields.List(fields.Dict(), dump_default=list)
    topoLinks = fields.Method("get_topo_links")

    def get_topo_links(self, obj):
        """Same TagSchema shape as gallery tags; omit secret targets the viewer cannot see."""
        visible = []
        for tag in obj.topo_links or []:
            if SecretService.is_secret(tag.object_id) and not SecretService.can_view_secrets():
                continue
            visible.append(tag)
        return TagSchema(many=True).dump(visible)


rock_explorer_feature_schema = RockExplorerFeatureSchema()
rock_explorer_features_schema = RockExplorerFeatureSchema(many=True)
