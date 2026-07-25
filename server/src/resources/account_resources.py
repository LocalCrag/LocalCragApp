import datetime

import pytz
from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.account_settings_schema import account_settings_schema
from marshmallow_schemas.rules_read_status_schema import rules_read_status_list_schema
from messages.messages import ResponseMessage
from models.enums.color_scheme_enum import ColorSchemeEnum
from models.enums.notification_digest_frequency_enum import (
    NotificationDigestFrequencyEnum,
)
from models.rules_read_status import RulesReadStatus
from models.user import User
from webargs_schemas.account_settings_args import account_settings_args
from webargs_schemas.rules_read_status_args import mark_rules_read_args


class DeleteOwnUser(MethodView):

    @jwt_required()
    def delete(self):
        """
        Deletes the currently authenticated user. Not allowed for superadmins.
        """
        user = User.find_by_email(get_jwt_identity())
        if user.superadmin:
            raise BadRequest(ResponseMessage.SUPERADMINS_CANNOT_DELETE_OWN_USER.value)

        db.session.delete(user)
        db.session.commit()
        return jsonify(None), 204


class GetAccountSettings(MethodView):

    @jwt_required()
    def get(self):
        user = User.find_by_email(get_jwt_identity())
        return account_settings_schema.dump(user.account_settings), 200


class UpdateAccountSettings(MethodView):

    @jwt_required()
    def put(self):
        user = User.find_by_email(get_jwt_identity())
        data = parser.parse(account_settings_args)
        settings = user.account_settings
        settings.comment_reply_mails_enabled = data["commentReplyMailsEnabled"]
        settings.reaction_notifications_enabled = data["reactionNotificationsEnabled"]
        settings.system_notifications_enabled = data["systemNotificationsEnabled"]
        settings.moderator_task_notifications_enabled = data["moderatorTaskNotificationsEnabled"]
        settings.notification_digest_frequency = NotificationDigestFrequencyEnum(data["notificationDigestFrequency"])
        settings.language = data["language"]
        settings.color_scheme = ColorSchemeEnum(data["colorScheme"])
        db.session.add(settings)
        db.session.commit()
        return account_settings_schema.dump(settings), 200


class GetRulesReadStatus(MethodView):

    @jwt_required()
    def get(self):
        """
        Returns the caller's rules read-status rows.
        """
        user = User.find_by_email(get_jwt_identity())
        rows = RulesReadStatus.query.filter_by(user_id=user.id).all()
        return jsonify(rules_read_status_list_schema.dump(rows)), 200


class MarkRulesRead(MethodView):

    @jwt_required()
    def post(self):
        """
        Marks a topo entity's rules as read for the current user (upsert).
        """
        user = User.find_by_email(get_jwt_identity())
        data = parser.parse(mark_rules_read_args, request)
        entity_type = data["entityType"]
        entity_id = data["entityId"]
        acknowledged_rules_updated_at = data["acknowledgedRulesUpdatedAt"]

        existing = RulesReadStatus.query.filter_by(
            user_id=user.id,
            entity_type=entity_type,
            entity_id=entity_id,
        ).first()
        now = datetime.datetime.now(pytz.utc)
        if existing:
            existing.read_at = now
            existing.acknowledged_rules_updated_at = acknowledged_rules_updated_at
            db.session.add(existing)
        else:
            row = RulesReadStatus()
            row.user_id = user.id
            row.entity_type = entity_type
            row.entity_id = entity_id
            row.read_at = now
            row.acknowledged_rules_updated_at = acknowledged_rules_updated_at
            db.session.add(row)
        db.session.commit()
        return jsonify(None), 204
