"""WebAuthn registration and authentication ceremonies."""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta
from types import SimpleNamespace
from urllib.parse import urlparse

import pytz
from flask import current_app
from sqlalchemy.exc import IntegrityError
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers.base64url_to_bytes import base64url_to_bytes
from webauthn.helpers.exceptions import (
    InvalidAuthenticationResponse,
    InvalidJSONStructure,
    InvalidRegistrationResponse,
)
from webauthn.helpers.options_to_json_dict import options_to_json_dict
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    AuthenticatorTransport,
    CredentialDeviceType,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from messages.messages import ResponseMessage
from models.account_settings import AccountSettings
from models.instance_settings import InstanceSettings
from models.passkey_credential import PasskeyCredential
from models.user import User
from models.webauthn_challenge import (
    CHALLENGE_KIND_AUTHENTICATION,
    CHALLENGE_KIND_REGISTRATION,
    CHALLENGE_KIND_SIGNUP,
    WebAuthnChallenge,
)
from util.regexes import email_regex

CHALLENGE_TTL = timedelta(minutes=5)
# Conditional UI keeps an authentication ceremony open while the login form is visible.
AUTHENTICATION_CHALLENGE_TTL = timedelta(minutes=30)


def relying_party() -> tuple[str, str, str]:
    """
    Origin, relying party id, and display name for this instance.

    The id is the hostname of FRONTEND_HOST. The origin includes scheme and port.
    """
    parsed = urlparse(current_app.config["FRONTEND_HOST"])
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise BadRequest(ResponseMessage.INTERNAL_SERVER_ERROR.value)
    settings = InstanceSettings.return_it()
    rp_name = settings.instance_name if settings is not None and settings.instance_name else "LocalCrag"
    origin = f"{parsed.scheme}://{parsed.netloc}"
    return origin, parsed.hostname, rp_name


def user_handle(user: User) -> bytes:
    user_id = user.id
    if isinstance(user_id, uuid.UUID):
        return user_id.bytes
    return uuid.UUID(str(user_id)).bytes


def display_name(user: User) -> str:
    parts = [part for part in (user.firstname, user.lastname) if part]
    name = " ".join(parts).strip()
    return name or user.email


def _purge_expired_challenges():
    now = datetime.now(pytz.utc)
    WebAuthnChallenge.query.filter(WebAuthnChallenge.expires_at < now).delete(synchronize_session=False)


def _store_challenge(challenge: bytes, kind: str, user: User | None, signup: dict | None = None) -> None:
    _purge_expired_challenges()
    ttl = AUTHENTICATION_CHALLENGE_TTL if kind == CHALLENGE_KIND_AUTHENTICATION else CHALLENGE_TTL
    row = WebAuthnChallenge(
        id=WebAuthnChallenge.generate_id(),
        challenge=challenge,
        user_id=user.id if user is not None else None,
        kind=kind,
        expires_at=datetime.now(pytz.utc) + ttl,
    )
    if signup is not None:
        row.signup_email = signup["email"]
        row.signup_firstname = signup["firstname"]
        row.signup_lastname = signup["lastname"]
        row.signup_user_id = signup["user_id"]
    db.session.add(row)
    db.session.commit()


def _transports(stored: str | None) -> list[AuthenticatorTransport] | None:
    if not stored:
        return None
    parsed: list[AuthenticatorTransport] = []
    for part in stored.split(","):
        try:
            parsed.append(AuthenticatorTransport(part))
        except ValueError:
            continue
    return parsed or None


