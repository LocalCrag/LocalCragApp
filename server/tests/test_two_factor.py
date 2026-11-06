import time
from datetime import datetime
from uuid import uuid4

import pytz

from app import db
from models.session import Session
from models.two_factor_challenge import TwoFactorChallenge
from models.user import User
from util.two_factor import _decode_secret, _hotp

ORIGIN = "http://localhost:4200"


def _totp(secret: str, step: int = 0) -> str:
    return _hotp(_decode_secret(secret), int(time.time()) // 30 + step)


def _enable_totp(client, token) -> str:
    started = client.post("/api/account/two-factor/totp", token=token)
    assert started.status_code == 200
    secret = started.json["secret"]
    assert started.json["qrCode"].startswith("data:image/png;base64,")
    confirmed = client.post(
        "/api/account/two-factor/totp/confirm",
        json={"code": _totp(secret)},
        token=token,
    )
    assert confirmed.status_code == 200
    assert confirmed.json["totpEnabled"] is True
    assert confirmed.json["emailTwoFactorEnabled"] is False
    return secret


def test_totp_is_required_for_password_login_and_skipped_for_passkeys(client, admin_token):
    secret = _enable_totp(client, admin_token)
    rejected = client.post(
        "/api/account/two-factor/totp/confirm",
        json={"code": "000000"},
        token=admin_token,
    )
    assert rejected.status_code == 400
    assert rejected.json["message"] == "TWO_FACTOR_CODE_INVALID"

    logged_in = client.post(
        "/api/login",
        json={"email": "admin@localcrag.invalid.org", "password": "admin"},
    )
    assert logged_in.status_code == 202
    assert logged_in.json["message"] == "LOGIN_TWO_FACTOR_REQUIRED"
    assert logged_in.json["totpEnabled"] is True
    assert logged_in.json["emailSent"] is False
    assert "lc_session=" not in logged_in.headers.get("Set-Cookie", "")

    challenge = logged_in.json["challengeToken"]
    wrong = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": "000000"})
    assert wrong.status_code == 401
    assert wrong.json["message"] == "TWO_FACTOR_CODE_INVALID"

    login_code = _totp(secret, step=1)
    completed = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": login_code})
    assert completed.status_code == 202
    assert completed.json["message"] == "LOGIN_SUCCESS"
    assert "lc_session=" in completed.headers.get("Set-Cookie", "")
    assert TwoFactorChallenge.query.count() == 0

    reused = client.post("/api/login", json={"email": "admin@localcrag.invalid.org", "password": "admin"})
    replay = client.post(
        "/api/login/two-factor",
        json={"challengeToken": reused.json["challengeToken"], "code": login_code},
    )
    assert replay.status_code == 401

    user = User.find_by_email("admin@localcrag.invalid.org")
    from tests.test_passkey_resources import _passkey_for

    options = client.post("/api/passkeys/register/options", json={}, token=admin_token)
    authenticator = _passkey_for(user)
    registered = client.post(
        "/api/passkeys/register/verify",
        json={"credential": authenticator.registration_credential(options.json, ORIGIN), "name": "Laptop"},
        token=admin_token,
    )
    assert registered.status_code == 201
    login_options = client.post("/api/passkeys/login/options", json={})
    assertion = authenticator.authentication_credential(login_options.json, ORIGIN)
    passkey_login = client.post("/api/passkeys/login/verify", json={"credential": assertion})
    assert passkey_login.status_code == 202
    assert passkey_login.json["message"] == "LOGIN_SUCCESS"


def test_email_code_and_disabling_two_factor(client, admin_token, mocker):
    codes = mocker.patch("util.two_factor.generate_numeric_code", return_value="654321")
    sent = client.post("/api/account/two-factor/email", token=admin_token)
    assert sent.status_code == 200
    assert sent.json["message"] == "TWO_FACTOR_EMAIL_SENT"
    confirmed = client.post("/api/account/two-factor/email/confirm", json={"code": "654321"}, token=admin_token)
    assert confirmed.status_code == 200
    assert confirmed.json["emailTwoFactorEnabled"] is True

    codes.return_value = "111111"
    logged_in = client.post("/api/login", json={"email": "admin@localcrag.invalid.org", "password": "admin"})
    assert logged_in.json["emailSent"] is True
    assert logged_in.json["totpEnabled"] is False
    challenge = logged_in.json["challengeToken"]
    completed = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": "111111"})
    assert completed.status_code == 202
    assert completed.json["user"]["emailTwoFactorEnabled"] is True

    missing_password = client.delete("/api/account/two-factor/email", json={}, token=admin_token)
    assert missing_password.status_code == 401
    disabled = client.delete("/api/account/two-factor/email", json={"password": "admin"}, token=admin_token)
    assert disabled.status_code == 200
    assert disabled.json["emailTwoFactorEnabled"] is False
    plain = client.post("/api/login", json={"email": "admin@localcrag.invalid.org", "password": "admin"})
    assert plain.json["message"] == "LOGIN_SUCCESS"


def test_authenticator_can_fall_back_to_email(client, admin_token, mocker):
    secret = _enable_totp(client, admin_token)
    codes = mocker.patch("util.two_factor.generate_numeric_code", return_value="222222")
    confirmed = client.post("/api/account/two-factor/email/confirm", json={"code": "222222"}, token=admin_token)
    assert confirmed.status_code == 400
    sent = client.post("/api/account/two-factor/email", token=admin_token)
    assert sent.status_code == 200
    codes.return_value = "333333"
    confirmed = client.post("/api/account/two-factor/email/confirm", json={"code": "222222"}, token=admin_token)
    assert confirmed.json["totpEnabled"] is True
    assert confirmed.json["emailTwoFactorEnabled"] is True

    logged_in = client.post("/api/login", json={"email": "admin@localcrag.invalid.org", "password": "admin"})
    assert logged_in.json["emailSent"] is False
    challenge = logged_in.json["challengeToken"]
    unavailable = client.post("/api/login/two-factor/email", json={"challengeToken": "missing"})
    assert unavailable.status_code == 401
    emailed = client.post("/api/login/two-factor/email", json={"challengeToken": challenge})
    assert emailed.status_code == 200
    by_email = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": "333333"})
    assert by_email.status_code == 202

    again = client.post("/api/login", json={"email": "admin@localcrag.invalid.org", "password": "admin"})
    by_totp = client.post(
        "/api/login/two-factor",
        json={"challengeToken": again.json["challengeToken"], "code": _totp(secret, step=1)},
    )
    assert by_totp.status_code == 202


def test_too_many_wrong_codes_invalidate_the_challenge(client, admin_token):
    secret = _enable_totp(client, admin_token)
    logged_in = client.post("/api/login", json={"email": "admin@localcrag.invalid.org", "password": "admin"})
    challenge = logged_in.json["challengeToken"]
    for _ in range(4):
        wrong = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": "000000"})
        assert wrong.json["message"] == "TWO_FACTOR_CODE_INVALID"
    locked = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": "000000"})
    assert locked.json["message"] == "TWO_FACTOR_CHALLENGE_INVALID"
    late = client.post("/api/login/two-factor", json={"challengeToken": challenge, "code": _totp(secret)})
    assert late.status_code == 401
    assert TwoFactorChallenge.query.count() == 0


def test_password_reset_still_requires_two_factor(client, admin_token):
    _enable_totp(client, admin_token)
    user = User.find_by_email("admin@localcrag.invalid.org")
    user.reset_password_hash = str(uuid4())
    user.reset_password_hash_created = datetime.now(pytz.utc)
    db.session.add(user)
    db.session.commit()
    reset = client.post(
        "/api/reset-password",
        json={"resetPasswordHash": user.reset_password_hash, "newPassword": "new-password"},
    )
    assert reset.status_code == 202
    assert reset.json["message"] == "LOGIN_TWO_FACTOR_REQUIRED"
    assert Session.query.filter_by(user_id=user.id).count() == 1
