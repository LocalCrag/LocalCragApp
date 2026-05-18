"""
Shared query args for line list filtering (GET /lines and related clients).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet, Optional, Set

from flask import Request

from error_handling.http_exceptions.bad_request import BadRequest
from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum

_LINE_LIST_BOOL_API_KEYS: FrozenSet[str] = frozenset(
    {
        "eliminate",
        "traverse",
        "highball",
        "lowball",
        "morpho",
        "noTopout",
        "badDropzone",
        "childFriendly",
        "roof",
        "slab",
        "vertical",
        "overhang",
        "athletic",
        "technical",
        "endurance",
        "cruxy",
        "dyno",
        "jugs",
        "sloper",
        "crimps",
        "pockets",
        "pinches",
        "crack",
        "dihedral",
        "compression",
        "arete",
        "mantle",
    }
)


def _parse_starting_position(value: str) -> StartingPositionEnum:
    try:
        return StartingPositionEnum(value)
    except ValueError as e:
        raise BadRequest(f"Invalid starting position: {value}") from e


@dataclass(frozen=True)
class LineListFilters:
    line_type: Optional[LineTypeEnum]
    grade_scale: Optional[str]
    min_grade: Optional[int]
    max_grade: Optional[int]
    min_rating: Optional[int]
    max_rating: Optional[int]
    starting_position: Optional[StartingPositionEnum]
    has_video: str
    fa_year_from: Optional[int]
    fa_year_to: Optional[int]
    required_bools: FrozenSet[str]
    climb_filter: str


def parse_line_list_filters(request: Request) -> LineListFilters:
    """
    Parse advanced GET /lines query parameters into a LineListFilters DTO.

    Param names and shapes match the client (see line-list-api-query.ts). Raises
    BadRequest on invalid or partial paired args (grade range, rating range, etc.).
    Applied in SQL by apply_get_lines_advanced_filters.
    """
    # Header grade slider: min/max must be sent together with line_type and grade_scale.
    min_grade = request.args.get("min_grade", type=int)
    max_grade = request.args.get("max_grade", type=int)
    line_type = request.args.get("line_type", None, type=LineTypeEnum)
    grade_scale = request.args.get("grade_scale", type=str)

    if sum(x is None for x in [min_grade, max_grade]) == 1:
        raise BadRequest("When filtering for grades, a min and max grade is required.")
    if min_grade is not None and max_grade is not None:
        if line_type is None or not grade_scale:
            raise BadRequest("When filtering for grades, line_type and grade_scale are required.")

    # Advanced dialog: star rating range (both ends required if either is set).
    min_rating = request.args.get("min_rating", type=int)
    max_rating = request.args.get("max_rating", type=int)
    if sum(x is None for x in [min_rating, max_rating]) == 1:
        raise BadRequest("When filtering for ratings, min_rating and max_rating are required.")

    starting_position: Optional[StartingPositionEnum] = None
    raw_position = request.args.get("starting_position", type=str)
    if raw_position:
        starting_position = _parse_starting_position(raw_position.strip())

    has_video = (request.args.get("has_video") or "any").lower()
    if has_video not in ("any", "yes", "no"):
        raise BadRequest("Invalid has_video value.")

    fa_year_from = request.args.get("fa_year_from", type=int)
    fa_year_to = request.args.get("fa_year_to", type=int)

    # Comma-separated API keys; each must be in _LINE_LIST_BOOL_API_KEYS.
    raw_bools = request.args.get("required_bools", type=str)
    required: Set[str] = set()
    if raw_bools:
        for b in raw_bools.split(","):
            b = b.strip()
            if not b:
                continue
            if b not in _LINE_LIST_BOOL_API_KEYS:
                raise BadRequest(f"Invalid required_bools key: {b}")
            required.add(b)

    # Personal ascent filter; JWT user handled when filters are applied in SQL.
    climb_filter = (request.args.get("climb_filter") or "any").lower()
    if climb_filter not in ("any", "climbed", "not_climbed"):
        raise BadRequest("Invalid climb_filter value.")

    return LineListFilters(
        line_type=line_type,
        grade_scale=grade_scale,
        min_grade=min_grade,
        max_grade=max_grade,
        min_rating=min_rating,
        max_rating=max_rating,
        starting_position=starting_position,
        has_video=has_video,
        fa_year_from=fa_year_from,
        fa_year_to=fa_year_to,
        required_bools=frozenset(required),
        climb_filter=climb_filter,
    )
