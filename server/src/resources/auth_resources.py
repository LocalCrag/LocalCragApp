from datetime import datetime
from uuid import uuid4

import pytz
from flask import request
from flask.views import MethodView
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.auth_response_schema import auth_response_schema
from marshmallow_schemas.simple_message_schema import simple_message_schema
from messages.marshalling_objects import SimpleMessage, AuthResponse
from messages.messages import ResponseMessage
from models.revoked_token import RevokedToken
from models.user import User
from util.auth import get_access_token_claims
from util.email import send_forgot_password_email
from webargs_schemas.forgot_password_args import forgot_password_args
from webargs_schemas.login_args import login_args
from webargs_schemas.reset_password_args import reset_password_args


class UserLogin(MethodView):

    def post(self):
        """
        Logs in a user into the application.
        """
        data = parser.parse(login_args, request)
        email_canonical = data["email"].lower()
        current_user = User.find_by_email(email_canonical)

        if not current_user:
            raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)

        if User.verify_hash(data["password"], current_user.password):
            access_token = create_access_token(
                identity=email_canonical, additional_claims=get_access_token_claims(current_user)
            )
            refresh_token = create_refresh_token(identity=email_canonical)
            auth_response = AuthResponse(
                ResponseMessage.LOGIN_SUCCESS.value,
                current_user,
                access_token=access_token,
                refresh_token=refresh_token,
            )

            # A user becomes activated after first login
            if not current_user.activated:
                current_user.activated = True
                current_user.activated_at = datetime.utcnow()
                db.session.add(current_user)
                db.session.commit()

            return auth_response_schema.dump(auth_response), 202
        else:
            raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)


class UserLogoutAccess(MethodView):
    @jwt_required()
    def post(self):
        """
        Invalidates a users access token.
        """
        jti = get_jwt()["jti"]
        revoked_token = RevokedToken(jti=jti)
        revoked_token.persist()
        simple_message = SimpleMessage(ResponseMessage.ACCESS_TOKEN_REVOKED.value)
        return simple_message_schema.dump(simple_message), 200


class UserLogoutRefresh(MethodView):
    @jwt_required(refresh=True)
    def post(self):
        """
        Invalidates a users refresh token.
        """
        jti = get_jwt()["jti"]
        revoked_token = RevokedToken(jti=jti)
        revoked_token.persist()
        simple_message = SimpleMessage(ResponseMessage.REFRESH_TOKEN_REVOKED.value)
        return simple_message_schema.dump(simple_message), 200


class TokenRefresh(MethodView):
    @jwt_required(refresh=True)
    def post(self):
        """
        Refreshes a users access token.
        """
        current_user = User.find_by_email(get_jwt_identity())
        if current_user is None:
            raise Unauthorized(ResponseMessage.USER_NOT_FOUND.value)

        access_token = create_access_token(
            identity=current_user.email, additional_claims=get_access_token_claims(current_user)
        )
        auth_response = AuthResponse(ResponseMessage.LOGIN_SUCCESS.value, current_user, access_token=access_token)
        return auth_response_schema.dump(auth_response), 200


class ForgotPassword(MethodView):
    def post(self):
        """
        Sends a mail to the user that lets him reset his password.
        """
        data = parser.parse(forgot_password_args, request)
        email_canonical = data["email"].lower()
        user = User.find_by_email(email_canonical)
        if not user:
            raise Unauthorized(ResponseMessage.USER_NOT_FOUND.value)
        if not user.activated:
            raise Unauthorized(ResponseMessage.USER_NOT_ACTIVATED.value)
        user.reset_password_hash = uuid4()
        user.reset_password_hash_created = datetime.now()
        db.session.add(user)
        db.session.commit()
        send_forgot_password_email(user)

        simple_message = SimpleMessage(ResponseMessage.RESET_PASSWORD_MAIL_SENT.value)
        return simple_message_schema.dump(simple_message), 200


class ResetPassword(MethodView):
    def post(self):
        """
        Resets a user's password.
        """
        data = parser.parse(reset_password_args, request)
        user = User.find_by_reset_password_hash(data["resetPasswordHash"])
        if not user:
            raise Unauthorized(ResponseMessage.RESET_PASSWORD_HASH_INVALID.value)
        if not user.activated:
            raise Unauthorized(ResponseMessage.USER_NOT_ACTIVATED.value)
        now = datetime.now(pytz.utc)
        hash_age = now - user.reset_password_hash_created
        # Hash must be younger than 24 hours
        if divmod(hash_age.total_seconds(), 60 * 60 * 24)[0] > 0.0:
            raise Unauthorized(ResponseMessage.RESET_PASSWORD_HASH_INVALID.value)
        if len(data["newPassword"]) < 8:
            raise BadRequest(ResponseMessage.PASSWORD_TOO_SHORT.value)
        user.password = User.generate_hash(data["newPassword"])
        user.reset_password_hash = None
        user.reset_password_hash_created = None
        db.session.add(user)
        db.session.commit()
        access_token = create_access_token(identity=user.email, additional_claims=get_access_token_claims(user))
        refresh_token = create_refresh_token(identity=user.email)
        auth_response = AuthResponse(
            ResponseMessage.PASSWORD_RESET.value, user, access_token=access_token, refresh_token=refresh_token
        )
        return auth_response_schema.dump(auth_response), 202
