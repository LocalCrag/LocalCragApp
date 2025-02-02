from datetime import datetime, timedelta
from uuid import uuid4

import pytz

from app import db
from messages.messages import ResponseMessage
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File
from models.user import User
from tests.conftest import admin_token


def test_successful_login(client):
    data = {"email": "admin@localcrag.invalid.org", "password": "admin"}
    rv = client.post("/api/login", json=data)
    assert rv.status_code == 202
    res = rv.json
    assert res["message"] == ResponseMessage.LOGIN_SUCCESS.value
    assert res["accessToken"] is not None
    assert res["refreshToken"] is not None
    assert res["accessToken"] != res["refreshToken"]
    assert res["user"]["email"] == data["email"]
    assert res["user"]["firstname"] == "admin"
    assert res["user"]["lastname"] == "admin"
    assert isinstance(res["user"]["id"], str)
    assert res["user"]["language"] == "de"
    assert res["user"]["timeCreated"] is not None
    assert res["user"]["avatar"] is None


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


def test_successful_access_and_refresh_logout(client, admin_token, admin_refresh_token):
    rv = client.post("/api/logout/access", token=admin_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.ACCESS_TOKEN_REVOKED.value

    rv = client.post("/api/logout/refresh", token=admin_refresh_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.REFRESH_TOKEN_REVOKED.value


def test_access_logout_without_headers(client):
    rv = client.post("/api/logout/access")
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value


def test_refresh_logout_without_headers(client):
    rv = client.post("/api/logout/refresh")
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value


def test_successful_token_refresh(client, admin_refresh_token):
    rv = client.post("/api/token/refresh", token=admin_refresh_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.LOGIN_SUCCESS.value
    assert res["accessToken"] is not None
    assert res["user"]["email"] == "admin@localcrag.invalid.org"
    assert isinstance(res["user"]["id"], str)


def test_unsuccessful_token_refresh(client, admin_token):
    rv = client.post("/api/token/refresh")
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value

    rv = client.post("/api/token/refresh", token=admin_token)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value


def test_forgot_password_wrong_email(client):
    data = {
        "email": "feliks@fengelmann.de",
    }
    rv = client.post("/api/forgot-password", json=data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.USER_NOT_FOUND.value


def test_forgot_password_successful(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    data = {
        "email": "admin@localcrag.invalid.org",
    }
    rv = client.post("/api/forgot-password", json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.RESET_PASSWORD_MAIL_SENT.value
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


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
    assert res["accessToken"] is not None
    assert res["refreshToken"] is not None
    assert res["accessToken"] != res["refreshToken"]
    assert res["user"]["email"] == user.email
    assert res["user"]["id"] == str(user.id)
    assert res["user"]["language"] == user.language
    assert res["user"]["timeCreated"] is not None
    assert res["user"]["timeUpdated"] is not None
    assert res["user"]["avatar"] is None


def test_token_user_does_not_exist(client, member_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    db.session.delete(member)

    change_pw_data = {"oldPassword": "member", "newPassword": "testPassword"}
    rv = client.put("/api/change-password", token=member_token, json=change_pw_data)
    assert rv.status_code == 401
    res = rv.json
    assert res["message"] == ResponseMessage.UNAUTHORIZED.value


def test_revoked_access_token_behaviour(client, member_token):
    rv = client.post("/api/logout/access", token=member_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.ACCESS_TOKEN_REVOKED.value
    change_pw_data = {"oldPassword": "member", "newPassword": "testPassword"}
    rv = client.put("/api/change-password", token=member_token, json=change_pw_data)
    assert rv.status_code == 401


def test_revoked_refresh_token_behaviour(client, admin_refresh_token):
    refresh_token = ""
    rv = client.post("/api/logout/refresh", token=admin_refresh_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.REFRESH_TOKEN_REVOKED.value
    rv = client.post("/api/token/refresh", token=admin_refresh_token)
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


def test_cannot_promote_admins(client, admin_token):
    user = User.find_by_email("admin@localcrag.invalid.org")
    data = {
        "promotionTarget": "USER",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=admin_token, json=data)
    assert rv.status_code == 401


def test_permission_levels(client, user_token, member_token, moderator_token):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    any_file_id = str(File.query.first().id)

    ### Test USER+MEMBER permissions
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
            "rules": "Parken nur Samstag und Sonntag.",
            "portraitImage": any_file_id,
            "lat": 12.13,
            "lng": 42.42,
            "secret": False,
            "closed": False,
            "closedReason": None,
        }

        rv = client.post("/api/crags", token=user_token, json=crag_data)
        assert rv.status_code == 401

    ### Test MODERATOR permissions
    # Test to access admin resource
    rv = client.delete(f"/api/users/{admin.id}", token=moderator_token, json=data)
    assert rv.status_code == 401

    # Test to access moderator resource
    crag_data = {
        "name": "Glees",
        "description": "Fodere et scandere.",
        "shortDescription": "Fodere et scandere 2.",
        "rules": "Parken nur Samstag und Sonntag.",
        "portraitImage": any_file_id,
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
        "closed": False,
        "closedReason": None,
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.post("/api/crags", token=moderator_token, json=crag_data)
    assert rv.status_code == 201
