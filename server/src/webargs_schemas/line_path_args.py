from typing import List

from marshmallow import ValidationError
from webargs import fields


def validate_path(path: List[float]) -> bool:
    """
    Checks the requirements for a line path (at least 2 points (length 4), even and in an interval of 0-100).
    Type is already checked by webargs.
    """
    if len(path) < 4:
        raise ValidationError("Path must contain at least two points (4 values).")
    if len(path) % 2 != 0:
        raise ValidationError("Path must contain an even number of values.")
    if not all(0 <= i <= 100 for i in path):
        raise ValidationError("All path values must be in the interval 0-100.")


def validate_tabu_polygon(polygon: List[float]) -> bool:
    """
    Checks a tabu-hold polygon: at least 3 points (6 values), even length, values in 0-100.
    """
    if len(polygon) < 6:
        raise ValidationError("Tabu area path must contain at least three points (6 values).")
    if len(polygon) % 2 != 0:
        raise ValidationError("Tabu area path must contain an even number of values.")
    if not all(0 <= value <= 100 for value in polygon):
        raise ValidationError("All tabu area path values must be in the interval 0-100.")


def validate_tabu_areas(tabu_areas: List[dict]) -> bool:
    """Checks unique ids and valid polygons on the topo-image catalog."""
    ids = [area.get("id") for area in tabu_areas or []]
    if any(not area_id for area_id in ids):
        raise ValidationError("Each tabu area must have an id.")
    if len(ids) != len(set(ids)):
        raise ValidationError("Duplicate tabu area ids.")
    for area in tabu_areas or []:
        validate_tabu_polygon(area.get("path") or [])


tabu_area_item_args = {
    "id": fields.String(required=True, allow_none=False),
    "path": fields.List(fields.Float, required=True, allow_none=False, validate=validate_tabu_polygon),
}

line_path_sync_item_args = {
    "id": fields.String(required=False),
    "line": fields.String(required=True, allow_none=False),
    "path": fields.List(fields.Float, required=True, allow_none=False, validate=validate_path),
    "tabuAreaIds": fields.List(fields.String, required=False, load_default=list),
}

line_path_sync_args = {
    "tabuAreas": fields.List(
        fields.Nested(tabu_area_item_args),
        required=False,
        load_default=list,
        validate=validate_tabu_areas,
    ),
    "linePaths": fields.List(fields.Nested(line_path_sync_item_args), required=True),
}
