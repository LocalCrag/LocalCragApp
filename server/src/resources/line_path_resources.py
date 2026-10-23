from typing import List
from uuid import UUID

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.line_path_schema import line_paths_schema
from messages.messages import ResponseMessage
from models.enums.publication_status_enum import PublicationStatusEnum
from models.line import Line
from models.line_path import LinePath
from models.tabu_area import TabuArea
from models.topo_image import TopoImage
from util.auth_session import (
    get_current_user,
    session_required,
)
from util.secret_service import SecretService
from util.security_util import check_secret_spot_permission
from util.suggestions import (
    assert_can_view_publication,
    can_suggest,
    line_path_listed,
)
from util.validators import validate_order_payload
from webargs_schemas.line_path_args import line_path_sync_args


def _as_uuid(value) -> UUID:
    return value if isinstance(value, UUID) else UUID(str(value))


def _tabu_paths_equal(left, right) -> bool:
    left = left or []
    right = right or []
    if len(left) != len(right):
        return False
    return all(float(a) == float(b) for a, b in zip(left, right))


def _omitted_path_stays(line, actor) -> bool:
    """A path missing from a moderator save stays when the editor never offered that line.

    The editor lists published lines and the moderator's own drafts. Archived lines, rejected lines, and other
    people's drafts are absent, so leaving their paths out is not a delete.
    """
    if line is None:
        return False
    if line.publication_status in (PublicationStatusEnum.ARCHIVED, PublicationStatusEnum.REJECTED):
        return True
    return line.publication_status == PublicationStatusEnum.DRAFT and line.created_by_id != actor.id


def _locked_tabu_ids(line_paths) -> set:
    """Ids referenced by line paths this save will leave untouched."""
    locked = set()
    for line_path in line_paths:
        locked.update(str(area_id) for area_id in (line_path.tabu_area_ids or []))
    return locked


def _tabu_ids_to_keep(existing_rows, incoming_ids, locked_ids, actor, moderator: bool) -> set:
    """Polygons that stay even when the payload omits them.

    A kept line path still needs its polygons. A suggester also cannot drop a polygon they did not create.
    A moderator can drop any polygon that no kept path references.
    """
    keep = set()
    for row in existing_rows:
        if row.id in incoming_ids or row.id in locked_ids:
            keep.add(row.id)
            continue
        if not moderator and row.created_by_id != actor.id:
            keep.add(row.id)
    return keep


def _tabu_catalog_ids(existing_rows, incoming_areas, locked_ids, actor, moderator: bool) -> set:
    incoming_ids = {area["id"] for area in incoming_areas}
    return _tabu_ids_to_keep(existing_rows, incoming_ids, locked_ids, actor, moderator) | incoming_ids


def _reject_unknown_tabu_ids(line_paths_data, catalog_ids):
    for item in line_paths_data:
        unknown_tabu_ids = [area_id for area_id in (item.get("tabuAreaIds") or []) if area_id not in catalog_ids]
        if unknown_tabu_ids:
            raise BadRequest("Tabu area id does not belong to this topo image.")


