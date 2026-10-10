"""Assumed grade intervals for project lines.

A project keeps its OPEN_PROJECT / CLOSED_PROJECT grade. An optional pair of
grade values is the lower and upper bound of the difficulty the project is
expected to fall in. The interval is stored and shown; grade filters still
use the project grade itself.
"""

from error_handling.http_exceptions.bad_request import BadRequest
from models.scale import Scale


def normalize_assumed_grade_bounds(author_grade_value, assumed_grade_min, assumed_grade_max, grade_scale, line_type):
    """
    Return ``(min, max)`` to store.

    Real grades never keep an assumed interval. Projects may omit it. A set
    interval needs both ends, each a real grade on the scale, with min <= max.
    """
    if author_grade_value is None or author_grade_value >= 0:
        return None, None
    if assumed_grade_min is None and assumed_grade_max is None:
        return None, None
    if assumed_grade_min is None or assumed_grade_max is None:
        raise BadRequest("Assumed grade bounds must both be set.")
    if assumed_grade_min > assumed_grade_max:
        raise BadRequest("Assumed grade lower bound cannot be harder than the upper bound.")

    scale = Scale.query.filter(Scale.type == line_type, Scale.name == grade_scale).first()
    allowed = _real_grade_values(scale)
    if assumed_grade_min not in allowed or assumed_grade_max not in allowed:
        raise BadRequest("Assumed grade bounds are not grades on this scale.")
    return assumed_grade_min, assumed_grade_max


def _real_grade_values(scale):
    if scale is None:
        return set()
    return {grade["value"] for grade in scale.grades if isinstance(grade, dict) and grade.get("value", 0) > 0}