def registration_options(user: User) -> dict:
    _origin, rp_id, rp_name = relying_party()
    existing = PasskeyCredential.query.filter_by(user_id=user.id).all()
    exclude = []
    for credential in existing:
        exclude.append(
            PublicKeyCredentialDescriptor(id=credential.credential_id, transports=_transports(credential.transports))
        )
    options = generate_registration_options(
        rp_id=rp_id,
        rp_name=rp_name,
        user_id=user_handle(user),
        user_name=user.email,
        user_display_name=display_name(user),
        exclude_credentials=exclude or None,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            require_resident_key=True,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    _store_challenge(options.challenge, CHALLENGE_KIND_REGISTRATION, user)
    return options_to_json_dict(options)


def authentication_options() -> dict:
    _origin, rp_id, _rp_name = relying_party()
    options = generate_authentication_options(
        rp_id=rp_id,
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    _store_challenge(options.challenge, CHALLENGE_KIND_AUTHENTICATION, None)
    payload = options_to_json_dict(options)
    # An empty allow list means "no credentials", which blocks discoverable passkeys.
    if not payload.get("allowCredentials"):
        payload.pop("allowCredentials", None)
    return payload


def _credential_dict(credential: dict) -> dict:
    if not isinstance(credential, dict):
        raise BadRequest(ResponseMessage.WRONG_CREDENTIALS.value)
    return credential


def _challenge_from_credential(credential: dict) -> bytes:
    try:
        client_data = base64url_to_bytes(credential["response"]["clientDataJSON"])
        payload = json.loads(client_data)
        return base64url_to_bytes(payload["challenge"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise BadRequest(ResponseMessage.WRONG_CREDENTIALS.value) from exc


def _consume_challenge(kind: str, challenge: bytes, user: User | None) -> SimpleNamespace:
    now = datetime.now(pytz.utc)
    row = WebAuthnChallenge.query.filter_by(challenge=challenge, kind=kind).with_for_update().first()
    if row is None or row.expires_at < now:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)
    if user is not None and str(row.user_id) != str(user.id):
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)
    if user is None and row.user_id is not None:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)
    consumed = SimpleNamespace(
        signup_email=row.signup_email,
        signup_firstname=row.signup_firstname,
        signup_lastname=row.signup_lastname,
        signup_user_id=row.signup_user_id,
    )
    db.session.delete(row)
    db.session.commit()
    return consumed


def _transport_value(credential: dict) -> str | None:
    response = credential.get("response") or {}
    transports = response.get("transports")
    if not isinstance(transports, list):
        return None
    kept = []
    for transport in transports:
        try:
            kept.append(AuthenticatorTransport(transport).value)
        except ValueError:
            continue
    if not kept:
        return None
    return ",".join(kept)[:255]


def _credential_name(name: str | None) -> str:
    cleaned = (name or "").strip()
    if not cleaned:
        return "Passkey"
    return cleaned[:120]


def register_passkey(user: User, credential: dict, name: str | None) -> PasskeyCredential:
    credential = _credential_dict(credential)
    challenge = _challenge_from_credential(credential)
    _consume_challenge(CHALLENGE_KIND_REGISTRATION, challenge, user)
    origin, rp_id, _rp_name = relying_party()
    try:
        verified = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin=origin,
            expected_rp_id=rp_id,
            require_user_verification=False,
        )
    except (InvalidRegistrationResponse, InvalidJSONStructure) as exc:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value) from exc

    row = _passkey_from_verification(user, verified, credential, name)
    db.session.add(row)
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise BadRequest(ResponseMessage.INTEGRITY_VIOLATION.value) from exc
    return row


def _user_handle_bytes(credential: dict) -> bytes | None:
    response = credential.get("response") or {}
    handle = response.get("userHandle")
    if not handle:
        return None
    try:
        return base64url_to_bytes(handle)
    except (TypeError, ValueError) as exc:
        raise BadRequest(ResponseMessage.WRONG_CREDENTIALS.value) from exc


