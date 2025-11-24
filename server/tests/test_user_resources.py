from datetime import datetime, timedelta
from uuid import uuid4

import pytz

from extensions import db
from messages.messages import ResponseMessage
from models.file import File
from models.user import User


def test_successful_get_user(client, member_token):
    member = User.find_by_slug("member-member")

    rv = client.get("/api/users/member-member", token=member_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == str(member.id)
    assert res["firstname"] == member.firstname
    assert res["lastname"] == member.lastname
    assert res["email"] == member.email
    assert res["language"] == member.language
    assert res["activated"] == member.activated
    assert res["admin"] == member.admin
    assert res["moderator"] == member.moderator
    assert res["member"] == member.member
    assert res["activatedAt"] == member.activated_at
    assert res["avatar"] == member.avatar


def test_successful_get_users(client, admin_token):
    users = User.query.all()

    rv = client.get("/api/users", token=admin_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == len(users)
    for user in res:
        assert isinstance(user["id"], str)
        assert isinstance(user["firstname"], str)
        assert isinstance(user["lastname"], str)
        assert isinstance(user["email"], str)
        assert isinstance(user["language"], str)
        assert isinstance(user["activated"], bool)
        assert isinstance(user["admin"], bool)
        assert isinstance(user["moderator"], bool)
        assert isinstance(user["member"], bool)
        assert isinstance(user["activatedAt"], str) or user["activatedAt"] is None
        assert isinstance(user["avatar"], dict) or user["avatar"] is None


def test_successful_resend_invite_mail_role(client, admin_token, smtp_mock):
    user = User.find_by_slug("user-user")
    user.activated = False
    db.session.add(user)

    rv = client.put(f"/api/users/{user.id}/resend-user-create-mail", token=admin_token, json=None)
    assert rv.status_code == 200, rv.text
    res = rv.json
    assert res is None
    assert smtp_mock.return_value.__enter__.return_value.login.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.quit.call_count == 1


def test_unsuccessful_resend_invite_mail_role(client, admin_token):
    user = User.find_by_slug("user-user")

    rv = client.put(f"/api/users/{user.id}/resend-user-create-mail", token=admin_token, json=None)
    assert rv.status_code == 400


def test_successful_register_user(client, member_token, smtp_mock):
    user_data = {
        "firstname": "Thorsten",
        "lastname": "Test",
        "email": "feliX.engelmann@fengelmann.de",
    }
    rv = client.post("/api/users", token=member_token, json=user_data)
    assert rv.status_code == 201
    res = rv.json
    assert isinstance(res["id"], str)
    assert res["firstname"] == "Thorsten"
    assert res["lastname"] == "Test"
    assert res["email"] == "felix.engelmann@fengelmann.de"  # expect it to be changed to lowercase
    assert not res["activated"]
    assert res["language"] == "de"
    assert res["avatar"] is None
    assert smtp_mock.return_value.__enter__.return_value.login.call_count == 2
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 2
    assert smtp_mock.return_value.__enter__.return_value.quit.call_count == 2


def test_unsuccessful_create_user_email_taken(client, member_token):
    user_data = {
        "firstname": "Thorsten",
        "lastname": "Test",
        "email": "admin@localcrag.invalid.org",
    }
    rv = client.post("/api/users", token=member_token, json=user_data)
    assert rv.status_code == 409


def test_email_taken(client, member_token):
    # Test a taken email
    rv = client.get("/api/users/email-taken/admin@localcrag.invalid.org", token=member_token, json=None)
    assert rv.status_code == 200
    assert rv.json is True

    # Test a free email
    rv = client.get("/api/users/email-taken/free-admin@localcrag.invalid.org", token=member_token, json=None)
    assert rv.status_code == 200
    assert rv.json is False


def test_delete_own_user(client, admin_token):
    rv = client.delete(f'/api/users/{User.get_id_by_slug("admin-admin")}', token=admin_token, json=None)
    assert rv.status_code == 400
    assert rv.json["message"] == ResponseMessage.CANNOT_DELETE_OWN_USER.value


def test_delete_other_user(client, admin_token):
    rv = client.delete(f'/api/users/{User.get_id_by_slug("member-member")}', token=admin_token, json=None)
    assert rv.status_code == 204


def test_update_user(client, admin_token):
    any_file = File.query.first()

    data = {
        "firstname": "Thorsten",
        "lastname": "Test",
        "email": "admin@localcrag.invalid.org",
        "avatar": str(any_file.id),
    }
    rv = client.put("/api/users/account", token=admin_token, json=data)
    assert rv.status_code == 200, rv.text
    res = rv.json
    assert res["language"] == "de"
    assert res["firstname"] == "Thorsten"
    assert res["lastname"] == "Test"
    assert res["avatar"]["id"] == str(any_file.id)
    assert res["avatar"]["originalFilename"] == str(any_file.original_filename)
    assert res["email"] == "admin@localcrag.invalid.org"


def test_update_user_different_email(client, mocker, member_token):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    data = {
        "firstname": "Thorsten",
        "lastname": "Test",
        "email": "horstpopelfritze@fengelmann.de",
        "avatar": None,
    }
    rv = client.put("/api/users/account", token=member_token, json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["language"] == "de"
    assert res["firstname"] == "Thorsten"
    assert res["lastname"] == "Test"
    assert res["avatar"] is None
    assert res["email"] == "member@localcrag.invalid.org"  # Mail only updated in a separate step
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


def test_change_email(client):
    # Manually add a hash to the user
    user: User = User.find_by_email("admin@localcrag.invalid.org")
    reset_hash = uuid4()
    user.new_email = "masteradmin@localcrag.invalid.org"
    user.new_email_hash = reset_hash
    user.new_email_hash_created = datetime.now(pytz.utc)
    db.session.add(user)

    data = {
        "newEmailHash": reset_hash,
    }
    rv = client.put("/api/users/account/change-email", json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["message"] == ResponseMessage.EMAIL_CHANGED.value
    assert res["accessToken"] is not None
    assert res["refreshToken"] is not None
    assert res["accessToken"] != res["refreshToken"]
    assert res["user"]["email"] == "masteradmin@localcrag.invalid.org"
    assert isinstance(res["user"]["id"], str)
    assert res["user"]["language"] == "de"
    assert res["user"]["timeCreated"] is not None
    assert res["user"]["timeUpdated"] is not None
    assert res["user"]["avatar"] is None


def test_change_email_invalid_token(client):
    # Manually add a hash to the user
    user: User = User.find_by_email("admin@localcrag.invalid.org")
    reset_hash = uuid4()
    user.new_email = "masteradmin@localcrag.invalid.org"
    user.new_email_hash = reset_hash
    user.new_email_hash_created = datetime.now(pytz.utc)
    db.session.add(user)

    data = {
        "newEmailHash": "lol",
    }
    rv = client.put("/api/users/account/change-email", json=data)
    assert rv.status_code == 401


def test_change_email_expired_token(client):
    # Manually add a hash to the user
    user: User = User.find_by_email("admin@localcrag.invalid.org")
    reset_hash = uuid4()
    user.new_email = "masteradmin@localcrag.invalid.org"
    user.new_email_hash = reset_hash
    user.new_email_hash_created = datetime.now(pytz.utc) - timedelta(days=1)
    db.session.add(user)

    data = {
        "newEmailHash": reset_hash,
    }
    rv = client.put("/api/users/account/change-email", json=data)
    assert rv.status_code == 401


def test_update_user_taken_email(client, member_token):
    data = {
        "firstname": "Thorsten",
        "lastname": "Test",
        "email": "user@localcrag.invalid.org",
        "avatar": None,
    }
    rv = client.put("/api/users/account", token=member_token, json=data)
    assert rv.status_code == 409
    res = rv.json
    assert res["message"] == ResponseMessage.USER_ALREADY_EXISTS.value


def test_update_user_invalid_email(client, member_token):
    data = {
        "firstname": "Thorsten",
        "lastname": "Test",
        "email": "localcragfengelmann.de",
        "avatar": None,
    }
    rv = client.put("/api/users/account", token=member_token, json=data)
    assert rv.status_code == 400
    res = rv.json
    assert res["message"] == ResponseMessage.EMAIL_INVALID.value


def test_promote_user_to_member(client, moderator_token, admin_token):
    user = User.find_by_slug("user-user")

    data = {
        "promotionTarget": "USER",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=moderator_token, json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["superadmin"] is False
    assert res["admin"] is False
    assert res["moderator"] is False
    assert res["member"] is False

    data = {
        "promotionTarget": "MEMBER",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=moderator_token, json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["superadmin"] is False
    assert res["admin"] is False
    assert res["moderator"] is False
    assert res["member"] is True

    data = {
        "promotionTarget": "MODERATOR",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=admin_token, json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["superadmin"] is False
    assert res["admin"] is False
    assert res["moderator"] is True
    assert res["member"] is True

    data = {
        "promotionTarget": "ADMIN",
    }
    rv = client.put(f"/api/users/{user.id}/promote", token=admin_token, json=data)
    assert rv.status_code == 200
    res = rv.json
    assert res["superadmin"] is False
    assert res["admin"] is True
    assert res["moderator"] is True
    assert res["member"] is True


def test_successful_get_user_grades(client):
    rv = client.get("/api/users/admin-admin/grades")
    assert rv.status_code == 200
    res = rv.json
    assert res["BOULDER"]["FB"] == {"22": 1}
