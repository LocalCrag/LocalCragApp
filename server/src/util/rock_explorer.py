import datetime

import pytz

from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_feature_status_enum import RockExplorerFeatureStatusEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_recording_state_enum import (
    RockExplorerRecordingStateEnum,
)
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from util.tags import set_tags

TOPO_LINK_OBJECT_TYPES = {"Line", "Area", "Sector", "Crag"}


def apply_rock_explorer_metadata(entity, data: dict) -> None:
    """Copy rock-explorer metadata from a fully webargs-validated create/update payload."""
    title = data["title"]
    entity.title = title.strip() if isinstance(title, str) and title.strip() else None
    description = data["description"]
    entity.description = description if description not in (None, "") else None
    entity.status = RockExplorerFeatureStatusEnum(data.get("status") or "published")
    entity.potential = RockExplorerPotentialEnum(data["potential"]) if data.get("potential") else None
    entity.rock_quality = RockExplorerRockQualityEnum(data["rockQuality"]) if data["rockQuality"] else None
    entity.rock_type = RockExplorerRockTypeEnum(data["rockType"]) if data["rockType"] else None
    entity.grade_line_type = LineTypeEnum(data["gradeLineType"]) if data["gradeLineType"] else None
    entity.grade_scale = data["gradeScale"] or None
    entity.grade_value_min = data["gradeValueMin"]
    entity.grade_value_max = data["gradeValueMax"]
    entity.access_issues = list(data["accessIssues"] or [])
    entity.parking_sites = list(data["parkingSites"] or [])
    entity.paths = list(data["paths"] or [])

    if entity.status == RockExplorerFeatureStatusEnum.PUBLISHED:
        entity.recording_device_id = None
        entity.recording_state = None
        entity.recording_updated_at = None
    else:
        entity.recording_device_id = data.get("recordingDeviceId")
        entity.recording_state = (
            RockExplorerRecordingStateEnum(data["recordingState"]) if data.get("recordingState") else None
        )
        entity.recording_updated_at = datetime.datetime.now(pytz.utc)

    set_tags(
        entity,
        data["topoLinks"] or [],
        attribute="topo_links",
        allowed_types=TOPO_LINK_OBJECT_TYPES,
    )


def rock_explorer_gallery_image_ids_subquery():
    """Gallery image IDs carrying at least one rock explorer tag (member-only content)."""
    from sqlalchemy import select

    from models.gallery_image import gallery_image_tags
    from models.tag import Tag

    return (
        select(gallery_image_tags.c.gallery_image_id)
        .join(Tag, gallery_image_tags.c.tag_id == Tag.id)
        .filter(Tag.object_type == "RockExplorerFeature")
    )
