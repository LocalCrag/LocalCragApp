from datetime import datetime
from uuid import uuid4

import pytz
from flask import jsonify, request
from flask.views import MethodView
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.auth_response_schema import auth_response_schema
from marshmallow_schemas.simple_message_schema import simple_message_schema
from messages.marshalling_objects import AuthResponse, SimpleMessage
from messages.messages import ResponseMessage
from models.user import User
from util.auth_session import (
    clear_request_session_cache,
    clear_session_cookies,
    create_session_for_user,
    load_request_session,
    session_required,
    set_session_cookies,
)
from util.email import send_forgot_password_email
from webargs_schemas.forgot_password_args import forgot_password_args
from webargs_schemas.login_args import login_args
from webargs_schemas.reset_password_args import reset_password_args


def _auth_response(message: str, user: User, status: int = 200):
    body = auth_response_schema.dump(AuthResponse(message, user))
    response = jsonify(body)
    response.status_code = status
    return response


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
            # A user becomes activated after first login
            if not current_user.activated:
                current_user.activated = True
                current_user.activated_at = datetime.now(pytz.utc)
                db.session.add(current_user)
                db.session.commit()

            session = create_session_for_user(current_user)
            db.session.commit()
            response = _auth_response(ResponseMessage.LOGIN_SUCCESS.value, current_user, status=202)
            set_session_cookies(response, session)
            return response
        else:
            raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)


class UserLogout(MethodView):
    @session_required()
    def post(self):
        """
        Ends the current browser session.
        """
        session = load_request_session()
        if session is not None:
            session.delete()
            db.session.commit()
            clear_request_session_cache()
        simple_message = SimpleMessage(ResponseMessage.ACCESS_TOKEN_REVOKED.value)
        response = jsonify(simple_message_schema.dump(simple_message))
        clear_session_cookies(response)
        return response, 200


class CurrentUser(MethodView):
    def get(self):
        """
        Returns the user for the current session cookie, or 401 if unauthenticated.
        """
        session = load_request_session()
        if session is None:
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
        return _auth_response(ResponseMessage.LOGIN_SUCCESS.value, session.user)


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

        # If the user is not yet activated, we may need to activate him
        # (could be that he used forgot password before first regular login)
        user.activated = True
        if not user.activated_at:
            user.activated_at = datetime.now(pytz.utc)

        db.session.add(user)
        db.session.commit()
        session = create_session_for_user(user)
        db.session.commit()
        response = _auth_response(ResponseMessage.PASSWORD_RESET.value, user, status=202)
        set_session_cookies(response, session)
        return response
