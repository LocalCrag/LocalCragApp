from typing import List

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.line_path_schema import line_paths_schema
from models.line import Line
from models.line_path import LinePath
from models.topo_image import TopoImage
from models.user import User
from util.auth_session import (
    get_session_identity,
    session_required,
)
from util.validators import validate_order_payload
from webargs_schemas.line_path_args import line_path_sync_args


class SyncLinePaths(MethodView):
    @session_required(moderator=True)
    def put(self, image_id):
        """
        Creates, updates, deletes, and reorders all line paths for a topo image in one request.
        Line paths not included in the payload are removed from the image.
        Array order determines order_index.
        """
        sync_data = parser.parse(line_path_sync_args, request)
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        created_by = User.find_by_email(get_session_identity())
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
            if item.get("id"):
                line_path = existing_by_id.get(item["id"])
                if not line_path or str(line_path.line_id) != item["line"]:
                    raise BadRequest("Line path id does not match line.")

        for line_path in existing_line_paths:
            if str(line_path.line_id) not in payload_line_ids:
                db.session.delete(line_path)

        synced_line_paths: List[LinePath] = []
        for order_index, item in enumerate(line_paths_data):
            line_path = existing_by_line_id.get(item["line"])
            if line_path:
                line_path.path = item["path"]
                line_path.order_index = order_index
                db.session.add(line_path)
            else:
                line_path = LinePath()
                line_path.line_id = item["line"]
                line_path.topo_image_id = image_id
                line_path.path = item["path"]
                line_path.order_index = order_index
                line_path.created_by_id = created_by.id
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
            filter=lambda: [LinePath.topo_image_id == image_id, LinePath.line.has(Line.archived.is_(False))],
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
