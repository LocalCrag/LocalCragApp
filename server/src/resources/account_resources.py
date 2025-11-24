from flask import jsonify
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.account_settings_schema import account_settings_schema
from messages.messages import ResponseMessage
from models.user import User
from webargs_schemas.account_settings_args import account_settings_args


class DeleteOwnUser(MethodView):

    @jwt_required()
    def delete(self):
        """
        Deletes the currently authenticated user. Not allowed for superadmins.
        """
        user = User.find_by_email(get_jwt_identity())
        if user.superadmin:
            raise BadRequest(ResponseMessage.CANNOT_DELETE_SUPERADMIN.value)

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
        db.session.add(settings)
        db.session.commit()
        return account_settings_schema.dump(settings), 200
