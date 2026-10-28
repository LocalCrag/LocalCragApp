from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.orm import selectinload

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.rating_controversy_schema import (
    rating_controversy_lines_schema,
)
from models.area import Area
from models.ascent import Ascent
from models.instance_settings import InstanceSettings
from models.line import Line
from models.rating_controversy_dismissal import RatingControversyDismissal
from models.sector import Sector
from util.auth_session import session_required
from util.topo_entity_counts import attach_line_ascent_counts

_RESTART_CONFIRMATION = "RESTART"

_DEFAULT_PER_PAGE = 20
_MAX_PER_PAGE = 50
_MIN_ASCENT_OPTIONS = {1, 2, 3, 5, 10, 20, 50}


def _pagination():
    try:
        page = int(request.args.get("page") or 1)
        per_page = int(request.args.get("per_page") or _DEFAULT_PER_PAGE)
    except (TypeError, ValueError):
        raise BadRequest("Invalid pagination.")
    if page < 1 or per_page < 1:
        raise BadRequest("Invalid pagination.")
    return page, min(per_page, _MAX_PER_PAGE)


def _rating_differs():
    """Author stars disagree with the community. A missing author rating is not a controversy."""
    return and_(Line.author_rating.isnot(None), Line.author_rating.is_distinct_from(Line.user_rating))


def _min_ascents():
    raw = request.args.get("minAscents")
    if raw is None or raw == "":
        return 5
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise BadRequest("Invalid minAscents.")
    if value not in _MIN_ASCENT_OPTIONS:
        raise BadRequest("Invalid minAscents.")
    return value


def _kind(compare_grades: bool, compare_ratings: bool):
    """Which controversy list to return. Grade is the default when both are available."""
    raw = (request.args.get("kind") or "").strip().lower()
    if raw not in ("", "grade", "rating"):
        raise BadRequest("Invalid kind.")
    if raw == "grade":
        return "grade" if compare_grades else None
    if raw == "rating":
        return "rating" if compare_ratings else None
    if compare_grades:
        return "grade"
    if compare_ratings:
        return "rating"
    return None


def _dismissal_still_matches(kind: str):
    """True while a stored dismissal still describes the current gap."""
    if kind == "grade":
        same_gap = RatingControversyDismissal.gap == (Line.user_grade_value - Line.author_grade_value)
    else:
        same_gap = or_(
            and_(Line.user_rating.is_(None), RatingControversyDismissal.gap.is_(None)),
            and_(
                Line.user_rating.isnot(None),
                RatingControversyDismissal.gap == (Line.user_rating - Line.author_rating),
            ),
        )
    return (
        select(RatingControversyDismissal.id)
        .where(
            RatingControversyDismissal.line_id == Line.id,
            RatingControversyDismissal.kind == kind,
            same_gap,
        )
        .exists()
    )


def _current_gap(line: Line, kind: str):
    """Signed community-minus-author gap. Null means the community rating is missing."""
    if kind == "grade":
        if line.author_grade_value == line.user_grade_value:
            raise BadRequest("This grade is not a controversy.")
        return line.user_grade_value - line.author_grade_value
    if line.author_rating is None or line.author_rating == line.user_rating:
        raise BadRequest("This rating is not a controversy.")
    if line.user_rating is None:
        return None
    return line.user_rating - line.author_rating


class GetRatingControversies(MethodView):
    """
    Lines whose author grade or star rating disagrees with logged ascents.

    `kind` is `grade` or `rating`. Grade controversies are available when author grades
    are shown. Star controversies are available then too, because community grades and
    stars are still calculated, and also when author stars are shown.
    `minAscents` is 1, 2, 3, 5, 10, 20, or 50 and defaults to 5. When both displayed
    values come from logged ascents, the list is empty.
    """

    @session_required(moderator=True)
    def get(self):
        settings = InstanceSettings.return_it()
        author_grades_shown = not bool(settings.display_user_grades)
        author_ratings_shown = not bool(settings.display_user_ratings)
        compare_grades = author_grades_shown
        # Community stars stay useful when the topo shows author grades.
        compare_ratings = author_ratings_shown or author_grades_shown
        page, per_page = _pagination()
        min_ascents = _min_ascents()
        kind = _kind(compare_grades, compare_ratings)

        if kind is None:
            return jsonify(
                {
                    "items": [],
                    "hasNext": False,
                    "kind": None,
                    "compareGrades": compare_grades,
                    "compareRatings": compare_ratings,
                }
            )

        if kind == "grade":
            differs = Line.author_grade_value != Line.user_grade_value
            gap = func.abs(Line.author_grade_value - Line.user_grade_value)
        else:
            differs = _rating_differs()
            gap = func.abs(func.coalesce(Line.author_rating, 0) - func.coalesce(Line.user_rating, 0))
        ascent_count = select(func.count(Ascent.id)).where(Ascent.line_id == Line.id).scalar_subquery()
        query = (
            select(Line)
            .options(selectinload(Line.area).selectinload(Area.sector).selectinload(Sector.crag))
            .where(differs, ascent_count >= min_ascents, ~_dismissal_still_matches(kind))
            .order_by(gap.desc(), ascent_count.desc(), func.lower(Line.name).asc(), Line.id.asc())
        )
        paginated = db.paginate(query, page=page, per_page=per_page)
        attach_line_ascent_counts(paginated.items)

        return jsonify(
            {
                "items": rating_controversy_lines_schema.dump(paginated.items),
                "hasNext": paginated.has_next,
                "kind": kind,
                "compareGrades": compare_grades,
                "compareRatings": compare_ratings,
            }
        )


class DismissRatingControversy(MethodView):
    """Remember the current gap so this controversy stays hidden until it changes."""

    @session_required(moderator=True)
    def post(self, line_id):
        body = request.get_json(silent=True) or {}
        kind = body.get("kind")
        if kind not in ("grade", "rating"):
            raise BadRequest("Invalid kind.")
        line = Line.find_by_id(line_id)
        gap = _current_gap(line, kind)
        dismissal = db.session.execute(
            select(RatingControversyDismissal).where(
                RatingControversyDismissal.line_id == line.id,
                RatingControversyDismissal.kind == kind,
            )
        ).scalar_one_or_none()
        if dismissal is None:
            dismissal = RatingControversyDismissal(line_id=line.id, kind=kind, gap=gap)
            db.session.add(dismissal)
        else:
            dismissal.gap = gap
        db.session.commit()
        return jsonify({"dismissed": True, "kind": kind, "gap": gap})


class ResetRatingControversyDismissals(MethodView):
    """Drop every dismissal so ignored controversies show up again."""

    @session_required(admin=True)
    def post(self):
        body = request.get_json(silent=True) or {}
        if body.get("confirmation") != _RESTART_CONFIRMATION:
            raise BadRequest("Type RESTART to confirm.")
        db.session.execute(delete(RatingControversyDismissal))
        db.session.commit()
        return jsonify({"restarted": True})
