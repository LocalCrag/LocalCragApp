from typing import List

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
from models.topo_image import TopoImage
from util.auth_session import (
    get_current_user,
    session_required,
)
from util.suggestions import (
    assert_can_view_publication,
    can_suggest,
)
from util.validators import validate_order_payload
from webargs_schemas.line_path_args import line_path_sync_args


def _tabu_paths_equal(left, right) -> bool:
    left = left or []
    right = right or []
    if len(left) != len(right):
        return False
    return all(float(a) == float(b) for a, b in zip(left, right))


def _merge_suggestion_tabu_areas(topo_image: TopoImage, incoming_areas, existing_line_paths, owned_draft_ids):
    """Merge a suggester's tabu areas into the image.

    Areas used by a path the caller does not own stay as stored, and a changed outline for one of them is rejected.
    Areas the caller still sends are updated. Areas they added are appended. Areas they dropped are removed only
    when no other line uses them.
    """
    existing = list(topo_image.tabu_areas or [])
    existing_by_id = {area["id"]: area for area in existing}
    # Tied to someone else's path, so the caller cannot reshape or remove them.
    protected_ids = set()
    for line_path in existing_line_paths:
        if str(line_path.line_id) not in owned_draft_ids:
            protected_ids.update(line_path.tabu_area_ids or [])

    incoming_by_id = {area["id"]: area for area in incoming_areas}
    for area_id, area in incoming_by_id.items():
        current = existing_by_id.get(area_id)
        if (
            current is not None
            and area_id in protected_ids
            and not _tabu_paths_equal(current.get("path"), area.get("path"))
        ):
            raise BadRequest("You cannot change existing tabu areas.")

    merged = []
    seen = set()
    for area in existing:
        area_id = area["id"]
        if area_id in protected_ids or area_id in incoming_by_id:
            merged.append(existing_by_id[area_id] if area_id in protected_ids else incoming_by_id[area_id])
            seen.add(area_id)
    for area in incoming_areas:
        if area["id"] not in seen:
            merged.append(area)
            seen.add(area["id"])
    return merged


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

    # Drop the caller's draft paths that they removed. Every other path on the image stays.
    for line_path in existing_line_paths:
        if str(line_path.line_id) in owned_draft_ids and str(line_path.line_id) not in owned_payload_ids:
            db.session.delete(line_path)

    merged_tabu_areas = _merge_suggestion_tabu_areas(
        topo_image,
        sync_data.get("tabuAreas") or [],
        existing_line_paths,
        owned_draft_ids,
    )
    merged_tabu_ids = {area["id"] for area in merged_tabu_areas}
    for item in line_paths_data:
        if item["line"] not in owned_draft_ids:
            continue
        unknown_tabu_ids = [area_id for area_id in (item.get("tabuAreaIds") or []) if area_id not in merged_tabu_ids]
        if unknown_tabu_ids:
            raise BadRequest("Tabu area id does not belong to this topo image.")

    topo_image.tabu_areas = merged_tabu_areas
    db.session.add(topo_image)

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
            line_path.line_id = item["line"]
            line_path.topo_image_id = image_id
            line_path.path = item["path"]
            line_path.tabu_area_ids = selected_tabu_ids
            line_path.order_index = next_order
            next_order += 1
            db.session.add(line_path)

    db.session.commit()
    saved = LinePath.return_all(filter=lambda: LinePath.topo_image_id == image_id)
    return line_paths_schema.dump(saved), 200


class SyncLinePaths(MethodView):
    @session_required()
    def put(self, image_id):
        """
        Creates, updates, deletes, and reorders all line paths for a topo image in one request.
        For a moderator, paths missing from the payload are removed and the array order becomes order_index.
        Paths for other users' drafts and rejected lines are kept, because those lines are hidden from this editor.

        Non-moderators are saved by ``_sync_owned_draft_paths``, which only touches their own drafts.
        """
        sync_data = parser.parse(line_path_sync_args, request)
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        actor = get_current_user()
        assert_can_view_publication(topo_image, actor)
        if not actor.moderator:
            return _sync_owned_draft_paths(topo_image, actor, sync_data, image_id)
        tabu_areas = sync_data.get("tabuAreas") or []
        tabu_area_ids = {area["id"] for area in tabu_areas}
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
            unknown_tabu_ids = [area_id for area_id in (item.get("tabuAreaIds") or []) if area_id not in tabu_area_ids]
            if unknown_tabu_ids:
                raise BadRequest("Tabu area id does not belong to this topo image.")

        for line_path in existing_line_paths:
            # Hidden draft and rejected paths are omitted from the editor payload. Keep them.
            line = line_path.line
            if (
                line is not None
                and line.publication_status != PublicationStatusEnum.PUBLISHED
                and line.created_by_id != actor.id
            ):
                continue
            if str(line_path.line_id) not in payload_line_ids:
                db.session.delete(line_path)

        topo_image.tabu_areas = tabu_areas
        db.session.add(topo_image)

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
                line_path.line_id = item["line"]
                line_path.topo_image_id = image_id
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
