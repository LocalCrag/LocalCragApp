from types import SimpleNamespace

from models.passkey_credential import PasskeyCredential
from models.session import Session
from models.user import User
from models.webauthn_challenge import WebAuthnChallenge
from tests.virtual_passkey import VirtualPasskey

ORIGIN = "http://localhost:4200"


def _passkey_for(user: User) -> VirtualPasskey:
    from webauthn.helpers.bytes_to_base64url import bytes_to_base64url

    from util.webauthn_passkeys import user_handle

    return VirtualPasskey(bytes_to_base64url(user_handle(user)))


def test_register_passkey_requires_session(client):
    rv = client.post("/api/passkeys/register/options", json={})
    assert rv.status_code == 401


def test_register_list_login_and_delete_passkey(client, admin_token, user_token):
    user = User.find_by_email("admin@localcrag.invalid.org")
    user.activated = False
    user.activated_at = None

    options = client.post("/api/passkeys/register/options", json={}, token=admin_token)
    assert options.status_code == 200
    assert options.json["rp"]["id"] == "localhost"
    assert not options.json.get("excludeCredentials")

    authenticator = _passkey_for(user)
    registered = client.post(
        "/api/passkeys/register/verify",
        json={"credential": authenticator.registration_credential(options.json, ORIGIN), "name": "Laptop"},
        token=admin_token,
    )
    assert registered.status_code == 201
    assert registered.json["name"] == "Laptop"
    passkey_id = registered.json["id"]

    listed = client.get("/api/passkeys", token=admin_token)
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json] == [passkey_id]
    assert WebAuthnChallenge.query.count() == 0

    login_options = client.post("/api/passkeys/login/options", json={})
    assert login_options.status_code == 200
    assert not login_options.json.get("allowCredentials")
    assertion = authenticator.authentication_credential(login_options.json, ORIGIN)
    logged_in = client.post("/api/passkeys/login/verify", json={"credential": assertion})
    assert logged_in.status_code == 202
    assert logged_in.json["message"] == "LOGIN_SUCCESS"
    assert logged_in.json["user"]["email"] == user.email
    assert "lc_session=" in logged_in.headers.get("Set-Cookie", "")
    assert User.find_by_email(user.email).activated is True
    assert PasskeyCredential.query.filter_by(id=passkey_id).one().sign_count == 1

    replay = client.post("/api/passkeys/login/verify", json={"credential": assertion})
    assert replay.status_code == 401

    second_options = client.post("/api/passkeys/login/options", json={})
    cloned = authenticator.authentication_credential(second_options.json, ORIGIN, sign_count=1)
    cloned_login = client.post("/api/passkeys/login/verify", json={"credential": cloned})
    assert cloned_login.status_code == 401

    fresh_options = client.post("/api/passkeys/login/options", json={})
    fresh = authenticator.authentication_credential(fresh_options.json, ORIGIN)
    fresh_login = client.post("/api/passkeys/login/verify", json={"credential": fresh})
    assert fresh_login.status_code == 202
    assert PasskeyCredential.query.filter_by(id=passkey_id).one().sign_count == 2

    wrong_origin_options = client.post("/api/passkeys/login/options", json={})
    wrong_origin = authenticator.authentication_credential(wrong_origin_options.json, "http://evil.example")
    rejected = client.post("/api/passkeys/login/verify", json={"credential": wrong_origin})
    assert rejected.status_code == 401

    hidden = client.delete(f"/api/passkeys/{passkey_id}", token=user_token)
    assert hidden.status_code == 404
    assert PasskeyCredential.query.filter_by(id=passkey_id).count() == 1

    deleted = client.delete(f"/api/passkeys/{passkey_id}", token=admin_token)
    assert deleted.status_code == 204
    assert PasskeyCredential.query.count() == 0

    after_delete_options = client.post("/api/passkeys/login/options", json={})
    after_delete = authenticator.authentication_credential(after_delete_options.json, ORIGIN)
    denied = client.post("/api/passkeys/login/verify", json={"credential": after_delete})
    assert denied.status_code == 401


def _session_auth(user: User):
    row = Session.query.filter_by(user_id=user.id).order_by(Session.created_at.desc()).first()
    return SimpleNamespace(session_id=row.id, csrf_token=row.csrf_token)


def test_passkey_only_account_rename_and_password(client, admin_token):
    denied = client.put("/api/change-password", json={"newPassword": "whatever1"}, token=admin_token)
    assert denied.status_code == 401

    email = "passkey-only@localcrag.invalid.org"
    before = User.query.count()
    options = client.post(
        "/api/passkeys/signup/options",
        json={"firstname": "Ada", "lastname": "Lovelace", "email": email},
    )
    assert options.status_code == 200
    assert User.query.count() == before

    authenticator = VirtualPasskey(options.json["user"]["id"])
    created = client.post(
        "/api/passkeys/signup/verify",
        json={"credential": authenticator.registration_credential(options.json, ORIGIN), "name": "Phone"},
    )
    assert created.status_code == 202
    assert created.json["user"]["hasPassword"] is False
    assert created.json["user"]["email"] == email
    assert "lc_session=" in created.headers.get("Set-Cookie", "")

    user = User.find_by_email(email)
    assert user.password is None
    assert user.activated is True
    auth = _session_auth(user)

    password_login = client.post("/api/login", json={"email": email, "password": "not-a-password"})
    assert password_login.status_code == 401

    login_options = client.post("/api/passkeys/login/options", json={})
    assertion = authenticator.authentication_credential(login_options.json, ORIGIN)
    logged_in = client.post("/api/passkeys/login/verify", json={"credential": assertion})
    assert logged_in.status_code == 202

    passkey_id = PasskeyCredential.query.filter_by(user_id=user.id).one().id
    renamed = client.patch(f"/api/passkeys/{passkey_id}", json={"name": "  Phone key  "}, token=auth)
    assert renamed.status_code == 200
    assert renamed.json["name"] == "Phone key"
    hidden = client.patch(f"/api/passkeys/{passkey_id}", json={"name": "Nope"}, token=admin_token)
    assert hidden.status_code == 404

    blocked = client.delete(f"/api/passkeys/{passkey_id}", token=auth)
    assert blocked.status_code == 400
    assert blocked.json["message"] == "CANNOT_REMOVE_LAST_PASSKEY"

    changed = client.put("/api/change-password", json={"newPassword": "new-password"}, token=auth)
    assert changed.status_code == 201
    assert User.find_by_email(email).password is not None
    with_password = client.post("/api/login", json={"email": email, "password": "new-password"})
    assert with_password.status_code == 202
    assert with_password.json["user"]["hasPassword"] is True

    removed = client.delete("/api/account/password", token=auth)
    assert removed.status_code == 200
    assert removed.json["hasPassword"] is False
    assert User.find_by_email(email).password is None
    denied_again = client.post("/api/login", json={"email": email, "password": "new-password"})
    assert denied_again.status_code == 401

    restored = client.put("/api/change-password", json={"newPassword": "another-password"}, token=auth)
    assert restored.status_code == 201
    deleted = client.delete(f"/api/passkeys/{passkey_id}", token=auth)
    assert deleted.status_code == 204
    keep_password = client.delete("/api/account/password", token=auth)
    assert keep_password.status_code == 400
    assert keep_password.json["message"] == "CANNOT_REMOVE_PASSWORD"

    duplicate = client.post(
        "/api/passkeys/signup/options",
        json={"firstname": "Ada", "lastname": "Lovelace", "email": "admin@localcrag.invalid.org"},
    )
    assert duplicate.status_code == 409
