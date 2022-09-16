import re

from flask import request, jsonify
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from helpers.user_helpers import create_user
from marshmallow_schemas.account_settings_schema import user_account_settings_schema
from marshmallow_schemas.simple_message_schema import simple_message_schema
from marshmallow_schemas.user_schema import users_schema, user_schema
from messages.marshalling_objects import SimpleMessage
from messages.messages import ResponseMessage
from models.account_settings import AccountSettings
from models.user import User
from permission_system.action import Action
from permission_system.check_boolean_permission_decorator import check_boolean_permission
from util.email import send_create_user_email
from util.password_util import generate_password
from util.regexes import email_regex
from webargs_schemas.account_settings_args import user_account_settings_args
from webargs_schemas.change_password_args import change_password_args
from webargs_schemas.user_args import user_args, user_contact_data_args, user_permissions_args


class ChangePassword(MethodView):
    @jwt_required()
    def put(self):
        """
        Changes the requesting users password.
        """
        data = parser.parse(change_password_args, request)
        user = User.find_by_email(get_jwt_identity(), True)
        if User.verify_hash(data['oldPassword'], user.password):
            if len(data['newPassword']) < 8:
                raise BadRequest(ResponseMessage.PASSWORD_TOO_SHORT.value)
            user.password = User.generate_hash(data['newPassword'])
            user.persist()
            simple_message = SimpleMessage(ResponseMessage.PASSWORD_CHANGED.value)
            return simple_message_schema.dump(simple_message), 201
        else:
            raise Unauthorized(ResponseMessage.OLD_PASSWORD_INCORRECT.value)


class GetUsers(MethodView):
    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.VIEW])
    def get(self):
        """
        Returns the list of users.
        """
        return jsonify(users_schema.dump(User.return_all(
            order_by=User.email.asc
        ))), 200


class GetUser(MethodView):
    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.VIEW])
    def get(self, user_id):
        """
        Fetches a detailed user.
        :param user_id ID of the user to fetch.
        """
        user: User = User.find_detailed_by_id(user_id)
        user.account_settings = AccountSettings.find_by_user_id(user.id)
        return jsonify(user_schema.dump(user)), 200


class GetEmailTaken(MethodView):
    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.VIEW])
    def get(self, email):
        """
        Checks if the given email is already taken.
        :param email: Email of the user to check.
        """
        user = User.find_by_email(email)
        return jsonify(user is not None), 200


class UpdateUserContactInfo(MethodView):
    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.UPDATE])
    def put(self, user_id):
        """
        Updates the contact information of a user.
        :param user_id ID of the user that should get updated.
        """
        user_data = parser.parse(user_contact_data_args, request)

        user_by_email = User.find_by_email(user_data['email'])

        user = User.find_detailed_by_id(user_id)

        if user_by_email and user_by_email.id != user.id:
            # => The email exists for a user that is not the edited user
            raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

        if not re.match(email_regex, user_data['email']):
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)

        user.firstname = user_data['firstname']
        user.lastname = user_data['lastname']
        user.email = user_data['email']

        db.session.add(user)
        db.session.commit()

        return user_schema.dump(user), 200


class UpdateUserAccountSettings(MethodView):
    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.UPDATE])
    def put(self, user_id):
        """
        Updates the account settings of a user.
        :param user_id ID of the user whose account settings should get updated.
        """
        account_settings_data = parser.parse(user_account_settings_args, request)

        account_settings = AccountSettings.find_by_user_id(user_id)
        account_settings.language_id = account_settings_data['language']['id']

        db.session.add(account_settings)
        db.session.commit()

        return user_account_settings_schema.dump(account_settings), 200


