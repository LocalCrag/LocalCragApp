"""Draft line and topo-image suggestions."""

from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload, selectinload

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.line_path_schema import LinePathSchemaForLines
from marshmallow_schemas.topo_image_schema import topo_image_schema
from messages.messages import ResponseMessage
from models.area import Area
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.permission_effect_enum import PermissionEffectEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.line_path import LinePath
from models.permission import SUGGESTION_CREATE, Permission
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from util.auth_session import get_current_user, verify_session_in_request
from util.moderator_task_notifications import moderator_recipient_ids_excluding
from util.notifications import create_notification_for_user


def optional_request_user():
    if not verify_session_in_request(optional=True):
        return None
    return get_current_user()


def suggestions_enabled(user) -> bool:
    if user is None:
        return False
    if user.moderator:
        return True
    return Permission.global_deny(user.id, SUGGESTION_CREATE) is None


def can_suggest(user) -> bool:
    if user is None or user.moderator:
        return False
    settings = InstanceSettings.return_it()
    if settings is None or not settings.suggestions_enabled:
        return False
    return suggestions_enabled(user)


def require_suggest_or_moderator(user):
    if user is not None and (user.moderator or can_suggest(user)):
        return
    raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)


def assert_ancestors_not_archived(area: Area):
    """Refuse a new or newly published line or image under an archived area, sector, or crag."""
    if area is None:
        return
    sector = area.sector
    crag = sector.crag if sector is not None else None
    if any(
        entity is not None and entity.publication_status == PublicationStatusEnum.ARCHIVED
        for entity in (area, sector, crag)
    ):
        raise BadRequest("Cannot create or publish while the area, sector, or crag is archived.")


def _owns_publication(created_by_id, user) -> bool:
    return user is not None and created_by_id is not None and created_by_id == user.id


def can_view_publication(entity, user) -> bool:
    """Published and archived content is public. Drafts are visible to their creator and to moderators.

    Rejected content is hidden.
    """
    status = entity.publication_status
    if status in (PublicationStatusEnum.PUBLISHED, PublicationStatusEnum.ARCHIVED):
        return True
    if status == PublicationStatusEnum.DRAFT:
        if user is not None and user.moderator:
            return True
        return _owns_publication(entity.created_by_id, user)
    return False


def assert_can_view_publication(entity, user=None):
    if user is None:
        user = optional_request_user()
    if not can_view_publication(entity, user):
        raise NotFound()


def can_edit_publication(user, entity) -> bool:
    """Moderators edit published content. A draft can be edited only by the user who created it."""
    if user is None:
        return False
    if entity.publication_status == PublicationStatusEnum.DRAFT:
        return _owns_publication(entity.created_by_id, user)
    return bool(user.moderator)


def assert_can_delete_publication(user, entity):
    """Owners may delete their drafts. Moderators may delete published content, not someone else's draft."""
    if not can_edit_publication(user, entity):
        raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
    if entity.publication_status == PublicationStatusEnum.DRAFT and not _owns_publication(entity.created_by_id, user):
        raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)


def publication_visibility_clause(model, user):
    """List filter matching ``can_view_publication``. Rejected rows are excluded for every viewer."""
    published = model.publication_status == PublicationStatusEnum.PUBLISHED
    draft = model.publication_status == PublicationStatusEnum.DRAFT
    if user is None:
        return published
    if user.moderator:
        return or_(published, draft)
    own_draft = and_(draft, model.created_by_id == user.id)
    return or_(published, own_draft)


def published_clause(model):
    return model.publication_status == PublicationStatusEnum.PUBLISHED


def line_payload_visible(line_payload, user) -> bool:
    if not line_payload:
        return False
    status = line_payload.get("publicationStatus", PublicationStatusEnum.PUBLISHED.value)
    if status in (PublicationStatusEnum.PUBLISHED.value, PublicationStatusEnum.ARCHIVED.value):
        return True
    if user is None:
        return False
    if status == PublicationStatusEnum.DRAFT.value:
        if user.moderator:
            return True
        return line_payload.get("createdById") == str(user.id)
    return False


def line_path_listed(image_status, line_payload, user) -> bool:
    """Archived lines stay hidden on a published image and show on an archived image."""
    if not line_payload_visible(line_payload, user):
        return False
    line_status = line_payload.get("publicationStatus", PublicationStatusEnum.PUBLISHED.value)
    if line_status != PublicationStatusEnum.ARCHIVED.value:
        return True
    return image_status == PublicationStatusEnum.ARCHIVED.value


