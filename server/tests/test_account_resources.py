from messages.messages import ResponseMessage
from models.user import User


def test_delete_own_user_success(client, member_token):
    # Ensure the member exists before deletion
    assert User.find_by_email("member@localcrag.invalid.org") is not None

    rv = client.delete("/api/users/account/delete-own-user", token=member_token, json=None)
    assert rv.status_code == 204, rv.text

    # User should be deleted
    assert User.find_by_email("member@localcrag.invalid.org") is None


def test_delete_own_user_forbidden_for_superadmin(client, admin_token):
    rv = client.delete("/api/users/account/delete-own-user", token=admin_token, json=None)
    assert rv.status_code == 400, rv.text
    assert rv.json["message"] == ResponseMessage.CANNOT_DELETE_SUPERADMIN.value


def test_delete_own_user_unauthorized(client):
    rv = client.delete("/api/users/account/delete-own-user", json=None)
    assert rv.status_code == 401
