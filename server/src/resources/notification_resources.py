from flask import current_app, jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import text
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.line_schema import ascent_and_todo_lines_schema
from models.ascent import Ascent
from models.comment import Comment
from models.line import Line
from models.notification import Notification
from models.post import Post
from models.reaction import Reaction
from models.user import User
from util.email import _build_comment_action_link
from webargs_schemas.notification_args import get_notifications_args


def _line_from_comment(comment: Comment) -> Line | None:
    if not comment:
        return None
    if getattr(comment, "object", None) is not None and isinstance(comment.object, Line):
        return comment.object
    return None


def _topic_name_from_comment(comment: Comment) -> str | None:
    if not comment:
        return None
    if getattr(comment, "object", None) is not None:
        if isinstance(comment.object, Post):
            return comment.object.title
        if hasattr(comment.object, "name"):
            return comment.object.name
    return None


def _notification_action_link(notification: Notification) -> str | None:
    if notification.entity_type == "comment" and notification.entity_id:
        comment = Comment.query.filter_by(id=notification.entity_id).first()
        if not comment:
            return None
        absolute_link = _build_comment_action_link(comment)
        return absolute_link.replace(f"{current_app.config['FRONTEND_HOST']}", "")
    if notification.entity_type == "ascent" and notification.entity_id:
        ascent = Ascent.query.filter_by(id=notification.entity_id).first()
        if ascent and ascent.line:
            line = ascent.line
            return f"/topo/{line.area.sector.crag.slug}/{line.area.sector.slug}/{line.area.slug}/{line.slug}/ascents"
    return None


class GetNotifications(MethodView):
    @jwt_required()
    def get(self):
        user = User.find_by_email(get_jwt_identity())
        args = parser.parse(get_notifications_args, request, location="query")
        page = args["page"]
        per_page = args["per_page"]
        include_dismissed = args["include_dismissed"]
        query = Notification.query.filter(Notification.user_id == user.id)
        if not include_dismissed:
            query = query.filter(Notification.dismissed_at.is_(None))
        notifications = query.order_by(Notification.time_created.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False,
        )
        payload = []
        for notification in notifications.items:
            actor_name = None
            if notification.actor:
                actor_name = f"{notification.actor.firstname} {notification.actor.lastname}".strip()
            line_payload = None
            topic_name = None
            reaction_emoji = None
            if notification.entity_type == "ascent" and notification.entity_id:
                ascent = Ascent.query.filter_by(id=notification.entity_id).first()
                if ascent and ascent.line:
                    line_payload = ascent_and_todo_lines_schema.dump(ascent.line)
            if notification.entity_type == "comment" and notification.entity_id:
                comment = Comment.query.filter_by(id=notification.entity_id).first()
                topic_line = _line_from_comment(comment)
                if topic_line:
                    line_payload = ascent_and_todo_lines_schema.dump(topic_line)
                topic_name = _topic_name_from_comment(comment)
            if (
                notification.type.value == "reaction"
                and notification.actor_id
                and notification.entity_type
                and notification.entity_id
            ):
                reaction = (
                    Reaction.query.filter_by(
                        created_by_id=notification.actor_id,
                        target_type=notification.entity_type,
                        target_id=notification.entity_id,
                    )
                    .order_by(Reaction.time_created.desc())
                    .first()
                )
                if reaction:
                    reaction_emoji = reaction.emoji
            payload.append(
                {
                    "id": str(notification.id),
                    "type": notification.type.value,
                    "timeCreated": notification.time_created,
                    "actorId": str(notification.actor_id) if notification.actor_id else None,
                    "actorName": actor_name,
                    "entityType": notification.entity_type,
                    "entityId": str(notification.entity_id) if notification.entity_id else None,
                    "actionLink": _notification_action_link(notification),
                    "line": line_payload,
                    "topicName": topic_name,
                    "reactionEmoji": reaction_emoji,
                    "isDismissed": notification.dismissed_at is not None,
                }
            )

        return jsonify({"items": payload, "hasNext": notifications.has_next}), 200


class GetNotificationsCount(MethodView):
    @jwt_required()
    def get(self):
        user = User.find_by_email(get_jwt_identity())
        count = Notification.query.filter(Notification.user_id == user.id, Notification.dismissed_at.is_(None)).count()
        return jsonify({"count": count}), 200


class DismissNotification(MethodView):
    @jwt_required()
    def post(self, notification_id):
        user = User.find_by_email(get_jwt_identity())
        now_ts = text("CURRENT_TIMESTAMP")
        db.session.query(Notification).filter(
            Notification.user_id == user.id, Notification.id == notification_id
        ).update({"dismissed_at": now_ts, "delivered_at": now_ts}, synchronize_session=False)
        db.session.commit()
        return jsonify(None), 204


class DismissAllNotifications(MethodView):
    @jwt_required()
    def post(self):
        user = User.find_by_email(get_jwt_identity())
        now_ts = text("CURRENT_TIMESTAMP")
        db.session.query(Notification).filter(
            Notification.user_id == user.id, Notification.dismissed_at.is_(None)
        ).update({"dismissed_at": now_ts, "delivered_at": now_ts}, synchronize_session=False)
        db.session.commit()
        return jsonify(None), 204