def clean_review_message(message):
    if message is None:
        return None
    text = str(message).strip()
    return text or None


def notify_moderators_of_submission(actor: User, entity_type: str, entity_id):
    for user_id in moderator_recipient_ids_excluding({actor.id}):
        db.session.add(
            create_notification_for_user(
                user_id,
                NotificationTypeEnum.SUGGESTION_SUBMITTED,
                actor_id=actor.id,
                entity_type=entity_type,
                entity_id=entity_id,
            )
        )


def published_suggestion_link(entity_type, entity_id) -> str | None:
    """Frontend path of a line or topo image that is still published."""
    if entity_type == "line":
        line = Line.query.filter_by(id=entity_id).first()
        area = line.area if line is not None else None
        if line is None or line.publication_status != PublicationStatusEnum.PUBLISHED:
            return None
        if area is None or area.sector is None or area.sector.crag is None:
            return None
        return f"/topo/{area.sector.crag.slug}/{area.sector.slug}/{area.slug}/{line.slug}"
    if entity_type == "topo_image":
        image = TopoImage.query.filter_by(id=entity_id).first()
        area = image.area if image is not None else None
        if image is None or image.publication_status != PublicationStatusEnum.PUBLISHED:
            return None
        if area is None or area.sector is None or area.sector.crag is None:
            return None
        return f"/topo/{area.sector.crag.slug}/{area.sector.slug}/{area.slug}/topo-images#{image.id}"
    return None


def _area_names(area: Area) -> dict:
    return {
        "cragName": area.sector.crag.name,
        "sectorName": area.sector.name,
        "areaName": area.name,
    }


def suggestion_review_subject(entity_type, entity_id):
    """Line or topo image payload rendered in an acceptance or rejection dialog."""
    if entity_type == "line" and entity_id:
        line = (
            Line.query.filter_by(id=entity_id)
            .options(
                joinedload(Line.area).joinedload(Area.sector).joinedload(Sector.crag),
                selectinload(Line.line_paths).joinedload(LinePath.topo_image).joinedload(TopoImage.file),
                selectinload(Line.line_paths).joinedload(LinePath.topo_image).selectinload(TopoImage.map_markers),
            )
            .first()
        )
        if line is None or line.area is None:
            return None
        return {
            "kind": "line",
            "name": line.name,
            "color": line.color,
            **_area_names(line.area),
            "linePaths": LinePathSchemaForLines(many=True).dump(line.line_paths),
        }
    if entity_type == "topo_image" and entity_id:
        image = (
            TopoImage.query.filter_by(id=entity_id)
            .options(
                joinedload(TopoImage.area).joinedload(Area.sector).joinedload(Sector.crag),
                joinedload(TopoImage.file),
                selectinload(TopoImage.map_markers),
            )
            .first()
        )
        if image is None or image.area is None:
            return None
        dumped = topo_image_schema.dump(image)
        dumped["linePaths"] = []
        dumped["tabuAreas"] = []
        return {
            "kind": "topoImage",
            "title": image.title,
            **_area_names(image.area),
            "image": dumped,
        }
    return None


def notify_suggestion_author(
    entity, actor: User, notification_type: NotificationTypeEnum, message, entity_type, entity_id
):
    if entity.created_by_id is None or entity.created_by_id == actor.id:
        return
    db.session.add(
        create_notification_for_user(
            entity.created_by_id,
            notification_type,
            actor_id=actor.id,
            entity_type=entity_type,
            entity_id=entity_id,
            message=message,
        )
    )


def set_suggestions_enabled(user: User, enabled: bool):
    existing = Permission.global_deny(user.id, SUGGESTION_CREATE)
    if enabled:
        if existing is not None:
            db.session.delete(existing)
        return
    if existing is None:
        permission = Permission()
        permission.user_id = user.id
        permission.key = SUGGESTION_CREATE
        permission.effect = PermissionEffectEnum.DENY
        db.session.add(permission)


def delete_line_paths(image):
    """Removes drawings on a topo image and leaves the image itself."""
    from sqlalchemy.orm.attributes import set_committed_value

    for line_path in list(image.line_paths):
        db.session.delete(line_path)
    db.session.flush()
    set_committed_value(image, "line_paths", [])


def delete_topo_image(image):
    """Deletes a topo image together with the line paths drawn on it."""
    from sqlalchemy.orm.attributes import set_committed_value

    delete_line_paths(image)
    for marker in list(image.map_markers):
        db.session.delete(marker)
    db.session.flush()
    set_committed_value(image, "map_markers", [])
    db.session.delete(image)