class UpdateUserPermissions(MethodView):
    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.UPDATE])
    def put(self, user_id):
        """
        Updates the permissions of a user.
        :param user_id ID of the user that should get updated.
        """
        user_data = parser.parse(user_permissions_args, request)

        created_by: User = User.find_detailed_by_email(get_jwt_identity())
        created_by_permission_dict = {p.id: p.bool_value for p in created_by.permissions if p.bool_value}

        user = User.find_detailed_by_id(user_id)

        permission_dict = {p['id']: p for p in user_data['permissions']}
        u2ps = []
        for p in user.permissions:
            # Set access level and bool value if permission should be changed and created_by also has the permission
            if p.id in permission_dict and p.id in created_by_permission_dict:
                p.user2permission.bool_value = permission_dict[p.id]['boolValue']
                p.user2permission.access_level_id = permission_dict[p.id]['accessLevel']
                db.session.add(p.user2permission)
            if p.id in permission_dict and p.id not in created_by_permission_dict \
                    and (p.user2permission.bool_value != permission_dict[p.id]['boolValue']
                         or p.user2permission.access_level_id != permission_dict[p.id]['accessLevel']):
                raise Unauthorized(ResponseMessage.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF.value)
            u2ps.append(p.user2permission)

        db.session.commit()

        # Load detailed user with all updated permissions
        user = User.find_detailed_by_id(user.id)

        return user_schema.dump(user), 200


class CreateUser(MethodView):

    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.CREATE])
    def post(self):
        """
        Creates a User.
        """
        user_data = parser.parse(user_args, request)

        created_by: User = User.find_detailed_by_email(get_jwt_identity())

        if User.find_by_email(user_data['email']):
            raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

        if not re.match(email_regex, user_data['email']):
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)

        created_user = create_user(user_data, created_by)

        return user_schema.dump(created_user), 201


class ResendUserCreateMail(MethodView):

    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.CREATE])
    def put(self, user_id):
        """
        Resends the user created mail for a user. The password is re-generated in this step. Only works for
        inactive users.
        """
        user: User = User.find_by_id(user_id)

        if user.activated:
            raise BadRequest(ResponseMessage.USER_ALREADY_ACTIVATED.value)

        password = generate_password()
        user.password = User.generate_hash(password)
        db.session.add(user)
        db.session.commit()
        send_create_user_email(password, user)

        return jsonify(None)


class LockUser(MethodView):

    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.LOCK])
    def put(self, user_id):
        """
        Locks a user.
        """
        locked_by = User.find_by_email(get_jwt_identity())
        user: User = User.find_by_id(user_id)

        if user.id == locked_by.id:
            raise BadRequest(ResponseMessage.CANNOT_LOCK_OWN_USER.value)

        if user.locked:
            raise BadRequest(ResponseMessage.USER_ALREADY_LOCKED.value)

        user.locked = True
        db.session.add(user)
        db.session.commit()

        return jsonify(None)


class UnlockUser(MethodView):

    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.LOCK])
    def put(self, user_id):
        """
        Unlocks a user.
        """
        user: User = User.find_by_id(user_id)

        if not user.locked:
            raise BadRequest(ResponseMessage.USER_ALREADY_UNLOCKED.value)

        user.locked = False
        db.session.add(user)
        db.session.commit()

        return jsonify(None)


class DeleteUser(MethodView):  # pragma: no cover

    @jwt_required()
    @check_boolean_permission(User.__entity_type__, [Action.VIEW, Action.DELETE])
    def delete(self, user_id):
        """
        Deletes a User.
        :param user_id: ID of the User to delete.
        """

        user: User = User.find_by_id(user_id)

        if user.email == get_jwt_identity():
            raise BadRequest(ResponseMessage.CANNOT_DELETE_OWN_USER.value)

        user.is_deleted = True

        account_settings = AccountSettings.find_by_user_id(user.id)
        account_settings.is_deleted = True

        db.session.add(user)
        db.session.add(account_settings)
        db.session.commit()
        return jsonify(None), 204


class FindUser(MethodView):  # pragma: no cover

    @jwt_required()
    def get(self, query):
        """
        Finds a User by one of its identifiers.
        :param query: Search query for finding the user.
        """
        if not query:
            raise BadRequest('Query cannot be empty.')
        excluded_users = request.args.get('excluded')
        if excluded_users:
            excluded_users = excluded_users.split(',')
        return jsonify(users_schema.dump(User.find_by_identifier(query, excluded_users))), 200
