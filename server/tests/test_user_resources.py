import json

from app import db, app
from messages.messages import ResponseMessage
from tests.utils.user_test_util import get_login_headers


def test_successful_change_password(client):
    access_headers, refresh_headers = get_login_headers(client)
    change_pw_data = {
        'oldPassword': '[vb+xLGgU?+Z]nXD3HmO',
        'newPassword': 'fengelmann2'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_CHANGED.value


def test_change_password_password_too_short(client):
    access_headers, refresh_headers = get_login_headers(client)
    change_pw_data = {
        'oldPassword': '[vb+xLGgU?+Z]nXD3HmO',
        'newPassword': '1234567'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_TOO_SHORT.value


def test_change_password_password_old_pw_incorrect(client):
    access_headers, refresh_headers = get_login_headers(client)
    change_pw_data = {
        'oldPassword': 'incorrectpassword',
        'newPassword': 'fengelmann2'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.OLD_PASSWORD_INCORRECT.value


def test_successful_get_users(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.get('/api/users', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 3
    for user in res:
        assert type(user['id']) == str
        assert type(user['firstname']) == str
        assert type(user['lastname']) == str
        assert type(user['email']) == str
        assert type(user['activated']) == bool
        assert type(user['locked']) == bool


def test_successful_resend_invite_mail_role(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.put('/api/users/3543885f-e9ef-48c5-a396-6c898fb42409/resend-user-create-mail', headers=access_headers,
                    json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None


def test_unsuccessful_resend_invite_mail_role(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.put('/api/users/1543885f-e9ef-48c5-a396-6c898fb42409/resend-user-create-mail', headers=access_headers,
                    json=None)
    assert rv.status_code == 400


def test_successful_create_user(client):
    access_headers, refresh_headers = get_login_headers(client)
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix.engelmann@fengelmann.de',
        'language': 'de',
        'avatar': None,
        'colorScheme': 'LARA_LIGHT_TEAL'
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert type(res['id']) == str
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['email'] == 'felix.engelmann@fengelmann.de'
    assert not res['activated']
    assert res['language'] == 'de'
    assert res['avatar'] is None
    assert res['colorScheme'] == 'LARA_LIGHT_TEAL'


def test_unsuccessful_create_user_email_taken(client):
    access_headers, refresh_headers = get_login_headers(client)
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'action-directe@fengelmann.de',
        'language': 'de',
        'avatar': None,
        'colorScheme': 'LARA_LIGHT_TEAL'
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 409


def test_lock_user(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Lock a user
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/lock', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None

    # Try to lock it again
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/lock', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_LOCKED.value

    # Try to log in locked user
    data = {
        'email': 'action-directe2@fengelmann.de',
        'password': '[vb+xLGgU?+Z]nXD3HmO'
    }
    rv = client.post('/api/login', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_LOCKED.value

    # Unlock a user
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/unlock', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None

    # Try to unlock it again
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/unlock', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_UNLOCKED.value

    # Try to lock yourself
    rv = client.put('/api/users/1543885f-e9ef-48c5-a396-6c898fb42409/lock', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.CANNOT_LOCK_OWN_USER.value


def test_use_tokens_of_locked_user(client):
    access_headers_locked_user, refresh_headers_locked_user = get_login_headers(client, 'action-directe2@fengelmann.de',
                                                                                '[vb+xLGgU?+Z]nXD3HmO')
    access_headers, refresh_headers = get_login_headers(client)

    # Lock the user
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/lock', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None

    # Try to load some data with locked user
    rv = client.get('/api/users', headers=access_headers_locked_user)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_LOCKED.value


def test_email_taken(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Test a taken email
    rv = client.get('/api/users/email-taken/action-directe@fengelmann.de', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is True

    # Test a free email
    rv = client.get('/api/users/email-taken/felix123456@fengelmann.de', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is False


def test_delete_own_user(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/users/1543885f-e9ef-48c5-a396-6c898fb42409', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.CANNOT_DELETE_OWN_USER.value


def test_delete_other_user(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409', headers=access_headers, json=None)
    assert rv.status_code == 204


def test_use_tokens_of_deleted_user(client):
    access_headers_deleted_user, refresh_headers_deleted_user = get_login_headers(client,
                                                                                  'action-directe2@fengelmann.de',
                                                                                  '[vb+xLGgU?+Z]nXD3HmO')
    access_headers, refresh_headers = get_login_headers(client)

    # Delete the user
    rv = client.delete('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409', headers=access_headers, json=None)
    assert rv.status_code == 204

    rv = client.get('/api/users', headers=access_headers_deleted_user)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value


def test_update_user(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'language': 'en',
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'action-directe@fengelmann.de',
        'avatar': None,  # todo when files work test to add an avatar
        'colorScheme': 'LARA_DARK_TEAL'
    }
    rv = client.put('/api/users/me', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['language'] == 'en'
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['avatar'] is None
    assert res['colorScheme'] == 'LARA_DARK_TEAL'
    assert res['email'] == 'action-directe@fengelmann.de'




def test_update_user_different_email(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'language': 'en',
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'horstpopelfritze@fengelmann.de',
        'avatar': None,
        'colorScheme': 'LARA_DARK_TEAL'
    }
    rv = client.put('/api/users/me', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['language'] == 'en'
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['avatar'] is None
    assert res['colorScheme'] == 'LARA_DARK_TEAL'
    assert res['email'] == 'horstpopelfritze@fengelmann.de'



def test_update_user_taken_email(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'language': 'en',
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'action-directe2@fengelmann.de',
        'avatar': None,
        'colorScheme': 'LARA_DARK_TEAL'
    }
    rv = client.put('/api/users/me', headers=access_headers, json=data)
    assert rv.status_code == 409
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_EXISTS.value


def test_update_user_invalid_email(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'language': 'en',
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'action-directefengelmann.de',
        'avatar': None,
        'colorScheme': 'LARA_DARK_TEAL'
    }
    rv = client.put('/api/users/me', headers=access_headers, json=data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.EMAIL_INVALID.value


def test_successful_find_users(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.get('/api/users/find/lix', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 3
    for user in res:
        assert type(user['id']) == str
        assert user['firstname'] == 'Felix'
        assert user['lastname'] == 'Engelmann'
        assert type(user['email']) == str
        assert user['locked'] == False


def test_successful_find_users_no_results(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.get('/api/users/find/sarumanthewise', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 0
