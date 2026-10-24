import json

from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage
from util.suggestions import delete_line_paths, notify_suggestion_author

REJECTED_BECAUSE_ARCHIVED = "suggestionReview.dialog.rejectedBecauseArchived"
REJECTED_BECAUSE_TOPO_IMAGE_ARCHIVED = "suggestionReview.dialog.rejectedBecauseTopoImageArchived"


def archive_rejection_message(name: str | None) -> str:
    """Store a translation key. The client renders it in the reader's language."""
    cleaned = (name or "").strip()
    if cleaned:
        payload = {"key": REJECTED_BECAUSE_ARCHIVED, "name": cleaned}
    else:
        payload = {"key": REJECTED_BECAUSE_TOPO_IMAGE_ARCHIVED}
    return json.dumps(payload, ensure_ascii=False)


def reject_draft_for_archive(entity, actor, archived_name: str):
    """Reject a draft instead of archiving it, and tell the author why."""
    if entity.publication_status != PublicationStatusEnum.DRAFT:
        return
    message = archive_rejection_message(archived_name)
    if isinstance(entity, TopoImage):
        notify_suggestion_author(
            entity,
            actor,
            NotificationTypeEnum.SUGGESTION_REJECTED,
            message,
            "topo_image",
            entity.id,
        )
        delete_line_paths(entity)
    else:
        notify_suggestion_author(
            entity,
            actor,
            NotificationTypeEnum.SUGGESTION_REJECTED,
            message,
            "line",
            entity.id,
        )
    entity.publication_status = PublicationStatusEnum.REJECTED
    db.session.add(entity)


def _archive_published(entity):
    if entity.publication_status == PublicationStatusEnum.PUBLISHED:
        entity.publication_status = PublicationStatusEnum.ARCHIVED
        db.session.add(entity)


def _restore_archived(entity):
    if entity.publication_status == PublicationStatusEnum.ARCHIVED:
        entity.publication_status = PublicationStatusEnum.PUBLISHED
        db.session.add(entity)


def cascade_topo_image_archived(topo_image: TopoImage, actor):
    lines = Line.query.join(Line.line_paths).filter_by(topo_image_id=topo_image.id).all()
    reason = (topo_image.title or "").strip() or None
    archiving = topo_image.publication_status == PublicationStatusEnum.ARCHIVED
    for line in lines:
        if archiving:
            if line.publication_status == PublicationStatusEnum.DRAFT:
                reject_draft_for_archive(line, actor, reason)
            else:
                _archive_published(line)
        else:
            _restore_archived(line)


def set_area_archived(area: Area, actor, reason_name: str, value: bool):
    if value:
        _archive_published(area)
        for line in Line.query.filter_by(area_id=area.id).all():
            if line.publication_status == PublicationStatusEnum.DRAFT:
                reject_draft_for_archive(line, actor, reason_name)
            else:
                _archive_published(line)
        for topo_image in TopoImage.query.filter_by(area_id=area.id).all():
            if topo_image.publication_status == PublicationStatusEnum.DRAFT:
                reject_draft_for_archive(topo_image, actor, reason_name)
            else:
                _archive_published(topo_image)
        return

    _restore_archived(area)
    for line in Line.query.filter_by(area_id=area.id, publication_status=PublicationStatusEnum.ARCHIVED).all():
        _restore_archived(line)
    for topo_image in TopoImage.query.filter_by(
        area_id=area.id, publication_status=PublicationStatusEnum.ARCHIVED
    ).all():
        _restore_archived(topo_image)


def set_crag_archived(crag: Crag, actor, value: bool):
    if value:
        _archive_published(crag)
    else:
        _restore_archived(crag)
    for sector in Sector.query.filter_by(crag_id=crag.id).all():
        set_sector_archived(sector, actor, value, crag.name if value else None)


def set_sector_archived(sector: Sector, actor, value: bool, reason_name: str | None = None):
    if value:
        _archive_published(sector)
        name = reason_name or sector.name
    else:
        _restore_archived(sector)
        name = sector.name
    for area in Area.query.filter_by(sector_id=sector.id).all():
        set_area_archived(area, actor, name, value)
