import re
from datetime import datetime
from uuid import uuid4

import pytz
from flask import request, jsonify, g
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from helpers.user_helpers import create_user
from marshmallow_schemas.auth_response_schema import auth_response_schema
from marshmallow_schemas.simple_message_schema import simple_message_schema
from marshmallow_schemas.user_schema import user_schema, user_list_schema
from messages.marshalling_objects import SimpleMessage, AuthResponse
from messages.messages import ResponseMessage
from models.ascent import Ascent
from models.enums.user_promotion_enum import UserPromotionEnum
from models.line import Line
from models.user import User
from util.auth import get_access_token_claims
from util.email import send_create_user_email, send_change_email_address_email
from util.password_util import generate_password
from util.regexes import email_regex
from util.security_util import check_auth_claims
from webargs_schemas.change_password_args import change_password_args
from webargs_schemas.new_email_args import new_email_args
from webargs_schemas.user_args import user_args, user_registration_args, user_promotion_args


class GetUser(MethodView):
    def get(self, user_slug):
        return jsonify(user_schema.dump(User.find_by_slug(user_slug))), 200


class ChangePassword(MethodView):
    @jwt_required()
    def put(self):
        """
        Changes the requesting users password.
        """
        data = parser.parse(change_password_args, request)
        user = User.find_by_email(get_jwt_identity())
        if not user:
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
        if User.verify_hash(data['oldPassword'], user.password):
            if len(data['newPassword']) < 8:
                raise BadRequest(ResponseMessage.PASSWORD_TOO_SHORT.value)
            user.password = User.generate_hash(data['newPassword'])
            db.session.add(user)
            db.session.commit()
            simple_message = SimpleMessage(ResponseMessage.PASSWORD_CHANGED.value)
            return simple_message_schema.dump(simple_message), 201
        else:
            raise Unauthorized(ResponseMessage.OLD_PASSWORD_INCORRECT.value)


class GetUsers(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self):
        """
        Returns the list of users.
        """
        return jsonify(user_list_schema.dump(User.return_all(
            order_by=[User.firstname.asc, User.lastname.asc]
        ))), 200


class GetEmailTaken(MethodView):
    def get(self, email):
        """
        Checks if the given email is already taken.
        :param email: Email of the user to check.
        """
        user = User.find_by_email(email.lower())
        return jsonify(user is not None), 200


class ResendUserCreateMail(MethodView):

    @jwt_required()
    @check_auth_claims(moderator=True)
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


class DeleteUser(MethodView):  # pragma: no cover

    @jwt_required()
    @check_auth_claims(admin=True)
    def delete(self, user_id):
        """
        Deletes a User.
        :param user_id: ID of the User to delete.
        """

        user: User = User.find_by_id(user_id)

        if user.email == get_jwt_identity():
            raise BadRequest(ResponseMessage.CANNOT_DELETE_OWN_USER.value)

        db.session.delete(user)
        db.session.commit()
        return jsonify(None), 204


class UpdateAccountSettings(MethodView):

    @jwt_required()
    def put(self):
        user_data = parser.parse(user_args, request)
        user = User.find_by_email(get_jwt_identity())  # You can only edit your own user!

        email_canonical = user_data['email'].lower()
        user_by_email = User.find_by_email(email_canonical)
        if user_by_email and user_by_email.id != user.id:
            # => The email exists for a user that is not the edited user
            raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

        if not re.match(email_regex, email_canonical):
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)

        user.avatar_id = user_data['avatar']
        user.firstname = user_data['firstname']
        user.lastname = user_data['lastname']

        if user.email != email_canonical:
            user.new_email = email_canonical
            user.new_email_hash = uuid4()
            user.new_email_hash_created = datetime.now()
            send_change_email_address_email(user)

        db.session.add(user)
        db.session.commit()
        return user_schema.dump(user), 200


class ChangeEmail(MethodView):
    def put(self):
        data = parser.parse(new_email_args, request)
        user = User.find_by_new_email_hash(data['newEmailHash'])
        if not user:
            raise Unauthorized(ResponseMessage.NEW_EMAIL_HASH_INVALID.value)
        if not user.activated:
            raise Unauthorized(ResponseMessage.USER_NOT_ACTIVATED.value)
        now = datetime.now(pytz.utc)
        hash_age = now - user.new_email_hash_created
        # Hash must be younger than 24 hours
        if divmod(hash_age.total_seconds(), 60 * 60 * 24)[0] > 0.0:
            raise Unauthorized(ResponseMessage.NEW_EMAIL_HASH_INVALID.value)
        user.email = user.new_email
        user.new_email_hash = None
        user.new_email_hash_created = None
        db.session.add(user)
        db.session.commit()
        access_token = create_access_token(identity=user.email, additional_claims=get_access_token_claims(user))
        refresh_token = create_refresh_token(identity=user.email)
        auth_response = AuthResponse(ResponseMessage.EMAIL_CHANGED.value,
                                     user,
                                     access_token=access_token,
                                     refresh_token=refresh_token)
        return auth_response_schema.dump(auth_response), 200


class RegisterUser(MethodView):

    def post(self):
        user_data = parser.parse(user_registration_args, request)
        email_canonical = user_data['email'].lower()

        if User.find_by_email(email_canonical):
            raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

        if not re.match(email_regex, email_canonical):
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)

        created_user = create_user(user_data)

        return user_schema.dump(created_user), 201


class PromoteUser(MethodView):

    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, user_id):
        promotion_data = parser.parse(user_promotion_args, request)
        own_user = User.find_by_email(get_jwt_identity())
        user: User = User.find_by_id(user_id)

        if user.admin:
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)

        if own_user.id == user.id:
            raise Conflict(ResponseMessage.CANNOT_PROMOTE_OWN_USER.value)

        # We always set multiple properties, so we can later easily check permissions by a single bool value
        if promotion_data['promotionTarget'] == UserPromotionEnum.USER:
            user.admin = False
            user.moderator = False
            user.member = False
        if promotion_data['promotionTarget'] == UserPromotionEnum.MEMBER:
            user.admin = False
            user.moderator = False
            user.member = True
        if promotion_data['promotionTarget'] == UserPromotionEnum.MODERATOR:
            user.admin = False
            user.moderator = True
            user.member = True

        db.session.add(user)
        db.session.commit()
        return user_schema.dump(user), 200


class GetUserGrades(MethodView):

    def get(self, user_slug):
        user_id = User.get_id_by_slug(user_slug)
        result = db.session.query(Line.grade_name, Line.grade_scale, Ascent.line_id, Ascent.created_by_id).filter(Line.id == Ascent.line_id,
                                                                                    Ascent.created_by_id == user_id).all()
        return jsonify([{'gradeName': r[0], 'gradeScale': r[1]} for r in result]), 200
