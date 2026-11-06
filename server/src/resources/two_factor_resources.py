from flask import jsonify, request
from flask.views import MethodView
from webargs.flaskparser import parser

from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.simple_message_schema import simple_message_schema
from marshmallow_schemas.user_schema import user_schema
from messages.marshalling_objects import SimpleMessage
from messages.messages import ResponseMessage
from models.user import User
from resources.auth_resources import _auth_response
from util.auth_session import (
    create_session_for_user,
    current_user,
    session_required,
    set_session_cookies,
)
from util.two_factor import (
    confirm_email_setup,
    confirm_totp_setup,
    disable_email_two_factor,
    disable_totp,
    send_login_email_code,
    start_email_setup,
    start_totp_setup,
    verify_login_code,
)
from webargs_schemas.two_factor_args import (
    two_factor_code_args,
    two_factor_disable_args,
    two_factor_login_args,
    two_factor_token_args,
)


def _require_password(user: User, password: str | None):
    if user.password is None:
        return
    if not password or not User.verify_hash(password, user.password):
        raise Unauthorized(ResponseMessage.OLD_PASSWORD_INCORRECT.value)


class LoginTwoFactor(MethodView):
    def post(self):
        """
        Completes a password login with an authenticator or email code.
        """
        data = parser.parse(two_factor_login_args, request)
        user = verify_login_code(data["challengeToken"], data["code"])
        session = create_session_for_user(user)
        db.session.commit()
        response = _auth_response(ResponseMessage.LOGIN_SUCCESS.value, user, status=202)
        set_session_cookies(response, session)
        return response


class LoginTwoFactorEmail(MethodView):
    def post(self):
        """
        Emails a login code when the account has email two-factor authentication.
        """
        data = parser.parse(two_factor_token_args, request)
        send_login_email_code(data["challengeToken"])
        message = SimpleMessage(ResponseMessage.TWO_FACTOR_EMAIL_SENT.value)
        return jsonify(simple_message_schema.dump(message)), 200


class TotpTwoFactor(MethodView):
    @session_required()
    def post(self):
        """
        Starts authenticator setup and returns a secret plus a QR code.
        """
        return jsonify(start_totp_setup(current_user)), 200

    @session_required()
    def delete(self):
        """
        Turns the authenticator off. A password is required when the account has one.
        """
        data = parser.parse(two_factor_disable_args, request)
        _require_password(current_user, data.get("password"))
        disable_totp(current_user)
        return user_schema.dump(current_user), 200


class TotpConfirm(MethodView):
    @session_required()
    def post(self):
        """
        Turns the authenticator on after a valid code.
        """
        data = parser.parse(two_factor_code_args, request)
        confirm_totp_setup(current_user, data["code"])
        return user_schema.dump(current_user), 200


class EmailTwoFactor(MethodView):
    @session_required()
    def post(self):
        """
        Emails a code that must be confirmed before email two-factor authentication is on.
        """
        start_email_setup(current_user)
        message = SimpleMessage(ResponseMessage.TWO_FACTOR_EMAIL_SENT.value)
        return jsonify(simple_message_schema.dump(message)), 200

    @session_required()
    def delete(self):
        """
        Turns email two-factor authentication off. A password is required when the account has one.
        """
        data = parser.parse(two_factor_disable_args, request)
        _require_password(current_user, data.get("password"))
        disable_email_two_factor(current_user)
        return user_schema.dump(current_user), 200


class EmailTwoFactorConfirm(MethodView):
    @session_required()
    def post(self):
        """
        Turns email two-factor authentication on after the emailed code is confirmed.
        """
        data = parser.parse(two_factor_code_args, request)
        confirm_email_setup(current_user, data["code"])
        return user_schema.dump(current_user), 200
