"""Hierarchical scope resolution for moderator tasks.

Shared by the task list endpoint and open-task tab counts so both stay aligned.
"""

from sqlalchemy import and_, or_, select

from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.moderator_task import ModeratorTask
from models.region import Region
from models.sector import Sector

HIERARCHY_TYPES = {"Region", "Crag", "Sector", "Area", "Line"}


def scope_pairs_for_crag(crag_id):
    pairs = [("Crag", crag_id)]
    sector_rows = db.session.execute(select(Sector.id).where(Sector.crag_id == crag_id)).all()
    sector_ids = [row[0] for row in sector_rows]
    for sector_id in sector_ids:
        pairs.append(("Sector", sector_id))
    if sector_ids:
        area_rows = db.session.execute(select(Area.id).where(Area.sector_id.in_(sector_ids))).all()
        area_ids = [row[0] for row in area_rows]
        for area_id in area_ids:
            pairs.append(("Area", area_id))
        if area_ids:
            line_rows = db.session.execute(select(Line.id).where(Line.area_id.in_(area_ids))).all()
            for (line_id,) in line_rows:
                pairs.append(("Line", line_id))
    return pairs


def scope_pairs_for_sector(sector_id):
    pairs = [("Sector", sector_id)]
    area_rows = db.session.execute(select(Area.id).where(Area.sector_id == sector_id)).all()
    area_ids = [row[0] for row in area_rows]
    for area_id in area_ids:
        pairs.append(("Area", area_id))
    if area_ids:
        line_rows = db.session.execute(select(Line.id).where(Line.area_id.in_(area_ids))).all()
        for (line_id,) in line_rows:
            pairs.append(("Line", line_id))
    return pairs


def scope_pairs_for_area(area_id):
    pairs = [("Area", area_id)]
    line_rows = db.session.execute(select(Line.id).where(Line.area_id == area_id)).all()
    for (line_id,) in line_rows:
        pairs.append(("Line", line_id))
    return pairs


def get_scope_pairs(scope_type: str, scope_id):
    if scope_type == "Region":
        region = Region.find_by_id(scope_id)
        pairs = [("Region", region.id)]
        crag_rows = db.session.execute(select(Crag.id)).all()
        for (crag_id,) in crag_rows:
            pairs.extend(scope_pairs_for_crag(crag_id))
        return pairs
    if scope_type == "Crag":
        return scope_pairs_for_crag(scope_id)
    if scope_type == "Sector":
        return scope_pairs_for_sector(scope_id)
    if scope_type == "Area":
        return scope_pairs_for_area(scope_id)
    if scope_type == "Line":
        return [("Line", scope_id)]
    raise ValueError(f"Unsupported scope type: {scope_type}")


def filter_tasks_by_scope(query, scope_type: str, scope_id):
    pairs = get_scope_pairs(scope_type, scope_id)
    if not pairs:
        return query.filter(False)
    conditions = [
        and_(ModeratorTask.object_type == object_type, ModeratorTask.object_id == object_id)
        for object_type, object_id in pairs
    ]
    return query.filter(or_(*conditions))


def count_open_moderator_tasks(scope_type: str, scope_id) -> int:
    """Count incomplete tasks in the same hierarchical scope as the task list."""
    query = ModeratorTask.query.filter(ModeratorTask.completed.is_(False))
    query = filter_tasks_by_scope(query, scope_type, scope_id)
    return int(query.count() or 0)