def _apply_tabu_areas(topo_image: TopoImage, incoming_areas, locked_ids, actor, moderator: bool):
    """Create, update, and delete tabu-area rows for one sync.

    Polygons referenced by a line path this request keeps cannot be deleted or reshaped. A suggester can change
    the outline of a polygon only when they created it. New polygons are owned by the caller. Moderators can
    edit polygons they did not create, including ones migrated onto the superadmin.
    """
    existing_rows = list(topo_image.tabu_areas)
    existing_by_id = {row.id: row for row in existing_rows}
    incoming_by_id = {area["id"]: area for area in incoming_areas}

    for area_id, area in incoming_by_id.items():
        current = existing_by_id.get(area_id)
        if current is None or _tabu_paths_equal(current.path, area.get("path")):
            continue
        if area_id in locked_ids or not (moderator or current.created_by_id == actor.id):
            raise BadRequest("You cannot change existing tabu areas.")

    keep = _tabu_ids_to_keep(existing_rows, set(incoming_by_id), locked_ids, actor, moderator)
    for row in existing_rows:
        if row.id not in keep:
            db.session.delete(row)

    if moderator:
        order = 0
        for area in incoming_areas:
            row = existing_by_id.get(area["id"])
            if row is None:
                db.session.add(
                    TabuArea(
                        id=area["id"],
                        topo_image_id=topo_image.id,
                        path=area["path"],
                        order_index=order,
                        created_by_id=actor.id,
                    )
                )
            else:
                if area["id"] not in locked_ids:
                    row.path = area["path"]
                row.order_index = order
            order += 1
        for row in existing_rows:
            if row.id in locked_ids and row.id not in incoming_by_id:
                row.order_index = order
                order += 1
        return

    order = 0
    for row in existing_rows:
        if row.id not in keep:
            continue
        incoming = incoming_by_id.get(row.id)
        if incoming is not None and row.id not in locked_ids and row.created_by_id == actor.id:
            row.path = incoming["path"]
        row.order_index = order
        order += 1
    for area in incoming_areas:
        if area["id"] in existing_by_id:
            continue
        db.session.add(
            TabuArea(
                id=area["id"],
                topo_image_id=topo_image.id,
                path=area["path"],
                order_index=order,
                created_by_id=actor.id,
            )
        )
        order += 1


def _dump_visible_line_paths(paths, topo_image: TopoImage, actor):
    """Return line paths the caller is allowed to see on this image.

    Matches topo-image GET: drop secret lines when the caller cannot view secrets, and drop drafts,
    rejected lines, and archived lines that ``line_path_listed`` hides.
    """
    SecretService.attach_secret_flags([path.line for path in paths if path.line is not None])
    dumped = line_paths_schema.dump(paths)
    if not SecretService.can_view_secrets():
        dumped = [path for path in dumped if not path.get("line", {}).get("secret")]
    image_status = topo_image.publication_status.value
    return [path for path in dumped if line_path_listed(image_status, path.get("line"), actor)]


