from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.admin_message_schema import (
    admin_message_schema,
    admin_messages_schema,
)
from models.admin_message import AdminMessage
from models.enums.notification_type_enum import NotificationTypeEnum
from models.notification import Notification
from models.user import User
from util.auth_session import (
    get_session_identity,
    session_required,
)
from util.notifications import create_notification_for_user
from webargs_schemas.admin_message_args import admin_message_args


def _fan_out_admin_message(message: AdminMessage, actor_id) -> None:
    """Create inbox rows for users who subscribed to admin messages."""
    users = User.query.options(joinedload(User.account_settings)).all()
    for user in users:
        settings = user.account_settings
        if settings and not settings.admin_message_notifications_enabled:
            continue
        db.session.add(
            create_notification_for_user(
                user.id,
                NotificationTypeEnum.ADMIN_MESSAGE,
                actor_id=actor_id,
                entity_type="admin_message",
                entity_id=message.id,
            )
        )


class GetAdminMessages(MethodView):
    @session_required(admin=True)
    def get(self):
        messages = AdminMessage.return_all(order_by=lambda: AdminMessage.time_created.desc())
        return jsonify(admin_messages_schema.dump(messages)), 200


class GetAdminMessage(MethodView):
    @session_required()
    def get(self, message_id):
        """
        Any authenticated user can read a message (broadcast content for the instance).
        """
        message = AdminMessage.find_by_id(message_id)
        return admin_message_schema.dump(message), 200


class CreateAdminMessage(MethodView):
    @session_required(admin=True)
    def post(self):
        data = parser.parse(admin_message_args, request)
        created_by = User.find_by_email(get_session_identity())

        message = AdminMessage()
        message.title = data["title"].strip()
        message.text = data["text"].strip()

        db.session.add(message)
        db.session.flush()
        _fan_out_admin_message(message, created_by.id)
        db.session.commit()

        return admin_message_schema.dump(message), 201


class UpdateAdminMessage(MethodView):
    @session_required(admin=True)
    def put(self, message_id):
        data = parser.parse(admin_message_args, request)
        message = AdminMessage.find_by_id(message_id)

        message.title = data["title"].strip()
        message.text = data["text"].strip()

        db.session.add(message)
        db.session.commit()

        return admin_message_schema.dump(message), 200


class DeleteAdminMessage(MethodView):
    @session_required(admin=True)
    def delete(self, message_id):
        message = AdminMessage.find_by_id(message_id)
        db.session.query(Notification).filter(
            Notification.entity_type == "admin_message",
            Notification.entity_id == message.id,
        ).delete(synchronize_session=False)
        db.session.delete(message)
        db.session.commit()
        return jsonify(None), 204
