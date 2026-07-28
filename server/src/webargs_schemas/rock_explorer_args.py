from marshmallow import validate
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_access_issue_enum import RockExplorerAccessIssueEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum

_potential = fields.Str(
    required=True,
    allow_none=False,
    validate=validate.OneOf([e.value for e in RockExplorerPotentialEnum]),
)
_rock_quality = fields.Str(
    load_default=None,
    allow_none=True,
    validate=validate.OneOf([e.value for e in RockExplorerRockQualityEnum]),
)
_rock_type = fields.Str(
    load_default=None,
    allow_none=True,
    validate=validate.OneOf([e.value for e in RockExplorerRockTypeEnum]),
)
_grade_line_type = fields.Str(
    load_default=None,
    allow_none=True,
    validate=validate.OneOf([e.value for e in LineTypeEnum]),
)
_access_issues = fields.List(
    fields.Str(validate=validate.OneOf([e.value for e in RockExplorerAccessIssueEnum])),
    load_default=list,
)

_topo_link_item = {
    "objectType": fields.Str(
        required=True,
        validate=validate.OneOf(["Line", "Area", "Sector", "Crag"]),
    ),
    "objectId": fields.UUID(required=True),
}

_parking_site_item = {
    "id": fields.Str(required=True, validate=validate.Length(min=1, max=64)),
    "lat": fields.Float(required=True),
    "lng": fields.Float(required=True),
    "title": fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=120)),
    "description": fields.Str(load_default=None, allow_none=True),
}

_path_item = {
    "id": fields.Str(required=True, validate=validate.Length(min=1, max=64)),
    "title": fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=120)),
    "description": fields.Str(load_default=None, allow_none=True),
    "geometry": fields.Dict(required=True),
}

_metadata_args = {
    "title": fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=120)),
    "description": fields.Str(load_default=None, allow_none=True),
    "potential": _potential,
    "rockQuality": _rock_quality,
    "rockType": _rock_type,
    "gradeLineType": _grade_line_type,
    "gradeScale": fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=32)),
    "gradeValueMin": fields.Int(load_default=None, allow_none=True),
    "gradeValueMax": fields.Int(load_default=None, allow_none=True),
    "accessIssues": _access_issues,
    "topoLinks": fields.List(fields.Nested(_topo_link_item), load_default=list),
    "parkingSites": fields.List(fields.Nested(_parking_site_item), load_default=list),
    "paths": fields.List(fields.Nested(_path_item), load_default=list),
}

rock_explorer_feature_args = {
    **_metadata_args,
    "geometry": fields.Dict(required=True),
}
