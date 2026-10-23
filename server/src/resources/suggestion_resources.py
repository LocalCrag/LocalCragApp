from flask import jsonify, request
from flask.views import MethodView
from marshmallow import validate
from sqlalchemy.orm import joinedload, selectinload
from webargs import fields
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.line_schema import line_schema
from marshmallow_schemas.suggestion_schema import suggestion_queue_schema
from marshmallow_schemas.topo_image_schema import topo_image_schema
from models.area import Area
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.history_item import HistoryItem
from models.line import Line
from models.line_path import LinePath
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from util.auth_session import get_current_user, session_required
from util.suggestions import (
    assert_ancestors_not_archived,
    clean_review_message,
    delete_line_paths,
    notify_suggestion_author,
    set_suggestions_enabled,
)

suggestion_review_args = {
    "message": fields.Str(required=False, allow_none=True, validate=validate.Length(max=2000)),
}

suggestion_permission_args = {
    "suggestionsEnabled": fields.Boolean(required=True),
}


class GetSuggestions(MethodView):
    @session_required(moderator=True)
    def get(self):
        lines = (
            Line.query.filter(Line.publication_status == PublicationStatusEnum.DRAFT)
            .options(
                joinedload(Line.area).joinedload(Area.sector).joinedload(Sector.crag),
                joinedload(Line.created_by),
                selectinload(Line.line_paths).joinedload(LinePath.topo_image).joinedload(TopoImage.file),
                selectinload(Line.line_paths).joinedload(LinePath.topo_image).selectinload(TopoImage.map_markers),
            )
            .order_by(Line.time_created.desc())
            .all()
        )
        images = (
            TopoImage.query.filter(TopoImage.publication_status == PublicationStatusEnum.DRAFT)
            .options(
                joinedload(TopoImage.area).joinedload(Area.sector).joinedload(Sector.crag),
                joinedload(TopoImage.created_by),
                joinedload(TopoImage.file),
                selectinload(TopoImage.line_paths).joinedload(LinePath.line),
                selectinload(TopoImage.map_markers),
            )
            .order_by(TopoImage.time_created.desc())
            .all()
        )
        return jsonify(suggestion_queue_schema.dump({"lines": lines, "topoImages": images})), 200


class PublishLine(MethodView):
    @session_required(moderator=True)
    def post(self, line_slug):
        payload = parser.parse(suggestion_review_args, request)
        line: Line = Line.find_by_slug(line_slug)
        if line.publication_status != PublicationStatusEnum.DRAFT:
            raise BadRequest("Line is not a draft.")
        assert_ancestors_not_archived(line.area)
        line.publication_status = PublicationStatusEnum.PUBLISHED
        actor = get_current_user()
        notify_suggestion_author(
            line,
            actor,
            NotificationTypeEnum.SUGGESTION_PUBLISHED,
            clean_review_message(payload.get("message")),
            "line",
            line.id,
        )
        db.session.add(line)
        db.session.commit()
        HistoryItem.create_history_item(HistoryItemTypeEnum.CREATED, line, line.created_by or actor)
        return line_schema.dump(line), 200


class RejectLine(MethodView):
    @session_required(moderator=True)
    def post(self, line_slug):
        payload = parser.parse(suggestion_review_args, request)
        line: Line = Line.find_by_slug(line_slug)
        if line.publication_status != PublicationStatusEnum.DRAFT:
            raise BadRequest("Line is not a draft.")
        actor = get_current_user()
        line.publication_status = PublicationStatusEnum.REJECTED
        notify_suggestion_author(
            line,
            actor,
            NotificationTypeEnum.SUGGESTION_REJECTED,
            clean_review_message(payload.get("message")),
            "line",
            line.id,
        )
        db.session.add(line)
        db.session.commit()
        return jsonify(None), 204


class PublishTopoImage(MethodView):
    @session_required(moderator=True)
    def post(self, image_id):
        payload = parser.parse(suggestion_review_args, request)
        image: TopoImage = TopoImage.find_by_id(image_id)
        if image.publication_status != PublicationStatusEnum.DRAFT:
            raise BadRequest("Topo image is not a draft.")
        assert_ancestors_not_archived(image.area)
        image.publication_status = PublicationStatusEnum.PUBLISHED
        actor = get_current_user()
        notify_suggestion_author(
            image,
            actor,
            NotificationTypeEnum.SUGGESTION_PUBLISHED,
            clean_review_message(payload.get("message")),
            "topo_image",
            image.id,
        )
        db.session.add(image)
        db.session.commit()
        return topo_image_schema.dump(image), 200


class RejectTopoImage(MethodView):
    @session_required(moderator=True)
    def post(self, image_id):
        payload = parser.parse(suggestion_review_args, request)
        image: TopoImage = TopoImage.find_by_id(image_id)
        if image.publication_status != PublicationStatusEnum.DRAFT:
            raise BadRequest("Topo image is not a draft.")
        actor = get_current_user()
        notify_suggestion_author(
            image,
            actor,
            NotificationTypeEnum.SUGGESTION_REJECTED,
            clean_review_message(payload.get("message")),
            "topo_image",
            image.id,
        )
        delete_line_paths(image)
        image.publication_status = PublicationStatusEnum.REJECTED
        db.session.add(image)
        db.session.commit()
        return jsonify(None), 204


class UpdateSuggestionPermission(MethodView):
    @session_required(moderator=True)
    def put(self, user_id):
        payload = parser.parse(suggestion_permission_args, request)
        user = User.find_by_id(user_id)
        if user.moderator:
            raise BadRequest("Moderators always create public lines and images.")
        set_suggestions_enabled(user, payload["suggestionsEnabled"])
        db.session.commit()
        return jsonify({"suggestionsEnabled": payload["suggestionsEnabled"]}), 200
