from flask import request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.account_settings_schema import account_settings_schema
from models.account_settings import AccountSettings
from models.user import User
from permission_system.check_user_not_locked_or_deleted_decorator import check_user_not_locked_or_deleted
from webargs_schemas.account_settings_args import account_settings_args


class GetAccountSettings(MethodView):
    @jwt_required()
    @check_user_not_locked_or_deleted()
    def get(self):
        """
        Returns the users account settings.
        """
        user = User.find_by_email(get_jwt_identity(), True)
        return account_settings_schema.dump(AccountSettings.find_by_user_id(user.id)), 200


class UpdateAccountSettings(MethodView):

    @jwt_required()
    @check_user_not_locked_or_deleted()
    def put(self):
        """
        Updates an AccountSettings entity.
        """
        account_settings_data = parser.parse(account_settings_args, request)
        user = User.find_by_email(get_jwt_identity(), True)

        account_settings: AccountSettings = AccountSettings.find_by_user_id(user.id)

        account_settings.color_scheme = account_settings_data['colorScheme']
        account_settings.language_id = account_settings_data['language']['id']
        account_settings.avatar_id = account_settings_data['avatar']

        db.session.add(account_settings)
        db.session.commit()
        return account_settings_schema.dump(account_settings), 200
