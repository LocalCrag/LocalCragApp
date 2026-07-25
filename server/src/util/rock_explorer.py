from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum


def apply_rock_explorer_metadata(entity, data: dict) -> None:
    """Copy shared rock-explorer metadata fields from parsed request data onto an entity."""
    if "title" in data:
        title = data["title"]
        entity.title = title.strip() if isinstance(title, str) and title.strip() else None
    if "description" in data:
        description = data["description"]
        entity.description = description if description not in (None, "") else None
    if "potential" in data:
        entity.potential = RockExplorerPotentialEnum(data["potential"]) if data["potential"] else None
    if "rockQuality" in data:
        entity.rock_quality = RockExplorerRockQualityEnum(data["rockQuality"]) if data["rockQuality"] else None
    if "rockType" in data:
        entity.rock_type = RockExplorerRockTypeEnum(data["rockType"]) if data["rockType"] else None
    if "gradeLineType" in data:
        entity.grade_line_type = LineTypeEnum(data["gradeLineType"]) if data["gradeLineType"] else None
    if "gradeScale" in data:
        entity.grade_scale = data["gradeScale"] or None
    if "gradeValueMin" in data:
        entity.grade_value_min = data["gradeValueMin"]
    if "gradeValueMax" in data:
        entity.grade_value_max = data["gradeValueMax"]
    if "accessIssues" in data:
        entity.access_issues = list(data["accessIssues"] or [])
    if "cragId" in data:
        entity.crag_id = data["cragId"]
    if "sectorId" in data:
        entity.sector_id = data["sectorId"]
    if "areaId" in data:
        entity.area_id = data["areaId"]
    if "lineId" in data:
        entity.line_id = data["lineId"]


def rock_explorer_gallery_image_ids_subquery():
    """Gallery image IDs carrying at least one rock explorer tag (member-only content)."""
    from sqlalchemy import select

    from models.gallery_image import gallery_image_tags
    from models.tag import Tag
    from util.generic_relationships import ROCK_EXPLORER_OBJECT_TYPES

    return (
        select(gallery_image_tags.c.gallery_image_id)
        .join(Tag, gallery_image_tags.c.tag_id == Tag.id)
        .filter(Tag.object_type.in_(ROCK_EXPLORER_OBJECT_TYPES))
    )
