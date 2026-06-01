from models.area import Area
from models.crag import Crag
from models.line import Line
from models.moderator_task import ModeratorTask
from models.region import Region
from models.sector import Sector


def moderator_task_list_link(task: ModeratorTask) -> str:
    target = task.object
    if task.object_type == "Region" and isinstance(target, Region):
        return "/topo/moderator-tasks"
    if task.object_type == "Crag" and isinstance(target, Crag):
        return f"/topo/{target.slug}/moderator-tasks"
    if task.object_type == "Sector" and isinstance(target, Sector):
        return f"/topo/{target.crag.slug}/{target.slug}/moderator-tasks"
    if task.object_type == "Area" and isinstance(target, Area):
        sector = target.sector
        return f"/topo/{sector.crag.slug}/{sector.slug}/{target.slug}/moderator-tasks"
    if task.object_type == "Line" and isinstance(target, Line):
        area = target.area
        sector = area.sector
        return f"/topo/{sector.crag.slug}/{sector.slug}/{area.slug}/{target.slug}/moderator-tasks"
    return "/topo/moderator-tasks"


def moderator_task_target_label(task: ModeratorTask) -> str:
    target = task.object
    if task.object_type == "Region" and isinstance(target, Region):
        return target.name
    if task.object_type == "Crag" and isinstance(target, Crag):
        return target.name
    if task.object_type == "Sector" and isinstance(target, Sector):
        return f"{target.crag.name} › {target.name}"
    if task.object_type == "Area" and isinstance(target, Area):
        sector = target.sector
        return f"{sector.crag.name} › {sector.name} › {target.name}"
    if task.object_type == "Line" and isinstance(target, Line):
        area = target.area
        sector = area.sector
        return f"{sector.crag.name} › {sector.name} › {area.name} › {target.name}"
    return task.object_type
