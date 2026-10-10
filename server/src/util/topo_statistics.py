"""Aggregates for the topo statistics pages.

Counts use climbable lines: not archived, not a project (author grade >= 0),
and hidden when the caller cannot see secret spots. Year-only ascents stay out
of the week heatmap and are still counted in the per-year chart via ``Ascent.year``.
"""

from sqlalchemy import and_, func, or_

from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.todo import Todo
from util.auth_session import get_current_user
from util.secret_service import SecretService
from util.topo_tab_counts import count_all_gallery_images, count_gallery_images

_SCOPED_TYPES = {
    "crag": Crag,
    "sector": Sector,
    "area": Area,
    "line": Line,
}
_COMMENT_TYPES = {
    "region": "Region",
    "crag": "Crag",
    "sector": "Sector",
    "area": "Area",
    "line": "Line",
}
_POPULAR_LIMIT = 8
_WANTED_LIMIT = 8


def build_topo_statistics(object_type: str, slug: str | None):
    entity = _resolve_entity(object_type, slug)
    if object_type != "region" and SecretService.is_secret(entity.id) and not SecretService.can_view_secrets():
        raise NotFound()

    line_query = _climbable_lines(object_type, entity)
    line_ids = line_query.with_entities(Line.id)

    total_lines = int(line_query.with_entities(func.count(Line.id)).scalar() or 0)
    project_count = int(
        _climbable_lines(object_type, entity, projects=True).with_entities(func.count(Line.id)).scalar() or 0
    )
    total_ascents, flash_count, soft_count, hard_count, distinct_climbers = _ascent_totals(line_ids)

    gym_mode = bool(InstanceSettings.return_it().gym_mode)
    show_first_ascents = object_type != "line" and not gym_mode
    child_kind, children = _children(object_type, line_query)
    payload = {
        "objectType": object_type,
        "heatmap": _heatmap(line_ids),
        "ascentsPerYear": _ascents_per_year(line_ids),
        "firstAscentsPerYear": _first_ascents_per_year(line_query) if show_first_ascents else None,
        "firstAscentsUndated": _undated_first_ascents(line_query) if show_first_ascents else None,
        "social": _social(object_type, entity),
        "childKind": child_kind,
        "children": children,
        "coverage": {
            "totalLines": total_lines,
            "projects": project_count,
            "distinctClimbers": None if object_type == "line" else distinct_climbers,
            "totalAscents": total_ascents,
        },
        "flash": {
            "count": flash_count,
            "percent": _percent(flash_count, total_ascents),
        },
        "consensus": {
            "softCount": soft_count,
            "hardCount": hard_count,
            "softPercent": _percent(soft_count, total_ascents),
            "hardPercent": _percent(hard_count, total_ascents),
        },
        "ratings": _ratings(line_ids),
        "disciplines": None if object_type == "line" else _disciplines(line_query),
        "popularLines": None if object_type == "line" else _popular_lines(line_ids),
        "gradeVotes": _grade_votes(entity) if object_type == "line" else None,
        "wishlist": _wishlist(object_type, line_ids),
        "myCompletion": None if object_type == "line" else _my_completion(line_ids, total_lines),
    }
    return payload


def _resolve_entity(object_type: str, slug: str | None):
    if object_type == "region":
        if slug is not None:
            raise NotFound()
        region = Region.return_it()
        if region is None:
            raise NotFound()
        return region

    model = _SCOPED_TYPES.get(object_type)
    if model is None or not slug:
        raise NotFound()
    return model.find_by_slug(slug)


def _climbable_lines(object_type: str, entity, *, projects: bool = False):
    """Lines in scope. Projects (author grade below 0) stay out of the line counts."""
    grade_filter = Line.author_grade_value < 0 if projects else Line.author_grade_value >= 0
    query = (
        db.session.query(Line)
        .join(Area, Line.area_id == Area.id)
        .join(Sector, Area.sector_id == Sector.id)
        .join(Crag, Sector.crag_id == Crag.id)
        .filter(Line.archived.is_(False), grade_filter)
    )
    if object_type == "crag":
        query = query.filter(Crag.id == entity.id)
    elif object_type == "sector":
        query = query.filter(Sector.id == entity.id)
    elif object_type == "area":
        query = query.filter(Area.id == entity.id)
    elif object_type == "line":
        query = query.filter(Line.id == entity.id)
    return SecretService.apply_line_filter(query)


def _ascent_totals(line_ids):
    flash_count = func.count(Ascent.id).filter(Ascent.flash.is_(True))
    soft_count = func.count(Ascent.id).filter(Ascent.soft.is_(True))
    hard_count = func.count(Ascent.id).filter(Ascent.hard.is_(True))
    row = (
        db.session.query(
            func.count(Ascent.id),
            flash_count,
            soft_count,
            hard_count,
            # Users who logged at least one ascent on these lines.
            func.count(func.distinct(Ascent.created_by_id)),
        )
        .filter(Ascent.line_id.in_(line_ids))
        .one()
    )
    return tuple(int(value or 0) for value in row)


