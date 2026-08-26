from datetime import datetime, timedelta
from uuid import uuid4

import pytz

from app import db
from messages.messages import ResponseMessage
from models.enums.map_marker_type_enum import MapMarkerType
from models.session import Session
from models.user import User


def test_successful_login(client):
    data = {"email": "admin@localcrag.invalid.org", "password": "admin"}
    rv = client.post("/api/login", json=data)
    assert rv.status_code == 202
    res = rv.json
    assert res["message"] == ResponseMessage.LOGIN_SUCCESS.value
    assert "accessToken" not in res
    assert "refreshToken" not in res
    assert res["user"]["email"] == data["email"]
    assert res["user"]["firstname"] == "admin"
    assert res["user"]["lastname"] == "admin"
    assert isinstance(res["user"]["id"], str)
    assert res["user"]["accountLanguage"] == "en"
    assert res["user"]["timeCreated"] is not None
    assert res["user"]["avatar"] is None
    assert "lc_session=" in rv.headers.get("Set-Cookie", "")
    assert "lc_csrf=" in rv.headers.getlist("Set-Cookie")[0] or any(
        "lc_csrf=" in c for c in rv.headers.getlist("Set-Cookie")
    )


def test_unsuccessful_login(client):
    data = {"email": "admin@localcrag.invalid.org", "password": "wrongpw"}
    rv_wrong_pw = client.post("/api/login", json=data)
    assert rv_wrong_pw.status_code == 401
    res_wrong_pw = rv_wrong_pw.json
    assert res_wrong_pw["message"] == ResponseMessage.WRONG_CREDENTIALS.value

    data = {"email": "wrongadmin@localcrag.invalid.org", "password": "admin"}
    rv_wrong_email = client.post("/api/login", json=data)
    assert rv_wrong_email.status_code == 401
    res_wrong_email = rv_wrong_email.json
    assert res_wrong_email["message"] == ResponseMessage.WRONG_CREDENTIALS.value


