from marshmallow import ValidationError, validate
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_access_issue_enum import RockExplorerAccessIssueEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from webargs_schemas.map_marker_args import validate_latitude, validate_longitude

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
    "lat": fields.Float(required=True, validate=validate_latitude),
    "lng": fields.Float(required=True, validate=validate_longitude),
    "title": fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=120)),
    "description": fields.Str(load_default=None, allow_none=True),
}


def validate_path_linestring(geometry):
    if not isinstance(geometry, dict):
        raise ValidationError("path geometry must be an object.")
    if geometry.get("type") != "LineString":
        raise ValidationError("path geometry.type must be LineString.")
    coordinates = geometry.get("coordinates")
    if not isinstance(coordinates, list) or len(coordinates) < 2:
        raise ValidationError("path LineString requires at least 2 positions.")
    for position in coordinates:
        if not isinstance(position, (list, tuple)) or len(position) < 2:
            raise ValidationError("Each LineString position must be [lng, lat].")
        try:
            lng = float(position[0])
            lat = float(position[1])
        except (TypeError, ValueError) as exc:
            raise ValidationError("LineString coordinates must be numbers.") from exc
        validate_longitude(lng)
        validate_latitude(lat)


_path_item = {
    "id": fields.Str(required=True, validate=validate.Length(min=1, max=64)),
    "title": fields.Str(load_default=None, allow_none=True, validate=validate.Length(max=120)),
    "description": fields.Str(load_default=None, allow_none=True),
    "geometry": fields.Dict(required=True, validate=validate_path_linestring),
}

_feature_geometry = {
    "type": fields.Str(required=True, validate=validate.OneOf(["Point", "Polygon"])),
    "coordinates": fields.Field(required=True),
}


def validate_unique_item_ids(items):
    ids = [item["id"] for item in items]
    if len(ids) != len(set(ids)):
        raise ValidationError("ids must be unique.")


rock_explorer_feature_args = {
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
    "parkingSites": fields.List(
        fields.Nested(_parking_site_item),
        load_default=list,
        validate=validate_unique_item_ids,
    ),
    "paths": fields.List(
        fields.Nested(_path_item),
        load_default=list,
        validate=validate_unique_item_ids,
    ),
    "geometry": fields.Nested(_feature_geometry, required=True),
}


def cross_validate_rock_explorer_feature_args(args):
    grade_min = args.get("gradeValueMin")
    grade_max = args.get("gradeValueMax")
    if grade_min is not None and grade_max is not None and grade_max < grade_min:
        raise ValidationError({"gradeValueMax": ["gradeValueMax must be greater than or equal to gradeValueMin."]})
