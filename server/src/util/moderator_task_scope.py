"""
Hierarchical scope for listing moderator tasks (GET /api/moderator-tasks).

Each task is stored on exactly one topo node via ``object_type`` + ``object_id``
(Region, Crag, Sector, Area, or Line). The Tasks tab at a given level shows that
node's tasks plus every task on nodes **below** it in the hierarchy—not on parents
or siblings.

Topology::

    Region
      └── Crag
            └── Sector
                  └── Area
                        └── Line

Inclusion by list scope (what ``get_scope_pairs`` returns):

+----------------+----------------------------------------------------------+
| scope_type     | Included nodes                                           |
+================+==========================================================+
| Line           | that Line only                                           |
+----------------+----------------------------------------------------------+
| Area           | Area + Lines in the Area                                 |
+----------------+----------------------------------------------------------+
| Sector         | Sector + child Areas + their Lines                       |
+----------------+----------------------------------------------------------+
| Crag           | Crag + child Sectors, Areas, and Lines                   |
+----------------+----------------------------------------------------------+
| Region         | Region + every Crag and full subtree under each Crag     |
+----------------+----------------------------------------------------------+

Example: a task attached to a Sector appears when listing at Region, Crag, or that
Sector, but not when listing at a sibling Sector or at an Area/Line unless the
task's ``object_type`` is that Area or Line.

The API resolves scope from query params in ``moderator_task_resources``; the client
builds the same params via ``buildModeratorTaskScopeQuery`` (moderator-task-target.ts).
"""

from sqlalchemy import and_, or_, select

from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.moderator_task import ModeratorTask
from models.region import Region
from models.sector import Sector


def _scope_pairs_for_crag(crag_id):
    """(object_type, object_id) pairs for a Crag and its full descendant subtree."""
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


def _scope_pairs_for_sector(sector_id):
    """(object_type, object_id) pairs for a Sector and its Areas and Lines."""
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


def _scope_pairs_for_area(area_id):
    """(object_type, object_id) pairs for an Area and its Lines."""
    pairs = [("Area", area_id)]
    line_rows = db.session.execute(select(Line.id).where(Line.area_id == area_id)).all()
    for (line_id,) in line_rows:
        pairs.append(("Line", line_id))
    return pairs


def get_scope_pairs(scope_type: str, scope_id):
    """
    Return all (object_type, object_id) pairs visible at the given list scope.

    Args:
        scope_type: One of Region, Crag, Sector, Area, Line.
        scope_id: Primary key of the scoped topo node.

    Raises:
        ValueError: If scope_type is not supported.
    """
    if scope_type == "Region":
        region = Region.find_by_id(scope_id)
        pairs = [("Region", region.id)]
        crag_rows = db.session.execute(select(Crag.id)).all()
        for (crag_id,) in crag_rows:
            pairs.extend(_scope_pairs_for_crag(crag_id))
        return pairs
    if scope_type == "Crag":
        return _scope_pairs_for_crag(scope_id)
    if scope_type == "Sector":
        return _scope_pairs_for_sector(scope_id)
    if scope_type == "Area":
        return _scope_pairs_for_area(scope_id)
    if scope_type == "Line":
        return [("Line", scope_id)]
    raise ValueError(f"Unsupported scope type: {scope_type}")


def filter_tasks_by_scope(query, scope_type: str, scope_id):
    """
    Restrict a ModeratorTask query to tasks whose anchor lies in the scope subtree.

    Tasks match when ``(object_type, object_id)`` is one of the pairs from
    ``get_scope_pairs``. Returns an empty result set when no pairs exist.
    """
    pairs = get_scope_pairs(scope_type, scope_id)
    if not pairs:
        return query.filter(False)
    conditions = [
        and_(ModeratorTask.object_type == object_type, ModeratorTask.object_id == object_id)
        for object_type, object_id in pairs
    ]
    return query.filter(or_(*conditions))