def test_successful_logout(client, admin_token):
    rv = client.post("/api/logout", token=admin_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.ACCESS_TOKEN_REVOKED.value
    assert Session.query.filter_by(id=admin_token.session_id).first() is None


def test_logout_without_session(client):
    rv = client.post("/api/logout")
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value


def test_me_with_session(client, admin_token):
    rv = client.get("/api/me", token=admin_token)
    assert rv.status_code == 200
    assert rv.json["user"]["email"] == "admin@localcrag.invalid.org"


def test_me_without_session(client):
    rv = client.get("/api/me")
    assert rv.status_code == 401


def test_csrf_required_for_mutating_authenticated_request(client, admin_token):
    rv = client.post(
        "/api/logout",
        headers={
            "Cookie": f"lc_session={admin_token.session_id}; lc_csrf={admin_token.csrf_token}",
            # deliberately omit X-CSRF-Token
        },
    )
    assert rv.status_code == 401


def test_forgot_password_wrong_email(client):
    data = {
        "email": "feliks@fengelmann.de",
    }
    rv = client.post("/api/forgot-password", json=data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.USER_NOT_FOUND.value


def test_forgot_password_successful(client, smtp_mock):
    data = {
        "email": "admin@localcrag.invalid.org",
    }
    rv = client.post("/api/forgot-password", json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.RESET_PASSWORD_MAIL_SENT.value
    assert smtp_mock.return_value.__enter__.return_value.login.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.quit.call_count == 1


def test_reset_password_hash_not_found(client):
    data = {"resetPasswordHash": "abcdefg", "newPassword": "wgowieuhgfwoeughweoguhwegiwhe"}
    rv = client.post("/api/reset-password", json=data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.RESET_PASSWORD_HASH_INVALID.value


def test_reset_password_hash_expired(client):
    # Manually add a hash with expired date to the user
    user = User.find_by_email("admin@localcrag.invalid.org")
    reset_hash = uuid4()
    user.reset_password_hash = reset_hash
    user.reset_password_hash_created = datetime.now(pytz.utc) - timedelta(hours=24, seconds=1)
    db.session.add(user)
    db.session.commit()

    data = {"resetPasswordHash": reset_hash, "newPassword": "wgowieuhgfwoeughweoguhwegiwhe"}
    rv = client.post("/api/reset-password", json=data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.RESET_PASSWORD_HASH_INVALID.value


def test_reset_password_password_too_short(client):
    # Manually add a hash to the user
    user = User.find_by_email("admin@localcrag.invalid.org")
    reset_hash = uuid4()
    user.reset_password_hash = reset_hash
    user.reset_password_hash_created = datetime.now(pytz.utc)
    db.session.add(user)
    db.session.commit()

    data = {"resetPasswordHash": reset_hash, "newPassword": "1234567"}
    rv = client.post("/api/reset-password", json=data)
    assert rv.status_code == 400
    res = rv.json
    assert res["message"] == ResponseMessage.PASSWORD_TOO_SHORT.value


def test_reset_password_success(client):
    # Manually add a hash to the user
    user = User.find_by_email("admin@localcrag.invalid.org")
    reset_hash = uuid4()
    user.reset_password_hash = reset_hash
    user.reset_password_hash_created = datetime.now(pytz.utc)
    db.session.add(user)
    db.session.commit()

    data = {"resetPasswordHash": reset_hash, "newPassword": "wgowieuhgfwoeughweoguhwegiwhe"}
    rv = client.post("/api/reset-password", json=data)
    assert rv.status_code == 202
    res = rv.json
    assert res["message"] == ResponseMessage.PASSWORD_RESET.value
    assert "accessToken" not in res
    assert res["user"]["email"] == user.email
    assert res["user"]["id"] == str(user.id)
    assert res["user"]["accountLanguage"] == user.account_settings.language
    assert res["user"]["timeCreated"] is not None
    assert res["user"]["timeUpdated"] is not None
    assert res["user"]["avatar"] is None
    assert any("lc_session=" in c for c in rv.headers.getlist("Set-Cookie"))


def test_token_user_does_not_exist(client, member_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    db.session.delete(member)

    change_pw_data = {"oldPassword": "member", "newPassword": "testPassword"}
    rv = client.put("/api/change-password", token=member_token, json=change_pw_data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value


def test_logged_out_session_rejected(client, member_token):
    from util.auth_session import CSRF_COOKIE_NAME, SESSION_COOKIE_NAME

    stale_session_id = member_token.session_id
    stale_csrf = member_token.csrf_token
    rv = client.post("/api/logout", token=member_token)
    assert rv.status_code == 200
    assert Session.query.filter_by(id=stale_session_id).first() is None

    client.set_cookie(SESSION_COOKIE_NAME, stale_session_id)
    client.set_cookie(CSRF_COOKIE_NAME, stale_csrf)
    change_pw_data = {"oldPassword": "member", "newPassword": "testPassword"}
    rv = client.put(
        "/api/change-password",
        headers={
            "Cookie": f"{SESSION_COOKIE_NAME}={stale_session_id}; {CSRF_COOKIE_NAME}={stale_csrf}",
            "X-CSRF-Token": stale_csrf,
        },
        json=change_pw_data,
    )
    assert rv.status_code == 401


def test_successful_change_password(client, member_token):
    change_pw_data = {"oldPassword": "member", "newPassword": "[vb+xLGgU?+Z]nXD3HmO"}
    rv = client.put("/api/change-password", token=member_token, json=change_pw_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["message"] == ResponseMessage.PASSWORD_CHANGED.value


def test_change_password_password_too_short(client, member_token):
    change_pw_data = {"oldPassword": "member", "newPassword": "1234567"}
    rv = client.put("/api/change-password", token=member_token, json=change_pw_data)
    assert rv.status_code == 400
    res = rv.json
    assert res["message"] == ResponseMessage.PASSWORD_TOO_SHORT.value


def test_change_password_password_old_pw_incorrect(client, member_token):
    change_pw_data = {"oldPassword": "incorrectpassword", "newPassword": "fengelmann2"}
    rv = client.put("/api/change-password", token=member_token, json=change_pw_data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.OLD_PASSWORD_INCORRECT.value


def test_cannot_promote_superadmins(client, admin_token):
    user = User.find_by_email("superadmin@localcrag.invalid.org")
    data = {
        "promotionTarget": "USER",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=admin_token, json=data)
    assert rv.status_code == 401


def test_cannot_promote_own_user(client, admin_token):
    user = User.find_by_email("admin@localcrag.invalid.org")
    data = {
        "promotionTarget": "USER",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=admin_token, json=data)
    assert rv.status_code == 409


def test_permission_levels(client, user_token, member_token, moderator_token, any_file):
    admin = User.find_by_email("admin@localcrag.invalid.org")

    # Test USER+MEMBER permissions
    for tok in [user_token, member_token]:
        data = {"promotionTarget": "MODERATOR"}

        # Test to access admin resource
        rv = client.delete(f"/api/users/{admin.id}", token=tok, json=data)
        assert rv.status_code == 401

        # Test to access moderator resource
        crag_data = {
            "name": "Glees",
            "description": "Fodere et scandere.",
            "shortDescription": "Fodere et scandere 2.",
            "rules": "Parking only on Saturday and Sunday.",
            "rulesTitle": None,
            "portraitImage": str(any_file.id),
            "lat": 12.13,
            "lng": 42.42,
            "secret": False,
            "blocweatherUrl": None,
            "closureSchedules": [],
        }

        rv = client.post("/api/crags", token=user_token, json=crag_data)
        assert rv.status_code == 401

    # Test MODERATOR permissions
    # Test to access admin resource
    rv = client.delete(f"/api/users/{admin.id}", token=moderator_token, json=data)
    assert rv.status_code == 401

    # Test to access moderator resource
    crag_data = {
        "name": "Glees",
        "description": "Fodere et scandere.",
        "shortDescription": "Fodere et scandere 2.",
        "rules": "Parking only on Saturday and Sunday.",
        "rulesTitle": None,
        "portraitImage": str(any_file.id),
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.CRAG.value,
                "description": None,
                "name": None,
            }
        ],
        "secret": False,
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
        "blocweatherUrl": None,
        "closureSchedules": [],
    }

    rv = client.post("/api/crags", token=moderator_token, json=crag_data)
    assert rv.status_code == 201


def test_passlib_compatibility():
    # passlib.hash.pbkdf2_sha256.hash("abc")
    hash1 = "$pbkdf2-sha256$29000$2HtPiVGKEcKYU2pt7R1jTA$wXMP6Wpr6FdM2Pnb.bMG0nVBmBmaX6WzPm2g0.GVHIU"
    # passlib.hash.pbkdf2_sha256.hash("⚡🏜️🦥")
    hash2 = "$pbkdf2-sha256$29000$bo3xvtc6pzTm/F9L6V2LMQ$9voplTQmhlXiJakG38j/e5QMOGZmfA5xbQtE2Xf5XKE"
    assert User.verify_hash("abc", hash1), "Hashing compatilibity error"
    assert User.verify_hash("⚡🏜️🦥", hash2), "Unicode hashing compatibility error"
