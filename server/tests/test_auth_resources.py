import json
from datetime import datetime, timedelta
from uuid import uuid4

import pytz
from sqlalchemy import text

from app import db, app
from messages.messages import ResponseMessage
from models.user import User
from tests.utils.user_test_util import get_login_headers


def test_successful_login(client):
    data = {
        'email': 'localcrag@fengelmann.de',
        'password': '[vb+xLGgU?+Z]nXD3HmO'
    }
    rv = client.post('/api/login', json=data)
    assert rv.status_code == 202
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.LOGIN_SUCCESS.value
    assert res['accessToken'] is not None
    assert res['refreshToken'] is not None
    assert res['accessToken'] != res['refreshToken']
    assert res['user']['email'] == 'localcrag@fengelmann.de'
    assert res['user']['firstname'] == 'Felix'
    assert res['user']['lastname'] == 'Engelmann'
    assert isinstance(res['user']['id'], str)
    assert res['user']['colorScheme'] == 'LARA_LIGHT_TEAL'
    assert res['user']['language'] == 'de'
    assert res['user']['timeCreated'] is not None
    assert res['user']['timeUpdated'] is None
    assert res['user']['avatar'] is None


def test_unsuccessful_login(client):
    data = {
        'email': 'localcrag@fengelmann.de',
        'password': 'ergherz547zrthfr'
    }
    rv_wrong_pw = client.post('/api/login', json=data)
    assert rv_wrong_pw.status_code == 401
    res_wrong_pw = json.loads(rv_wrong_pw.data)
    assert res_wrong_pw['message'] == ResponseMessage.WRONG_CREDENTIALS.value

    data = {
        'email': 'dfshshehred@wegweg.ee',
        'password': '[vb+xLGgU?+Z]nXD3HmO'
    }
    rv_wrong_email = client.post('/api/login', json=data)
    assert rv_wrong_email.status_code == 401
    res_wrong_email = json.loads(rv_wrong_email.data)
    assert res_wrong_email['message'] == ResponseMessage.WRONG_CREDENTIALS.value


def test_successful_access_and_refresh_logout(client):
    access_headers, refresh_headers = get_login_headers(client)

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
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.post('/api/token/refresh', headers=refresh_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.LOGIN_SUCCESS.value
    assert res['accessToken'] is not None
    assert res['user']['email'] == 'localcrag@fengelmann.de'
    assert isinstance(res['user']['id'], str)


def test_unsuccessful_token_refresh(client):
    access_headers, refresh_headers = get_login_headers(client)

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


def test_forgot_password_successful(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    data = {
        'email': 'localcrag@fengelmann.de',
    }
    rv = client.post('/api/forgot-password', json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.RESET_PASSWORD_MAIL_SENT.value
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


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
    # Manually add a hash with expired date to the user
    with app.app_context():
        user = User.find_by_email('localcrag@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc) - timedelta(hours=24, seconds=1)
        db.session.add(user)
        db.session.commit()

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
        user = User.find_by_email('localcrag@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc)
        db.session.add(user)
        db.session.commit()

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
        user = User.find_by_email('localcrag@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc)
        db.session.add(user)
        db.session.commit()

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
    assert res['user']['email'] == 'localcrag@fengelmann.de'
    assert isinstance(res['user']['id'], str)
    assert res['user']['colorScheme'] == 'LARA_LIGHT_TEAL'
    assert res['user']['language'] == 'de'
    assert res['user']['timeCreated'] is not None
    assert res['user']['timeUpdated'] is not None
    assert res['user']['avatar'] is None


def test_token_user_does_not_exist(client):
    # Take one of the test users, log in, then manually delete the user. Then try to change the password.
    # As the request is performed with a non-existing user, 401 should be thrown.
    access_headers, refresh_headers = get_login_headers(client, email='localcrag2@fengelmann.de')

    with app.app_context():
        with db.engine.begin() as conn:
            conn.execute(text("delete from users where id = '2543885f-e9ef-48c5-a396-6c898fb42409';"))

    change_pw_data = {
        'oldPassword': '[vb+xLGgU?+Z]nXD3HmO',
        'newPassword': 'testPassword'
    }
    rv = client.put('/api/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.UNAUTHORIZED.value


def test_revoked_access_token_behaviour(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.post('/api/logout/access', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.ACCESS_TOKEN_REVOKED.value
    change_pw_data = {
        'oldPassword': 'kevin123!',
        'newPassword': 'testPassword'
    }
    rv = client.put('/api/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401


def test_revoked_refresh_token_behaviour(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.post('/api/logout/refresh', headers=refresh_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.REFRESH_TOKEN_REVOKED.value
    rv = client.post('/api/token/refresh', headers=refresh_headers)
    assert rv.status_code == 401


def test_forgot_password_with_non_activated_user(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    access_headers, refresh_headers = get_login_headers(client)
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix.engelmann@fengelmann.de',
        'language': 'de',
        'colorScheme': 'LARA_LIGHT_TEAL',
        'avatar': None,
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
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


def test_reset_password_with_non_activated_user(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    access_headers, refresh_headers = get_login_headers(client)
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix.engelmann@fengelmann.de',
        'language': 'de',
        'colorScheme': 'LARA_LIGHT_TEAL',
        'avatar': None,
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 201

    # Manually add a hash to the user
    with app.app_context():
        user = User.find_by_email('felix.engelmann@fengelmann.de')
        reset_hash = uuid4()
        user.reset_password_hash = reset_hash
        user.reset_password_hash_created = datetime.now(pytz.utc)
        db.session.add(user)
        db.session.commit()

    data = {
        'resetPasswordHash': reset_hash,
        'newPassword': 'wgowieuhgfwoeughweoguhwegiwhe'
    }
    rv = client.post('/api/reset-password', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_NOT_ACTIVATED.value
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


def test_successful_change_password(client):
    access_headers, refresh_headers = get_login_headers(client)
    change_pw_data = {
        'oldPassword': '[vb+xLGgU?+Z]nXD3HmO',
        'newPassword': 'fengelmann2'
    }
    rv = client.put('/api/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_CHANGED.value


def test_change_password_password_too_short(client):
    access_headers, refresh_headers = get_login_headers(client)
    change_pw_data = {
        'oldPassword': '[vb+xLGgU?+Z]nXD3HmO',
        'newPassword': '1234567'
    }
    rv = client.put('/api/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_TOO_SHORT.value


def test_change_password_password_old_pw_incorrect(client):
    access_headers, refresh_headers = get_login_headers(client)
    change_pw_data = {
        'oldPassword': 'incorrectpassword',
        'newPassword': 'fengelmann2'
    }
    rv = client.put('/api/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.OLD_PASSWORD_INCORRECT.value
