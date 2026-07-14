"""Batch line and ascent counts for topo hierarchy list endpoints.

Crag, sector, and area models expose ``line_count`` and ``ascent_count`` as hybrid
properties that run a COUNT query per instance. List endpoints (e.g. ``GetCrags``)
would otherwise trigger 2N extra queries during Marshmallow serialization.

Call the ``attach_*_counts`` helpers on the result set **before** dumping the schema.
Each helper runs at most two grouped queries and writes counts onto instances via
``util.entity_count_cache``; the hybrid property getters prefer those cached values
when present.

Counts respect secret-spot visibility via :meth:`SecretService.apply_line_filter`,
matching the behavior of the uncached hybrid properties.

Typical usage::

    crags = Crag.return_all(...)
    attach_crag_counts(crags)
    return crags_schema.dump(crags)
"""

from sqlalchemy import func

from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.line import Line
from models.sector import Sector
from util.entity_count_cache import (
    _ASCENT_COUNT_CACHE,
    _LINE_ASCENT_COUNT_CACHE,
    _LINE_COUNT_CACHE,
)
from util.secret_service import SecretService


def _attach_counts(entities, line_rows, ascent_rows) -> None:
    """Write grouped count query results onto ``entities`` as instance caches."""
    line_counts = {parent_id: count for parent_id, count in line_rows}
    ascent_counts = {parent_id: count for parent_id, count in ascent_rows}
    for entity in entities:
        entity_id = entity.id
        object.__setattr__(entity, _LINE_COUNT_CACHE, line_counts.get(entity_id, 0))
        object.__setattr__(entity, _ASCENT_COUNT_CACHE, ascent_counts.get(entity_id, 0))


def attach_crag_counts(crags) -> None:
    """Prefetch ``line_count`` and ``ascent_count`` for a list of crags (2 queries)."""
    if not crags:
        return

    crag_ids = [crag.id for crag in crags]

    line_query = (
        db.session.query(Sector.crag_id, func.count(Line.id))
        .select_from(Line)
        .join(Area, Line.area_id == Area.id)
        .join(Sector, Area.sector_id == Sector.id)
        .filter(Sector.crag_id.in_(crag_ids))
        .group_by(Sector.crag_id)
    )
    line_query = SecretService.apply_line_filter(line_query)

    ascent_query = (
        db.session.query(Sector.crag_id, func.count(Ascent.id))
        .select_from(Ascent)
        .join(Line, Ascent.line_id == Line.id)
        .join(Area, Line.area_id == Area.id)
        .join(Sector, Area.sector_id == Sector.id)
        .filter(Sector.crag_id.in_(crag_ids))
        .group_by(Sector.crag_id)
    )
    ascent_query = SecretService.apply_line_filter(ascent_query)

    _attach_counts(crags, line_query.all(), ascent_query.all())


def attach_sector_counts(sectors) -> None:
    """Prefetch ``line_count`` and ``ascent_count`` for a list of sectors (2 queries)."""
    if not sectors:
        return

    sector_ids = [sector.id for sector in sectors]

    line_query = (
        db.session.query(Area.sector_id, func.count(Line.id))
        .select_from(Line)
        .join(Area, Line.area_id == Area.id)
        .filter(Area.sector_id.in_(sector_ids))
        .group_by(Area.sector_id)
    )
    line_query = SecretService.apply_line_filter(line_query)

    ascent_query = (
        db.session.query(Area.sector_id, func.count(Ascent.id))
        .select_from(Ascent)
        .join(Line, Ascent.line_id == Line.id)
        .join(Area, Line.area_id == Area.id)
        .filter(Area.sector_id.in_(sector_ids))
        .group_by(Area.sector_id)
    )
    ascent_query = SecretService.apply_line_filter(ascent_query)

    _attach_counts(sectors, line_query.all(), ascent_query.all())


def attach_area_counts(areas) -> None:
    """Prefetch ``line_count`` and ``ascent_count`` for a list of areas (2 queries)."""
    if not areas:
        return

    area_ids = [area.id for area in areas]

    line_query = (
        db.session.query(Line.area_id, func.count(Line.id)).filter(Line.area_id.in_(area_ids)).group_by(Line.area_id)
    )
    line_query = SecretService.apply_line_filter(line_query)

    ascent_query = (
        db.session.query(Line.area_id, func.count(Ascent.id))
        .select_from(Ascent)
        .join(Line, Ascent.line_id == Line.id)
        .filter(Line.area_id.in_(area_ids))
        .group_by(Line.area_id)
    )
    ascent_query = SecretService.apply_line_filter(ascent_query)

    _attach_counts(areas, line_query.all(), ascent_query.all())


def attach_line_ascent_counts(lines) -> None:
    """Prefetch ``ascent_count`` for a list of lines (1 query).

    Used by paginated ``GetLines`` where each row exposes ``ascentCount`` in the schema.
    """
    if not lines:
        return

    line_ids = [line.id for line in lines]
    rows = (
        db.session.query(Ascent.line_id, func.count(Ascent.id))
        .filter(Ascent.line_id.in_(line_ids))
        .group_by(Ascent.line_id)
        .all()
    )
    counts = {line_id: count for line_id, count in rows}
    for line in lines:
        object.__setattr__(line, _LINE_ASCENT_COUNT_CACHE, counts.get(line.id, 0))