def _sync_owned_draft_paths(topo_image: TopoImage, actor, sync_data, image_id):
    """Save paths for the caller's own drafts without replacing the rest of the image.

    The shared sync endpoint treats the payload as the whole drawing. A suggester's editor only contains their
    drafts, so applying that replace would delete the published paths. This updates and deletes only the caller's
    draft paths, appends new ones after the existing order, and merges tabu areas instead of replacing them.
    """
    # Only drafts this user created in this area may be drawn or deleted.
    owned_draft_ids = {
        str(line.id)
        for line in Line.query.filter(
            Line.area_id == topo_image.area_id,
            Line.created_by_id == actor.id,
            Line.publication_status == PublicationStatusEnum.DRAFT,
        ).all()
    }
    # A user who cannot suggest and has no draft here has nothing to save.
    if not owned_draft_ids and not can_suggest(actor):
        raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)

    line_paths_data = sync_data["linePaths"]
    line_ids = [item["line"] for item in line_paths_data]
    if len(line_ids) != len(set(line_ids)):
        raise BadRequest("Duplicate lines in payload.")
    if any(line_id not in owned_draft_ids for line_id in line_ids):
        raise BadRequest("You can only draw your own draft lines.")

    existing_line_paths: List[LinePath] = LinePath.return_all(
        filter=lambda: LinePath.topo_image_id == image_id,
        options=db.joinedload(LinePath.line),
    )
    existing_by_line_id = {str(line_path.line_id): line_path for line_path in existing_line_paths}
    existing_by_id = {str(line_path.id): line_path for line_path in existing_line_paths}
    owned_payload_ids = {item["line"] for item in line_paths_data if item["line"] in owned_draft_ids}

    for item in line_paths_data:
        if item["line"] not in owned_draft_ids:
            continue
        line: Line = Line.find_by_id(item["line"])
        if line.area_id != topo_image.area_id:
            raise BadRequest("Line does not belong to the topo image's area.")
        if item.get("id"):
            line_path = existing_by_id.get(item["id"])
            if not line_path or str(line_path.line_id) != item["line"]:
                raise BadRequest("Line path id does not match line.")

    # Polygons used by any path this user does not own stay, even when the payload omits them.
    locking_paths = [line_path for line_path in existing_line_paths if str(line_path.line_id) not in owned_draft_ids]
    incoming_areas = sync_data.get("tabuAreas") or []
    locked_ids = _locked_tabu_ids(locking_paths)
    catalog_ids = _tabu_catalog_ids(list(topo_image.tabu_areas), incoming_areas, locked_ids, actor, moderator=False)
    _reject_unknown_tabu_ids(
        [item for item in line_paths_data if item["line"] in owned_draft_ids],
        catalog_ids,
    )

    # Drop the caller's draft paths that they removed. Every other path on the image stays.
    for line_path in existing_line_paths:
        if str(line_path.line_id) in owned_draft_ids and str(line_path.line_id) not in owned_payload_ids:
            db.session.delete(line_path)

    _apply_tabu_areas(topo_image, incoming_areas, locked_ids, actor, moderator=False)

    # Append new paths so this save does not reorder the published lines.
    next_order = max((line_path.order_index for line_path in existing_line_paths), default=-1) + 1
    for item in line_paths_data:
        if item["line"] not in owned_draft_ids:
            continue
        selected_tabu_ids = list(dict.fromkeys(item.get("tabuAreaIds") or []))
        line_path = existing_by_line_id.get(item["line"])
        if line_path:
            line_path.path = item["path"]
            line_path.tabu_area_ids = selected_tabu_ids
            db.session.add(line_path)
        else:
            line_path = LinePath()
            line_path.line_id = _as_uuid(item["line"])
            line_path.topo_image_id = _as_uuid(image_id)
            line_path.path = item["path"]
            line_path.tabu_area_ids = selected_tabu_ids
            line_path.order_index = next_order
            next_order += 1
            db.session.add(line_path)

    db.session.commit()
    saved = LinePath.return_all(
        filter=lambda: LinePath.topo_image_id == image_id,
        options=db.joinedload(LinePath.line),
    )
    return _dump_visible_line_paths(saved, topo_image, actor), 200