def authenticate_passkey(credential: dict) -> User:
    credential = _credential_dict(credential)
    challenge = _challenge_from_credential(credential)
    _consume_challenge(CHALLENGE_KIND_AUTHENTICATION, challenge, None)
    try:
        credential_id = base64url_to_bytes(credential["rawId"])
    except (KeyError, TypeError, ValueError) as exc:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value) from exc

    stored = PasskeyCredential.query.filter_by(credential_id=credential_id).first()
    if stored is None:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)

    handle = _user_handle_bytes(credential)
    if handle != user_handle(stored.user):
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value)

    origin, rp_id, _rp_name = relying_party()
    try:
        verified = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin=origin,
            expected_rp_id=rp_id,
            credential_public_key=stored.public_key,
            credential_current_sign_count=stored.sign_count,
            require_user_verification=False,
        )
    except (InvalidAuthenticationResponse, InvalidJSONStructure) as exc:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value) from exc

    stored.sign_count = verified.new_sign_count
    stored.last_used_at = datetime.now(pytz.utc)
    stored.backed_up = bool(verified.credential_backed_up)
    stored.backup_eligible = verified.credential_device_type == CredentialDeviceType.MULTI_DEVICE
    db.session.add(stored)
    return stored.user


def signup_options(firstname: str, lastname: str, email: str) -> dict:
    """
    Starts a registration ceremony for an account that does not exist yet.

    The user row is created only after the authenticator responds, so cancelling
    the browser prompt does not leave an account with no password and no passkey.
    """
    firstname = (firstname or "").strip()
    lastname = (lastname or "").strip()
    email = (email or "").strip().lower()
    if not firstname or not lastname or not re.match(email_regex, email):
        raise BadRequest(ResponseMessage.EMAIL_INVALID.value)
    if User.find_by_email(email):
        raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

    user_id = uuid.uuid4()
    _origin, rp_id, rp_name = relying_party()
    options = generate_registration_options(
        rp_id=rp_id,
        rp_name=rp_name,
        user_id=user_id.bytes,
        user_name=email,
        user_display_name=f"{firstname} {lastname}".strip(),
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.REQUIRED,
            require_resident_key=True,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
    )
    _store_challenge(
        options.challenge,
        CHALLENGE_KIND_SIGNUP,
        None,
        {
            "email": email,
            "firstname": firstname,
            "lastname": lastname,
            "user_id": user_id,
        },
    )
    return options_to_json_dict(options)


def signup_with_passkey(credential: dict, name: str | None) -> User:
    """
    Verifies a signup ceremony and creates the user together with the passkey.
    """
    credential = _credential_dict(credential)
    challenge = _challenge_from_credential(credential)
    consumed = _consume_challenge(CHALLENGE_KIND_SIGNUP, challenge, None)
    origin, rp_id, _rp_name = relying_party()
    try:
        verified = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin=origin,
            expected_rp_id=rp_id,
            require_user_verification=False,
        )
    except (InvalidRegistrationResponse, InvalidJSONStructure) as exc:
        raise Unauthorized(ResponseMessage.WRONG_CREDENTIALS.value) from exc

    if User.find_by_email(consumed.signup_email):
        raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value)

    new_user = User()
    new_user.id = consumed.signup_user_id
    new_user.firstname = consumed.signup_firstname
    new_user.lastname = consumed.signup_lastname
    new_user.email = consumed.signup_email
    new_user.password = None
    new_user.activated = True
    new_user.activated_at = datetime.now(pytz.utc)
    db.session.add(new_user)
    db.session.flush()

    account_settings = AccountSettings()
    account_settings.user_id = new_user.id
    account_settings.language = InstanceSettings.return_it().language
    db.session.add(account_settings)
    db.session.add(_passkey_from_verification(new_user, verified, credential, name))
    try:
        db.session.commit()
    except IntegrityError as exc:
        db.session.rollback()
        raise Conflict(ResponseMessage.USER_ALREADY_EXISTS.value) from exc
    return new_user


def _passkey_from_verification(user: User, verified, credential: dict, name: str | None) -> PasskeyCredential:
    return PasskeyCredential(
        user_id=user.id,
        credential_id=verified.credential_id,
        public_key=verified.credential_public_key,
        sign_count=verified.sign_count,
        transports=_transport_value(credential),
        aaguid=verified.aaguid,
        name=_credential_name(name),
        backed_up=bool(verified.credential_backed_up),
        backup_eligible=verified.credential_device_type == CredentialDeviceType.MULTI_DEVICE,
    )
