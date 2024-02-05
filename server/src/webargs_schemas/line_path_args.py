from typing import List

from webargs import fields


def validate_path(path: List[float]) -> bool:
    """
    Checks the requirements for a line path (at least 2 points (length 4), even and in an interval of 0-100).
    Type is already checked by webargs.
    """
    if len(path) < 4:
        return False
    if len(path) % 2 != 0:
        return False
    if not all(0 <= i <= 100 for i in path):
        return False
    return True


line_path_args = {
    "line": fields.String(required=True, allow_none=False),
    "path": fields.List(fields.Float, required=True, allow_none=False, validate=validate_path)
}
