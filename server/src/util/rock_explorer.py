import copy
import datetime

import pytz

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_feature_status_enum import RockExplorerFeatureStatusEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from models.gallery_image import GalleryImage
from models.rock_explorer_feature import RockExplorerFeature
from models.tag import Tag
from util.tags import set_tags

TOPO_LINK_OBJECT_TYPES = {"Line", "Area", "Sector", "Crag"}


def assert_can_view_feature(feature, user) -> None:
    """Published: any member (caller already member-gated). Draft: owner only."""
    if feature.status != RockExplorerFeatureStatusEnum.DRAFT:
        return
    if feature.created_by_id != user.id:
        raise Unauthorized("Only the creator can view this draft.")


def assert_draft_mutable(feature, user, device_id: str | None) -> None:
    """No-op for published. Draft: owner + matching recordingDeviceId required."""
    if feature.status != RockExplorerFeatureStatusEnum.DRAFT:
        return
    if feature.created_by_id != user.id:
        raise Unauthorized("Only the creator can modify this draft.")
    if device_id is None or str(device_id).strip() == "":
        raise BadRequest("recordingDeviceId is required to modify a draft.")
    if feature.recording_device_id != device_id:
        raise Conflict("Draft is locked by another device. Clone to continue.")


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
        entity.recording_updated_at = None
    else:
        # Preserve existing device lock on update; only set from payload when unset (create).
        if entity.recording_device_id is None:
            entity.recording_device_id = data.get("recordingDeviceId")
        entity.recording_updated_at = datetime.datetime.now(pytz.utc)

    set_tags(
        entity,
        data["topoLinks"] or [],
        attribute="topo_links",
        allowed_types=TOPO_LINK_OBJECT_TYPES,
    )


def rock_explorer_gallery_image_ids_subquery():
    """Gallery image IDs carrying at least one rock explorer tag.

    Used to keep rock explorer images out of the region gallery and other
    non–rock-explorer listings while still allowing feature-tagged listings.
    """
    from sqlalchemy import select

    from models.gallery_image import gallery_image_tags

    return (
        select(gallery_image_tags.c.gallery_image_id)
        .join(Tag, gallery_image_tags.c.tag_id == Tag.id)
        .filter(Tag.object_type == "RockExplorerFeature")
    )


def clone_rock_explorer_feature(
    source: RockExplorerFeature,
    user,
    recording_device_id: str,
) -> RockExplorerFeature:
    """
    Deep-copy a draft for multi-device continue.

    Creates a new draft with the cloning device's lock and duplicates gallery
    associations via a new Tag linked to the same GalleryImage rows.
    Does not clone comments or File/GalleryImage binary rows.
    Helper adds/flushes; caller commits.
    """
    if source.created_by_id != user.id:
        raise Unauthorized("Only the creator can clone this draft.")
    if source.status != RockExplorerFeatureStatusEnum.DRAFT:
        raise BadRequest("Only drafts can be cloned.")
    if recording_device_id is None or str(recording_device_id).strip() == "":
        raise BadRequest("recordingDeviceId is required to clone a draft.")

    clone = RockExplorerFeature()
    clone.title = source.title
    clone.description = source.description
    clone.potential = source.potential
    clone.rock_quality = source.rock_quality
    clone.rock_type = source.rock_type
    clone.grade_line_type = source.grade_line_type
    clone.grade_scale = source.grade_scale
    clone.grade_value_min = source.grade_value_min
    clone.grade_value_max = source.grade_value_max
    clone.access_issues = copy.deepcopy(source.access_issues or [])
    clone.geometry = copy.deepcopy(source.geometry) if source.geometry is not None else None
    clone.parking_sites = copy.deepcopy(source.parking_sites or [])
    clone.paths = copy.deepcopy(source.paths or [])
    clone.status = RockExplorerFeatureStatusEnum.DRAFT
    clone.recording_device_id = recording_device_id
    clone.recording_updated_at = datetime.datetime.now(pytz.utc)
    clone.created_by_id = user.id

    db.session.add(clone)
    db.session.flush()

    topo_link_data = [{"objectType": tag.object_type, "objectId": tag.object_id} for tag in (source.topo_links or [])]
    set_tags(
        clone,
        topo_link_data,
        attribute="topo_links",
        allowed_types=TOPO_LINK_OBJECT_TYPES,
    )

    # Duplicate gallery associations: new Tag for clone, keep source Tag intact.
    clone_tag = Tag(object_type="RockExplorerFeature", object_id=clone.id)
    db.session.add(clone_tag)
    db.session.flush()

    source_tag = Tag.query.filter_by(object_type="RockExplorerFeature", object_id=source.id).first()
    if source_tag:
        images = GalleryImage.query.filter(GalleryImage.tags.any(Tag.id == source_tag.id)).all()
        for image in images:
            image.tags = list(image.tags) + [clone_tag]

    db.session.flush()
    return clone
