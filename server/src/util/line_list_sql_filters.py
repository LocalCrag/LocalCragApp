"""SQLAlchemy filters for advanced GET /lines query options."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import and_, false, func, not_, or_, select

from models.ascent import Ascent
from models.instance_settings import InstanceSettings
from models.line import Line
from util.line_list_query_args import LineListFilters

if TYPE_CHECKING:
    from models.user import User


_BOOL_API_TO_LINE = {
    "eliminate": Line.eliminate,
    "traverse": Line.traverse,
    "highball": Line.highball,
    "lowball": Line.lowball,
    "morpho": Line.morpho,
    "noTopout": Line.no_topout,
    "badDropzone": Line.bad_dropzone,
    "childFriendly": Line.child_friendly,
    "roof": Line.roof,
    "slab": Line.slab,
    "vertical": Line.vertical,
    "overhang": Line.overhang,
    "athletic": Line.athletic,
    "technical": Line.technical,
    "endurance": Line.endurance,
    "cruxy": Line.cruxy,
    "dyno": Line.dyno,
    "jugs": Line.jugs,
    "sloper": Line.sloper,
    "crimps": Line.crimps,
    "pockets": Line.pockets,
    "pinches": Line.pinches,
    "crack": Line.crack,
    "dihedral": Line.dihedral,
    "compression": Line.compression,
    "arete": Line.arete,
    "mantle": Line.mantle,
}


def apply_get_lines_advanced_filters(
    query,
    filters: LineListFilters,
    instance_settings: InstanceSettings,
    user: Optional["User"],
):
    """
    Apply advanced GET /lines query filters to an existing Line select.

    Expects `filters` from parse_line_list_filters. Uses instance settings to pick
    user vs author grade/rating columns. `user` is required for climb_filter;
    when absent, "climbed" matches nothing.
    """
    # Header grade slider (line_type + grade_scale sent together with min/max).
    if filters.line_type:
        query = query.filter(Line.type == filters.line_type)
    if filters.grade_scale:
        query = query.filter(Line.grade_scale == filters.grade_scale)
    if filters.min_grade is not None and filters.max_grade is not None:
        if instance_settings.display_user_grades:
            query = query.filter(
                Line.user_grade_value <= filters.max_grade,
                Line.user_grade_value >= filters.min_grade,
            )
        else:
            query = query.filter(
                Line.author_grade_value <= filters.max_grade,
                Line.author_grade_value >= filters.min_grade,
            )

    # Advanced dialog: star rating range (null ratings treated as 0).
    if filters.min_rating is not None and filters.max_rating is not None:
        col = Line.user_rating if instance_settings.display_user_ratings else Line.author_rating
        query = query.filter(
            func.coalesce(col, 0) >= filters.min_rating,
            func.coalesce(col, 0) <= filters.max_rating,
        )

    if filters.starting_position is not None:
        query = query.filter(Line.starting_position == filters.starting_position)

    if filters.drying is not None:
        query = query.filter(Line.drying == filters.drying)

    # JSON array column: non-null with length > 0 counts as having a video.
    video_len = func.coalesce(func.json_array_length(Line.videos), 0)
    if filters.has_video == "yes":
        query = query.filter(and_(Line.videos.isnot(None), video_len > 0))
    elif filters.has_video == "no":
        query = query.filter(or_(Line.videos.is_(None), video_len == 0))

    # FA year bounds only apply to lines that have fa_year set.
    if filters.fa_year_from is not None:
        query = query.filter(Line.fa_year.isnot(None), Line.fa_year >= filters.fa_year_from)
    if filters.fa_year_to is not None:
        query = query.filter(Line.fa_year.isnot(None), Line.fa_year <= filters.fa_year_to)

    # Each required_bools key must be true on the line (AND across keys).
    for key in filters.required_bools:
        col = _BOOL_API_TO_LINE[key]
        query = query.filter(col.is_(True))

    # Personal ascent filter; needs JWT user for meaningful results.
    if filters.climb_filter == "climbed":
        if user is None:
            query = query.filter(false())
        else:
            climbed = (
                select(1)
                .select_from(Ascent)
                .where(
                    and_(
                        Ascent.line_id == Line.id,
                        Ascent.created_by_id == user.id,
                    )
                )
                .exists()
            )
            query = query.filter(climbed)
    elif filters.climb_filter == "not_climbed":
        if user is not None:
            climbed = (
                select(1)
                .select_from(Ascent)
                .where(
                    and_(
                        Ascent.line_id == Line.id,
                        Ascent.created_by_id == user.id,
                    )
                )
                .exists()
            )
            query = query.filter(not_(climbed))

    return query