def _heatmap(line_ids):
    """Count dated ascents by ISO week and weekday, summed across years.

    Keys are ``WW-D``: week ``01``–``53``, weekday ``1`` (Monday) through ``7`` (Sunday).
    """
    week = func.to_char(Ascent.date, "IW")
    weekday = func.to_char(Ascent.date, "ID")
    rows = (
        db.session.query(week, weekday, func.count(Ascent.id))
        .filter(Ascent.line_id.in_(line_ids), Ascent.date.isnot(None))
        .group_by(week, weekday)
        .all()
    )
    return {f"{int(week_no):02d}-{int(day)}": int(count) for week_no, day, count in rows if week_no and day}


def _ascents_per_year(line_ids):
    year_col = func.coalesce(Ascent.year, func.extract("year", Ascent.date))
    rows = (
        db.session.query(year_col, func.count(Ascent.id))
        .filter(Ascent.line_id.in_(line_ids), year_col.isnot(None))
        .group_by(year_col)
        .all()
    )
    return {str(int(year)): int(count) for year, count in rows if year is not None}


def _first_ascents_per_year(line_query):
    rows = (
        line_query.filter(Line.fa_year.isnot(None))
        .with_entities(Line.fa_year, func.count(Line.id))
        .group_by(Line.fa_year)
        .all()
    )
    return {str(int(year)): int(count) for year, count in rows if year is not None}


def _undated_first_ascents(line_query):
    """Climbable lines whose first ascent has neither a year nor a date."""
    return int(
        line_query.filter(Line.fa_year.is_(None), Line.fa_date.is_(None)).with_entities(func.count(Line.id)).scalar()
        or 0
    )


def _social(object_type: str, entity):
    comment_type = _COMMENT_TYPES[object_type]
    if object_type == "region":
        images = count_all_gallery_images()
    else:
        images = count_gallery_images(comment_type, entity.id)
    return {
        "comments": _comment_count(object_type, entity),
        "galleryImages": images,
    }


def _comment_count(object_type: str, entity) -> int:
    """Comments on this place and on every crag, sector, area, and line inside it.

    Replies count. Deleted comments do not. Secret spots stay out unless the caller can see them.
    """
    from models.comment import Comment

    clauses = [
        and_(
            Comment.object_type == _COMMENT_TYPES[object_type],
            Comment.object_id == entity.id,
        )
    ]
    for child_type, id_query in _descendant_id_queries(object_type, entity):
        clauses.append(and_(Comment.object_type == child_type, Comment.object_id.in_(id_query)))

    return int(
        db.session.query(func.count(Comment.id)).filter(Comment.is_deleted.is_(False), or_(*clauses)).scalar() or 0
    )


def _descendant_id_queries(object_type: str, entity):
    """Id queries for topo items under ``entity``. A line has none."""
    if object_type == "line":
        return

    yield "Line", SecretService.apply_line_filter(_scoped_lines(object_type, entity)).with_entities(Line.id)

    if object_type == "area":
        return

    yield (
        "Area",
        SecretService.apply_topo_entity_filter(_scoped_areas(object_type, entity), Area).with_entities(Area.id),
    )

    if object_type == "sector":
        return

    yield (
        "Sector",
        SecretService.apply_topo_entity_filter(_scoped_sectors(object_type, entity), Sector).with_entities(Sector.id),
    )

    if object_type == "crag":
        return

    yield "Crag", SecretService.apply_topo_entity_filter(db.session.query(Crag), Crag).with_entities(Crag.id)


def _scoped_lines(object_type: str, entity):
    query = (
        db.session.query(Line)
        .join(Area, Line.area_id == Area.id)
        .join(Sector, Area.sector_id == Sector.id)
        .join(Crag, Sector.crag_id == Crag.id)
    )
    return _limit_scope(query, object_type, entity)


def _scoped_areas(object_type: str, entity):
    query = db.session.query(Area).join(Sector, Area.sector_id == Sector.id).join(Crag, Sector.crag_id == Crag.id)
    return _limit_scope(query, object_type, entity)


def _scoped_sectors(object_type: str, entity):
    query = db.session.query(Sector).join(Crag, Sector.crag_id == Crag.id)
    return _limit_scope(query, object_type, entity)


def _limit_scope(query, object_type: str, entity):
    if object_type == "crag":
        return query.filter(Crag.id == entity.id)
    if object_type == "sector":
        return query.filter(Sector.id == entity.id)
    if object_type == "area":
        return query.filter(Area.id == entity.id)
    return query


def _children(object_type: str, line_query):
    if object_type == "region":
        id_col, name_col, slug_col, kind = Crag.id, Crag.name, Crag.slug, "crag"
    elif object_type == "crag":
        id_col, name_col, slug_col, kind = Sector.id, Sector.name, Sector.slug, "sector"
    elif object_type == "sector":
        id_col, name_col, slug_col, kind = Area.id, Area.name, Area.slug, "area"
    else:
        return None, None

    rows = (
        line_query.with_entities(name_col, slug_col, func.count(Line.id))
        .group_by(id_col, name_col, slug_col)
        .order_by(func.count(Line.id).desc(), name_col.asc())
        .all()
    )
    children = [{"name": name, "slug": slug, "lineCount": int(count)} for name, slug, count in rows if count]
    return kind, children


