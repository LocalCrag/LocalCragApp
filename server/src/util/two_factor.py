import base64
import hashlib
import hmac
import io
import secrets
import struct
import time
import urllib.parse
from datetime import datetime, timedelta

import pytz
import qrcode
from flask import current_app

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from messages.messages import ResponseMessage
from models.instance_settings import InstanceSettings
from models.two_factor_challenge import TwoFactorChallenge
from models.user import User
from util.email import send_two_factor_email

CHALLENGE_TTL = timedelta(minutes=10)
EMAIL_CODE_TTL = timedelta(minutes=10)
MAX_ATTEMPTS = 5


def user_has_two_factor(user: User) -> bool:
    return bool(user.totp_secret) or bool(user.email_two_factor_enabled)


def generate_numeric_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def hash_code(code: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.sha256(f"{salt}:{code}".encode()).hexdigest()
    return f"{salt}${digest}"


def code_matches(stored: str | None, code: str) -> bool:
    if not stored or "$" not in stored:
        return False
    salt, digest = stored.split("$", 1)
    candidate = hashlib.sha256(f"{salt}:{code.strip()}".encode()).hexdigest()
    return secrets.compare_digest(candidate, digest)


def _decode_secret(secret: str) -> bytes:
    padded = secret.strip().upper()
    padded += "=" * ((8 - len(padded) % 8) % 8)
    return base64.b32decode(padded, casefold=True)


def _hotp(secret: bytes, counter: int) -> str:
    digest = hmac.new(secret, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    window = bytes(digest[index] for index in range(offset, offset + 4))
    binary = struct.unpack(">I", window)[0] & 0x7FFFFFFF
    return f"{binary % 1_000_000:06d}"


def match_totp(secret: str | None, code: str, last_counter: int | None) -> int | None:
    """
    Returns the matched time counter, or None. A counter at or below last_counter is rejected
    so the same authenticator code cannot be used twice.
    """
    if not secret:
        return None
    normalized = code.strip()
    if len(normalized) != 6 or not normalized.isdigit():
        return None
    key = _decode_secret(secret)
    current = int(time.time()) // 30
    for counter in (current - 1, current, current + 1):
        if last_counter is not None and counter <= last_counter:
            continue
        if secrets.compare_digest(_hotp(key, counter), normalized):
            return counter
    return None


def provisioning_uri(secret: str, email: str, issuer: str) -> str:
    label = urllib.parse.quote(f"{issuer}:{email}")
    query = urllib.parse.urlencode(
        {"secret": secret, "issuer": issuer, "algorithm": "SHA1", "digits": "6", "period": "30"}
    )
    return f"otpauth://totp/{label}?{query}"


def qr_data_uri(data: str) -> str:
    image = qrcode.make(data)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def _now() -> datetime:
    return datetime.now(pytz.utc)


def _aware(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is None:
        return pytz.utc.localize(value)
    return value


def issuer_name() -> str:
    settings = InstanceSettings.return_it()
    name = (settings.instance_name or "").strip() if settings else ""
    return name or current_app.config.get("INSTANCE_NAME") or "LocalCrag"


def start_totp_setup(user: User) -> dict:
    secret = generate_totp_secret()
    user.totp_pending_secret = secret
    db.session.add(user)
    db.session.commit()
    uri = provisioning_uri(secret, user.email, issuer_name())
    return {"secret": secret, "otpauthUri": uri, "qrCode": qr_data_uri(uri)}


def confirm_totp_setup(user: User, code: str) -> None:
    counter = match_totp(user.totp_pending_secret, code, None)
    if counter is None:
        raise BadRequest(ResponseMessage.TWO_FACTOR_CODE_INVALID.value)
    user.totp_secret = user.totp_pending_secret
    user.totp_pending_secret = None
    user.totp_last_counter = counter
    db.session.add(user)
    db.session.commit()


def disable_totp(user: User) -> None:
    user.totp_secret = None
    user.totp_pending_secret = None
    user.totp_last_counter = None
    db.session.add(user)
    db.session.commit()


def start_email_setup(user: User) -> None:
    code = generate_numeric_code()
    user.email_two_factor_setup_hash = hash_code(code)
    user.email_two_factor_setup_expires = _now() + EMAIL_CODE_TTL
    db.session.add(user)
    db.session.commit()
    send_two_factor_email(user, code)


def confirm_email_setup(user: User, code: str) -> None:
    expires = _aware(user.email_two_factor_setup_expires)
    if not user.email_two_factor_setup_hash or expires is None or expires < _now():
        raise BadRequest(ResponseMessage.TWO_FACTOR_CODE_INVALID.value)
    if not code_matches(user.email_two_factor_setup_hash, code):
        raise BadRequest(ResponseMessage.TWO_FACTOR_CODE_INVALID.value)
    user.email_two_factor_enabled = True
    user.email_two_factor_setup_hash = None
    user.email_two_factor_setup_expires = None
    db.session.add(user)
    db.session.commit()


def disable_email_two_factor(user: User) -> None:
    user.email_two_factor_enabled = False
    user.email_two_factor_setup_hash = None
    user.email_two_factor_setup_expires = None
    db.session.add(user)
    db.session.commit()


def begin_password_two_factor(user: User) -> dict:
    now = _now()
    TwoFactorChallenge.query.filter(
        TwoFactorChallenge.user_id == user.id,
        TwoFactorChallenge.expires_at < now,
    ).delete()
    challenge = TwoFactorChallenge(
        id=TwoFactorChallenge.generate_id(),
        user_id=user.id,
        expires_at=now + CHALLENGE_TTL,
        attempts=0,
    )
    email_sent = False
    if user.email_two_factor_enabled and not user.totp_secret:
        code = generate_numeric_code()
        challenge.email_code_hash = hash_code(code)
        challenge.email_code_expires_at = now + EMAIL_CODE_TTL
        email_sent = True
    else:
        code = None
    db.session.add(challenge)
    db.session.commit()
    if email_sent:
        send_two_factor_email(user, code)
    return {
        "message": ResponseMessage.LOGIN_TWO_FACTOR_REQUIRED.value,
        "challengeToken": challenge.id,
        "totpEnabled": user.totp_secret is not None,
        "emailTwoFactorEnabled": bool(user.email_two_factor_enabled),
        "emailSent": email_sent,
    }


def _load_challenge(token: str) -> TwoFactorChallenge:
    challenge = TwoFactorChallenge.query.filter_by(id=token).first()
    if challenge is None or _aware(challenge.expires_at) < _now():
        if challenge is not None:
            db.session.delete(challenge)
            db.session.commit()
        raise Unauthorized(ResponseMessage.TWO_FACTOR_CHALLENGE_INVALID.value)
    return challenge


def send_login_email_code(token: str) -> None:
    challenge = _load_challenge(token)
    user = challenge.user
    if not user.email_two_factor_enabled:
        raise BadRequest(ResponseMessage.TWO_FACTOR_NOT_AVAILABLE.value)
    code = generate_numeric_code()
    challenge.email_code_hash = hash_code(code)
    challenge.email_code_expires_at = _now() + EMAIL_CODE_TTL
    db.session.add(challenge)
    db.session.commit()
    send_two_factor_email(user, code)


def verify_login_code(token: str, code: str) -> User:
    challenge = _load_challenge(token)
    user = challenge.user
    counter = match_totp(user.totp_secret, code, user.totp_last_counter)
    email_ok = False
    if counter is None and user.email_two_factor_enabled and challenge.email_code_hash:
        expires = _aware(challenge.email_code_expires_at)
        email_ok = expires is not None and expires >= _now() and code_matches(challenge.email_code_hash, code)
    if counter is None and not email_ok:
        challenge.attempts += 1
        if challenge.attempts >= MAX_ATTEMPTS:
            db.session.delete(challenge)
            db.session.commit()
            raise Unauthorized(ResponseMessage.TWO_FACTOR_CHALLENGE_INVALID.value)
        db.session.add(challenge)
        db.session.commit()
        raise Unauthorized(ResponseMessage.TWO_FACTOR_CODE_INVALID.value)
    if counter is not None:
        user.totp_last_counter = counter
        db.session.add(user)
    db.session.delete(challenge)
    return user