class SyncLinePaths(MethodView):
    @session_required()
    def put(self, image_id):
        """
        Creates, updates, deletes, and reorders all line paths for a topo image in one request.
        For a moderator, a missing published path is removed, and so is a missing draft of their own.
        Archived paths, rejected paths, and other users' drafts stay, because those lines are hidden from this editor.
        Tabu polygons those kept paths still use cannot be deleted or reshaped by this save.
        The array order of the paths in the payload becomes order_index.

        Non-moderators are saved by ``_sync_owned_draft_paths``, which only touches their own drafts.
        """
        sync_data = parser.parse(line_path_sync_args, request)
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        actor = get_current_user()
        check_secret_spot_permission(topo_image.area)
        assert_can_view_publication(topo_image, actor)
        if not actor.moderator:
            return _sync_owned_draft_paths(topo_image, actor, sync_data, image_id)
        incoming_areas = sync_data.get("tabuAreas") or []
        line_paths_data = sync_data["linePaths"]

        line_ids = [item["line"] for item in line_paths_data]
        if len(line_ids) != len(set(line_ids)):
            raise BadRequest("Duplicate lines in payload.")

        existing_line_paths: List[LinePath] = LinePath.return_all(
            filter=lambda: LinePath.topo_image_id == image_id,
            options=db.joinedload(LinePath.line),
        )
        existing_by_line_id = {str(line_path.line_id): line_path for line_path in existing_line_paths}
        existing_by_id = {str(line_path.id): line_path for line_path in existing_line_paths}
        payload_line_ids = set(line_ids)
        locking_paths = [
            line_path
            for line_path in existing_line_paths
            if str(line_path.line_id) not in payload_line_ids and _omitted_path_stays(line_path.line, actor)
        ]
        locked_ids = _locked_tabu_ids(locking_paths)
        catalog_ids = _tabu_catalog_ids(list(topo_image.tabu_areas), incoming_areas, locked_ids, actor, moderator=True)

        for item in line_paths_data:
            line: Line = Line.find_by_id(item["line"])
            if line.area_id != topo_image.area_id:
                raise BadRequest("Line does not belong to the topo image's area.")
            if line.publication_status == PublicationStatusEnum.DRAFT and line.created_by_id != actor.id:
                raise BadRequest("You can only edit your own drafts.")
            if item.get("id"):
                line_path = existing_by_id.get(item["id"])
                if not line_path or str(line_path.line_id) != item["line"]:
                    raise BadRequest("Line path id does not match line.")
        _reject_unknown_tabu_ids(line_paths_data, catalog_ids)

        for line_path in existing_line_paths:
            if str(line_path.line_id) in payload_line_ids or _omitted_path_stays(line_path.line, actor):
                continue
            db.session.delete(line_path)

        _apply_tabu_areas(topo_image, incoming_areas, locked_ids, actor, moderator=True)

        synced_line_paths: List[LinePath] = []
        for order_index, item in enumerate(line_paths_data):
            line_path = existing_by_line_id.get(item["line"])
            selected_tabu_ids = list(dict.fromkeys(item.get("tabuAreaIds") or []))
            if line_path:
                line_path.path = item["path"]
                line_path.tabu_area_ids = selected_tabu_ids
                line_path.order_index = order_index
                db.session.add(line_path)
            else:
                line_path = LinePath()
                line_path.line_id = _as_uuid(item["line"])
                line_path.topo_image_id = _as_uuid(image_id)
                line_path.path = item["path"]
                line_path.tabu_area_ids = selected_tabu_ids
                line_path.order_index = order_index
                db.session.add(line_path)
            synced_line_paths.append(line_path)

        db.session.commit()

        return line_paths_schema.dump(synced_line_paths), 200


class DeleteLinePath(MethodView):
    @session_required(moderator=True)
    def delete(self, line_path_id):
        """
        Delete a topo image.
        @param line_path_id: ID of the line_path to delete.
        """
        line_path: LinePath = LinePath.find_by_id(line_path_id)

        db.session.delete(line_path)
        query = text(
            "UPDATE line_paths SET order_index=order_index - 1 WHERE "
            "order_index > :order_index AND topo_image_id = :topo_image_id"
        )
        db.session.execute(query, {"order_index": line_path.order_index, "topo_image_id": line_path.topo_image_id})
        db.session.commit()

        return jsonify(None), 204


class UpdateLinePathOrder(MethodView):
    @session_required(moderator=True)
    def put(self, image_id):
        """
        Changes the order index of line paths for unarchived lines for a specific topo image.
        """
        new_order = request.json
        line_paths: List[LinePath] = LinePath.return_all(
            filter=lambda: [
                LinePath.topo_image_id == image_id,
                LinePath.line.has(
                    Line.publication_status.in_([PublicationStatusEnum.PUBLISHED, PublicationStatusEnum.DRAFT])
                ),
            ],
            options=db.joinedload(LinePath.line),
        )
        if not validate_order_payload(new_order, line_paths):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for line_path in line_paths:
            line_path.order_index = new_order[str(line_path.id)]
            db.session.add(line_path)

        db.session.commit()

        return jsonify(None), 200


class UpdateLinePathOrderForLine(MethodView):
    @session_required(moderator=True)
    def put(self, line_slug):
        """
        Changes the order index of line paths for lines.
        """
        new_order = request.json
        line: Line = Line.find_by_slug(line_slug)
        line_paths: List[LinePath] = LinePath.return_all(filter=lambda: LinePath.line_id == line.id)

        if not validate_order_payload(new_order, line_paths):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for line_path in line_paths:
            line_path.order_index_for_line = new_order[str(line_path.id)]
            db.session.add(line_path)

        db.session.commit()

        return jsonify(None), 200
