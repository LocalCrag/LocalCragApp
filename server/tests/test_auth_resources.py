import json
from datetime import datetime, timedelta
from uuid import uuid4

import pytz

from app import db, app
from messages.messages import ResponseMessage
from models.user import User
from tests.utils.user_test_util import get_login_headers


def test_successful_login(client):
    data = {
        'email': 'action-directe@fengelmann.de',
        'password': '[vb+xLGgU?+Z]nXD3HmO'
    }
    rv = client.post('/api/login', json=data)
    assert rv.status_code == 202
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.LOGIN_SUCCESS.value
    assert res['accessToken'] is not None
    assert res['refreshToken'] is not None
    assert res['accessToken'] != res['refreshToken']
    assert res['user']['email'] == 'action-directe@fengelmann.de'
    assert res['user']['firstname'] == 'Felix'
    assert res['user']['lastname'] == 'Engelmann'
    assert isinstance(res['user']['id'], str)
    assert res['user']['colorScheme'] == 'LARA_LIGHT_TEAL'
    assert res['user']['language'] == 'de'
    assert res['user']['timeCreated'] is not None
    assert res['user']['timeUpdated'] is not None
    assert res['user']['avatar'] is None




def test_unsuccessful_login(client):
    data = {
        'email': 'felix@fengelmann.de',
        'password': 'ergherz547zrthfr'
    }
    rv_wrong_pw = client.post('/api/login', json=data)
    assert rv_wrong_pw.status_code == 401
    res_wrong_pw = json.loads(rv_wrong_pw.data)
    assert res_wrong_pw['message'] == ResponseMessage.WRONG_CREDENTIALS.value

    data = {
        'email': 'dfshshehred@wegweg.ee',
        'password': 'fengelmann'
    }
    rv_wrong_email = client.post('/api/login', json=data)
    assert rv_wrong_email.status_code == 401
    res_wrong_email = json.loads(rv_wrong_email.data)
    assert res_wrong_email['message'] == ResponseMessage.WRONG_CREDENTIALS.value