def _disciplines(line_query):
    rows = line_query.with_entities(Line.type, func.count(Line.id)).group_by(Line.type).all()
    counts = {line_type.value: 0 for line_type in LineTypeEnum}
    for line_type, count in rows:
        key = line_type.value if hasattr(line_type, "value") else str(line_type)
        counts[key] = int(count)
    return counts


def _line_identity_columns():
    return (
        Line.id,
        Line.name,
        Line.slug,
        Line.type,
        Line.grade_scale,
        Line.author_grade_value,
        Line.user_grade_value,
        Area.slug,
        Sector.slug,
        Crag.slug,
    )


def _line_payload(row, ascent_count, todo_count=None):
    line_type = row[3].value if hasattr(row[3], "value") else str(row[3])
    payload = {
        "name": row[1],
        "slug": row[2],
        "lineType": line_type,
        "gradeScale": row[4],
        "authorGradeValue": row[5],
        "userGradeValue": row[6],
        "areaSlug": row[7],
        "sectorSlug": row[8],
        "cragSlug": row[9],
        "ascentCount": int(ascent_count),
    }
    if todo_count is not None:
        payload["todoCount"] = int(todo_count)
    return payload


def _popular_lines(line_ids):
    ascent_count = func.count(Ascent.id)
    rows = (
        db.session.query(*_line_identity_columns(), ascent_count)
        .select_from(Line)
        .join(Area, Line.area_id == Area.id)
        .join(Sector, Area.sector_id == Sector.id)
        .join(Crag, Sector.crag_id == Crag.id)
        .outerjoin(Ascent, Ascent.line_id == Line.id)
        .filter(Line.id.in_(line_ids))
        .group_by(*_line_identity_columns())
        .having(ascent_count > 0)
        .order_by(ascent_count.desc(), Line.name.asc())
        .limit(_POPULAR_LIMIT)
        .all()
    )
    return [_line_payload(row, row[-1]) for row in rows]


def _wishlist(object_type: str, line_ids):
    todo_count = int(db.session.query(func.count(Todo.id)).filter(Todo.line_id.in_(line_ids)).scalar() or 0)
    if object_type == "line":
        return {"todoCount": todo_count, "wantedLines": []}

    todos = func.count(func.distinct(Todo.id))
    ascents = func.count(func.distinct(Ascent.id))
    rows = (
        db.session.query(*_line_identity_columns(), ascents, todos)
        .select_from(Line)
        .join(Area, Line.area_id == Area.id)
        .join(Sector, Area.sector_id == Sector.id)
        .join(Crag, Sector.crag_id == Crag.id)
        .join(Todo, Todo.line_id == Line.id)
        .outerjoin(Ascent, Ascent.line_id == Line.id)
        .filter(Line.id.in_(line_ids))
        .group_by(*_line_identity_columns())
        .order_by(todos.desc(), Line.name.asc())
        .limit(_WANTED_LIMIT)
        .all()
    )
    return {
        "todoCount": todo_count,
        "wantedLines": [_line_payload(row, row[-2], row[-1]) for row in rows],
    }


def _grade_votes(line: Line):
    rows = (
        db.session.query(Ascent.grade_value, func.count(Ascent.id))
        .filter(Ascent.line_id == line.id)
        .group_by(Ascent.grade_value)
        .all()
    )
    return {
        "gradeScale": line.grade_scale,
        "lineType": line.type.value if hasattr(line.type, "value") else str(line.type),
        "authorGradeValue": line.author_grade_value,
        "userGradeValue": line.user_grade_value,
        "votes": {str(int(grade)): int(count) for grade, count in rows},
    }


def _ratings(line_ids):
    rows = (
        db.session.query(Ascent.rating, func.count(Ascent.id))
        .filter(Ascent.line_id.in_(line_ids), Ascent.rating.isnot(None))
        .group_by(Ascent.rating)
        .all()
    )
    distribution = {str(star): 0 for star in range(1, 6)}
    rated = 0
    rating_sum = 0
    for rating, count in rows:
        if rating is None:
            continue
        count = int(count)
        rated += count
        rating_sum += int(rating) * count
        key = str(int(rating))
        if key in distribution:
            distribution[key] = count
    return {
        "average": round(rating_sum / rated, 1) if rated else None,
        "count": rated,
        "distribution": distribution,
    }


def _my_completion(line_ids, total_lines: int):
    user = get_current_user()
    if user is None:
        return None
    ascended = int(
        db.session.query(func.count(func.distinct(Ascent.line_id)))
        .filter(Ascent.created_by_id == user.id, Ascent.line_id.in_(line_ids))
        .scalar()
        or 0
    )
    return {"ascended": ascended, "total": total_lines}


def _percent(part: int, whole: int) -> int:
    if not whole:
        return 0
    return int(round(100 * part / whole))
