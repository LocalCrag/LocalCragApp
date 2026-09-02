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


line_path_sync_item_args = {
    "id": fields.String(required=False),
    "line": fields.String(required=True, allow_none=False),
    "path": fields.List(fields.Float, required=True, allow_none=False, validate=validate_path),
}

line_path_sync_args = {
    "linePaths": fields.List(fields.Nested(line_path_sync_item_args), required=True),
}