def test_successful_access_and_refresh_logout(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.post('/api/logout/access', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.ACCESS_TOKEN_REVOKED.value

    rv = client.post('/api/logout/refresh', headers=refresh_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.REFRESH_TOKEN_REVOKED.value


def test_access_logout_without_headers(client):
    rv = client.post('/api/logout/access')
    assert rv.status_code == 401
    res = json.loads(rv.data)
    print(res)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value


def test_refresh_logout_without_headers(client):
    rv = client.post('/api/logout/refresh')
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value


def test_successful_token_refresh(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.post('/api/token/refresh', headers=refresh_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.LOGIN_SUCCESS.value
    assert res['accessToken'] is not None
    assert res['user']['email'] == 'felix@fengelmann.de'
    assert isinstance(res['user']['email'], str)
    assert isinstance(res['user']['id'], int)


def test_unsuccessful_token_refresh(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.post('/api/token/refresh')
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value

    rv = client.post('/api/token/refresh', headers=access_headers)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value


def test_forgot_password_wrong_email(client):
    data = {
        'email': 'feliks@fengelmann.de',
    }
    rv = client.post('/api/forgot-password', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_NOT_FOUND.value


def test_forgot_password_successful(client):
    data = {
        'email': 'felix@fengelmann.de',
    }
    rv = client.post('/api/forgot-password', json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.RESET_PASSWORD_MAIL_SENT.value


def test_reset_password_hash_not_found(client):
    data = {
        'resetPasswordHash': 'abcdefg',
        'newPassword': 'wgowieuhgfwoeughweoguhwegiwhe'
    }
    rv = client.post('/api/reset-password', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.RESET_PASSWORD_HASH_INVALID.value


def test_reset_password_hash_expired(client):
    # Manually add a hash with expired date too the user
    with app.app_context():
        user = User.find_by_email('felix@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc) - timedelta(hours=24, seconds=1)
        user.persist()

    data = {
        'resetPasswordHash': reset_hash,
        'newPassword': 'wgowieuhgfwoeughweoguhwegiwhe'
    }
    rv = client.post('/api/reset-password', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.RESET_PASSWORD_HASH_INVALID.value


def test_reset_password_password_too_short(client):
    # Manually add a hash to the user
    with app.app_context():
        user = User.find_by_email('felix@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc)
        user.persist()

    data = {
        'resetPasswordHash': reset_hash,
        'newPassword': '1234567'
    }
    rv = client.post('/api/reset-password', json=data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_TOO_SHORT.value


def test_reset_password_success(client):
    # Manually add a hash to the user
    with app.app_context():
        user = User.find_by_email('felix@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc)
        user.persist()

    data = {
        'resetPasswordHash': reset_hash,
        'newPassword': 'wgowieuhgfwoeughweoguhwegiwhe'
    }
    rv = client.post('/api/reset-password', json=data)
    assert rv.status_code == 202
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_RESET.value
    assert res['accessToken'] is not None
    assert res['refreshToken'] is not None
    assert res['accessToken'] != res['refreshToken']
    assert res['user']['email'] == 'felix@fengelmann.de'
    assert isinstance(res['user']['email'], str)
    assert isinstance(res['user']['id'], int)
    assert res['accountSettings']['colorScheme'] == 'CLARITY_BRIGHT'
    assert res['accountSettings']['language']['code'] == 'en'
    assert res['accountSettings']['timeCreated'] is not None
    assert res['accountSettings']['timeUpdated'] is None
    assert res['accountSettings']['avatar'] is not None
    assert len(res['languages']) == 3
    for l in res['languages']:
        assert type(l['id']) == int
        assert l['code'] in ['de', 'en', 'zh']
        assert type(l['isDefaultLanguage']) == bool


def test_token_user_does_not_exist(client):
    # Take one of the test users, log in, then manually delete the user. Then try to change the password.
    # As the request is performed with a non existing user, 401 should be thrown.
    access_headers, refresh_headers = get_login_headers(client, 'queitsch@fengelmann.de', 'g!a6J!zLIXN{b~qok8.A')

    with app.app_context():
        db.engine.execute("delete from account_settings where user_id = 3;")
        db.engine.execute("delete from user_2_permission where user_id = 3;")
        db.engine.execute("delete from assignees where user_id = 3;")
        db.engine.execute("delete from users where id = 3;")

    change_pw_data = {
        'oldPassword': 'g!a6J!zLIXN{b~qok8.A',
        'newPassword': 'testPassword'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value


def test_revoked_access_token_bahaviour(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.post('/api/logout/access', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.ACCESS_TOKEN_REVOKED.value
    change_pw_data = {
        'oldPassword': 'kevin123!',
        'newPassword': 'testPassword'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401


def test_revoked_refresh_token_bahaviour(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.post('/api/logout/refresh', headers=refresh_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.REFRESH_TOKEN_REVOKED.value
    rv = client.post('/api/token/refresh', headers=refresh_headers)
    assert rv.status_code == 401



def test_forgot_password_with_non_activated_user(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    with app.app_context():
        all_permissions = Permission.return_all()
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix.engelmann@fengelmann.de',
        'accountSettings': {
            'language': {
                'id': 1,
                'code': 'en'
            }
        },
        'permissions': [
            {
                'id': all_permissions[0].id,
                'boolValue': True,
                'accessLevel': None
            },
            {
                'id': all_permissions[1].id,
                'boolValue': True,
                'accessLevel': None
            },
        ]
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 201

    data = {
        'email': 'felix.engelmann@fengelmann.de',
    }
    rv = client.post('/api/forgot-password', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_NOT_ACTIVATED.value


def test_reset_password_with_non_activated_user(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    with app.app_context():
        all_permissions = Permission.return_all()
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix.engelmann@fengelmann.de',
        'accountSettings': {
            'language': {
                'id': 1,
                'code': 'en'
            }
        },
        'permissions': [
            {
                'id': all_permissions[0].id,
                'boolValue': True,
                'accessLevel': None
            },
            {
                'id': all_permissions[1].id,
                'boolValue': True,
                'accessLevel': None
            },
        ]
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 201


    # Manually add a hash to the user
    with app.app_context():
        user = User.find_by_email('felix.engelmann@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc)
        user.persist()

    data = {
        'resetPasswordHash': reset_hash,
        'newPassword': 'wgowieuhgfwoeughweoguhwegiwhe'
    }
    rv = client.post('/api/reset-password', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_NOT_ACTIVATED.value