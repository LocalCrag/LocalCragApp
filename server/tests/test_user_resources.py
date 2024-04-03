import json
from datetime import datetime, timedelta
from uuid import uuid4

import pytz

from app import app
from extensions import db
from messages.messages import ResponseMessage
from models.user import User
from tests.utils.user_test_util import get_login_headers


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
        assert type(user['language']) == str
        assert type(user['activated']) == bool
        assert type(user['admin']) == bool
        assert type(user['moderator']) == bool
        assert type(user['member']) == bool
        assert type(user['activatedAt']) == str or user['activatedAt'] == None
        assert type(user['avatar']) == dict or user['avatar'] == None


def test_successful_resend_invite_mail_role(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)

    access_headers, refresh_headers = get_login_headers(client)
    rv = client.put('/api/users/3543885f-e9ef-48c5-a396-6c898fb42409/resend-user-create-mail', headers=access_headers,
                    json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


def test_unsuccessful_resend_invite_mail_role(client):
    access_headers, refresh_headers = get_login_headers(client)
    rv = client.put('/api/users/1543885f-e9ef-48c5-a396-6c898fb42409/resend-user-create-mail', headers=access_headers,
                    json=None)
    assert rv.status_code == 400


def test_successful_register_user(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    access_headers, refresh_headers = get_login_headers(client)
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix.engelmann@fengelmann.de',
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
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


def test_unsuccessful_create_user_email_taken(client):
    access_headers, refresh_headers = get_login_headers(client)
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'localcrag@fengelmann.de',
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 409


def test_email_taken(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Test a taken email
    rv = client.get('/api/users/email-taken/localcrag@fengelmann.de', headers=access_headers, json=None)
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


def test_update_user(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'localcrag@fengelmann.de',
        'avatar': '6137f55a-6201-45ab-89c5-6e9c29739d61',
    }
    rv = client.put('/api/users/account', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['language'] == 'de'
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['avatar']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['avatar']['originalFilename'] == 'test.jpg'
    assert res['email'] == 'localcrag@fengelmann.de'


def test_update_user_different_email(client, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'horstpopelfritze@fengelmann.de',
        'avatar': None,
    }
    rv = client.put('/api/users/account', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['language'] == 'de'
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['avatar'] is None
    assert res['email'] == 'localcrag@fengelmann.de'  # Mail only updated in a separate step
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1


def test_change_email(client):
    # Manually add a hash to the user
    with app.app_context():
        user: User = User.find_by_email('localcrag@fengelmann.de')
        reset_hash = uuid4()
        user.new_email = 'localcrag42@fengelmann.de'
        user.new_email_hash = reset_hash
        user.new_email_hash_created = datetime.now(pytz.utc)
        db.session.add(user)
        db.session.commit()

    data = {
        'newEmailHash': reset_hash,
    }
    rv = client.put('/api/users/account/change-email', json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.EMAIL_CHANGED.value
    assert res['accessToken'] is not None
    assert res['refreshToken'] is not None
    assert res['accessToken'] != res['refreshToken']
    assert res['user']['email'] == 'localcrag42@fengelmann.de'
    assert isinstance(res['user']['id'], str)
    assert res['user']['language'] == 'de'
    assert res['user']['timeCreated'] is not None
    assert res['user']['timeUpdated'] is not None
    assert res['user']['avatar'] is None


def test_change_email_invalid_token(client):
    # Manually add a hash to the user
    with app.app_context():
        user: User = User.find_by_email('localcrag@fengelmann.de')
        reset_hash = uuid4()
        user.new_email = 'localcrag42@fengelmann.de'
        user.new_email_hash = reset_hash
        user.new_email_hash_created = datetime.now(pytz.utc)
        db.session.add(user)
        db.session.commit()

    data = {
        'newEmailHash': 'lol',
    }
    rv = client.put('/api/users/account/change-email', json=data)
    assert rv.status_code == 401


def test_change_email_expired_token(client):
    # Manually add a hash to the user
    with app.app_context():
        user: User = User.find_by_email('localcrag@fengelmann.de')
        reset_hash = uuid4()
        user.new_email = 'localcrag42@fengelmann.de'
        user.new_email_hash = reset_hash
        user.new_email_hash_created = datetime.now(pytz.utc) - timedelta(days=1)
        db.session.add(user)
        db.session.commit()

    data = {
        'newEmailHash': reset_hash,
    }
    rv = client.put('/api/users/account/change-email', json=data)
    assert rv.status_code == 401


def test_update_user_taken_email(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'localcrag2@fengelmann.de',
        'avatar': None,
    }
    rv = client.put('/api/users/account', headers=access_headers, json=data)
    assert rv.status_code == 409
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_EXISTS.value


def test_update_user_invalid_email(client):
    access_headers, refresh_headers = get_login_headers(client)
    data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'localcragfengelmann.de',
        'avatar': None,
    }
    rv = client.put('/api/users/account', headers=access_headers, json=data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.EMAIL_INVALID.value

def test_promote_user_to_member(client):
    # Remove admin prop first..
    with app.app_context():
        user: User = User.find_by_id('2543885f-e9ef-48c5-a396-6c898fb42409')
        user.admin = False
        user.moderator = True
        user.member = True
        db.session.add(user)
        db.session.commit()

    access_headers, refresh_headers = get_login_headers(client)

    data = {
        'promotionTarget': 'USER',
    }
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/promote', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['admin'] == False
    assert res['moderator'] == False
    assert res['member'] == False

    data = {
        'promotionTarget': 'MEMBER',
    }
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/promote', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['admin'] == False
    assert res['moderator'] == False
    assert res['member'] == True

    data = {
        'promotionTarget': 'MODERATOR',
    }
    rv = client.put('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409/promote', headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['admin'] == False
    assert res['moderator'] == True
    assert res['member'] == True
