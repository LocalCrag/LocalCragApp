from flask import jsonify, request
from flask.views import MethodView
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.passkey_schema import passkey_schema
from marshmallow_schemas.user_schema import user_schema
from messages.messages import ResponseMessage
from models.passkey_credential import PasskeyCredential
from models.user import User
from resources.auth_resources import _auth_response, mark_user_activated
from util.auth_session import (
    create_session_for_user,
    current_user,
    session_required,
    set_session_cookies,
)
from util.email import send_user_registered_email
from util.webauthn_passkeys import (
    authenticate_passkey,
    authentication_options,
    register_passkey,
    registration_options,
    signup_options,
    signup_with_passkey,
)
from webargs_schemas.passkey_args import (
    passkey_authentication_args,
    passkey_registration_args,
    passkey_rename_args,
)
from webargs_schemas.user_args import user_registration_args


class PasskeyRegisterOptions(MethodView):
    @session_required()
    def post(self):
        """
        Starts a WebAuthn registration ceremony for the current user.
        """
        return jsonify(registration_options(current_user))


class PasskeyRegisterVerify(MethodView):
    @session_required()
    def post(self):
        """
        Verifies a new passkey and stores it for the current user.
        """
        data = parser.parse(passkey_registration_args, request)
        credential = register_passkey(current_user, data["credential"], data.get("name"))
        return passkey_schema.dump(credential), 201


class GetPasskeys(MethodView):
    @session_required()
    def get(self):
        """
        Lists passkeys registered for the current user.
        """
        credentials = (
            PasskeyCredential.query.filter_by(user_id=current_user.id)
            .order_by(PasskeyCredential.created_at.desc())
            .all()
        )
        return jsonify(passkey_schema.dump(credentials, many=True))


class DeletePasskey(MethodView):
    @session_required()
    def delete(self, passkey_id):
        """
        Removes one of the current user's passkeys.
        """
        user = current_user
        credential = PasskeyCredential.query.filter_by(id=passkey_id, user_id=user.id).first()
        if credential is None:
            raise NotFound()
        remaining = PasskeyCredential.query.filter(
            PasskeyCredential.user_id == user.id, PasskeyCredential.id != credential.id
        ).count()
        if remaining == 0 and user.password is None:
            raise BadRequest(ResponseMessage.CANNOT_REMOVE_LAST_PASSKEY.value)
        db.session.delete(credential)
        db.session.commit()
        return "", 204

    @session_required()
    def patch(self, passkey_id):
        """
        Renames one of the current user's passkeys.
        """
        credential = PasskeyCredential.query.filter_by(id=passkey_id, user_id=current_user.id).first()
        if credential is None:
            raise NotFound()
        data = parser.parse(passkey_rename_args, request)
        name = data["name"].strip()
        if not name:
            raise BadRequest(ResponseMessage.EMAIL_INVALID.value)
        credential.name = name[:120]
        db.session.add(credential)
        db.session.commit()
        return passkey_schema.dump(credential), 200


class PasskeyLoginOptions(MethodView):
    def post(self):
        """
        Starts a discoverable WebAuthn authentication ceremony.
        """
        return jsonify(authentication_options())


class PasskeyLoginVerify(MethodView):
    def post(self):
        """
        Verifies a passkey assertion and starts a browser session.
        """
        data = parser.parse(passkey_authentication_args, request)
        user = authenticate_passkey(data["credential"])
        mark_user_activated(user)
        session = create_session_for_user(user)
        db.session.commit()
        response = _auth_response(ResponseMessage.LOGIN_SUCCESS.value, user, status=202)
        set_session_cookies(response, session)
        return response


class PasskeySignupOptions(MethodView):
    def post(self):
        """
        Starts a passkey ceremony that will create an account with no password.
        """
        data = parser.parse(user_registration_args, request)
        return jsonify(signup_options(data["firstname"], data["lastname"], data["email"]))


class PasskeySignupVerify(MethodView):
    def post(self):
        """
        Creates the account after the passkey ceremony and starts a session.
        """
        data = parser.parse(passkey_registration_args, request)
        user = signup_with_passkey(data["credential"], data.get("name"))
        admins = User.get_admins()
        user_count = User.get_user_count()
        for admin in admins:
            send_user_registered_email(user, admin, user_count)
        session = create_session_for_user(user)
        db.session.commit()
        response = _auth_response(ResponseMessage.LOGIN_SUCCESS.value, user, status=202)
        set_session_cookies(response, session)
        return response


class RemovePassword(MethodView):
    @session_required()
    def delete(self):
        """
        Removes password sign-in when the account still has a passkey.
        """
        user = current_user
        if PasskeyCredential.query.filter_by(user_id=user.id).count() < 1:
            raise BadRequest(ResponseMessage.CANNOT_REMOVE_PASSWORD.value)
        user.password = None
        db.session.add(user)
        db.session.commit()
        return user_schema.dump(user), 200
