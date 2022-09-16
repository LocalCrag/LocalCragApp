import json

from app import db, app
from enums.entity_types import EntityTypeEnum
from messages.messages import ResponseMessage
from models.permission import Permission
from permission_system.action import Action
from tests.utils.user_test_util import get_login_headers


def test_successful_change_password(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    change_pw_data = {
        'oldPassword': 'fengelmann',
        'newPassword': 'fengelmann2'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_CHANGED.value


def test_change_password_password_too_short(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    change_pw_data = {
        'oldPassword': 'fengelmann',
        'newPassword': '1234567'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.PASSWORD_TOO_SHORT.value


def test_change_password_password_old_pw_incorrect(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    change_pw_data = {
        'oldPassword': 'incorrectpassword',
        'newPassword': 'fengelmann2'
    }
    rv = client.put('/api/account/change-password', headers=access_headers, json=change_pw_data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.OLD_PASSWORD_INCORRECT.value


def test_successful_get_users(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.get('/api/users', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 6
    for user in res:
        assert type(user['id']) == int
        assert type(user['firstname']) == str
        assert type(user['lastname']) == str
        assert type(user['email']) == str
        assert type(user['activated']) == bool
        assert type(user['locked']) == bool


def test_successful_resend_invite_mail_role(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.put('/api/users/2/resend-user-create-mail', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None


def test_unsuccessful_resend_invite_mail_role(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.put('/api/users/1/resend-user-create-mail', headers=access_headers, json=None)
    assert rv.status_code == 400


def test_successful_create_user_without_permissions(client):
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
        'permissions': []
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['id'] == 7
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['email'] == 'felix.engelmann@fengelmann.de'
    assert not res['activated']
    # User should have all permissions with value false for the start
    assert len(res['permissions']) == len(all_permissions)
    for p in res['permissions']:
        assert p['action'] in Action.__members__
        assert p['boolValue'] == False
        assert type(p['id']) == int
        assert type(p['entityType']['id']) == int
        assert p['entityType']['name'] in EntityTypeEnum.__members__
        if p['accessLevel']:
            assert type(p['accessLevel']['id']) == int
            assert type(p['accessLevel']['name']) == str
    assert res['accountSettings']['language']['code'] == 'en'


def test_successful_create_user_with_some_permissions(client):
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
    ids_that_are_true = [all_permissions[0].id, all_permissions[1].id]
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['id'] == 7
    assert res['firstname'] == 'Thorsten'
    assert res['lastname'] == 'Test'
    assert res['email'] == 'felix.engelmann@fengelmann.de'
    assert not res['activated']
    assert len(res['permissions']) == len(all_permissions)
    for p in res['permissions']:
        if p['id'] not in ids_that_are_true:
            assert p['boolValue'] == False
        else:
            assert p['boolValue'] == True
        assert p['action'] in Action.__members__
        assert type(p['id']) == int
        assert type(p['entityType']['id']) == int
        assert p['entityType']['name'] in EntityTypeEnum.__members__
        if p['accessLevel']:
            assert type(p['accessLevel']['id']) == int
            assert type(p['accessLevel']['name']) == str
    assert res['accountSettings']['language']['code'] == 'en'


def test_unsuccessful_create_user_email_taken(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    user_data = {
        'firstname': 'Thorsten',
        'lastname': 'Test',
        'email': 'felix@fengelmann.de',
        'permissions': [],
        'accountSettings': {
            'language': {
                'id': 1,
                'code': 'en'
            }
        }
    }
    rv = client.post('/api/users', headers=access_headers, json=user_data)
    assert rv.status_code == 409


def test_lock_user(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    # Lock a user
    rv = client.put('/api/users/2/lock', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None

    # Try to lock it again
    rv = client.put('/api/users/2/lock', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_LOCKED.value

    # Try to log in locked user
    data = {
        'email': 'test@fengelmann.de',
        'password': 'fengelmann'
    }
    rv = client.post('/api/login', json=data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_LOCKED.value

    # Unlock a user
    rv = client.put('/api/users/2/unlock', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None

    # Try to unlock it again
    rv = client.put('/api/users/2/unlock', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_UNLOCKED.value

    # Try to lock yourself
    rv = client.put('/api/users/1/lock', headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.CANNOT_LOCK_OWN_USER.value


def test_use_tokens_of_locked_user(client):
    access_headers_locked_user, refresh_headers_locked_user = get_login_headers(client, 'test@fengelmann.de',
                                                                                'fengelmann')
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    # Lock the user
    rv = client.put('/api/users/2/lock', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is None

    # Try to load some data with locked user (check via locked or deleted decorator)
    rv = client.get('/api/account/settings', headers=access_headers_locked_user)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_LOCKED.value

    # Try to load some data with locked user (check via boolean permission decorator)
    rv = client.get('/api/experiments', headers=access_headers_locked_user)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_LOCKED.value


def test_email_taken(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    # Test a taken email
    rv = client.get('/api/users/email-taken/felix@fengelmann.de', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is True

    # Test a free email
    rv = client.get('/api/users/email-taken/felix123456@fengelmann.de', headers=access_headers, json=None)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res is False


def test_delete_own_user(client):
    data = {
        'email': 'felix@fengelmann.de',
        'password': 'fengelmann'
    }
    rv = client.post('/api/login', json=data)
    res = json.loads(rv.data)
    own_id = res['user']['id']

    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.delete('/api/users/{}'.format(own_id), headers=access_headers, json=None)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.CANNOT_DELETE_OWN_USER.value


def test_delete_other_user(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.delete('/api/users/{}'.format(2), headers=access_headers, json=None)
    assert rv.status_code == 204


def test_use_tokens_of_deleted_user(client):
    access_headers_deleted_user, refresh_headers_deleted_user = get_login_headers(client, 'test@fengelmann.de',
                                                                                  'fengelmann')
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    # Delete the user
    rv = client.delete('/api/users/2', headers=access_headers, json=None)
    assert rv.status_code == 204

    # Try to load some data with deleted user (check via locked or deleted decorator)
    rv = client.get('/api/account/settings', headers=access_headers_deleted_user)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_DELETED.value

    # Try to load some data with deleted user (check via boolean permission decorator)
    rv = client.get('/api/experiments', headers=access_headers_deleted_user)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_DELETED.value


def test_update_account_settings(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    data = {
        'language': {
            'id': 2,
            'code': 'de'
        }
    }
    rv = client.put('/api/users/{}/account-settings'.format(2), headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['language']['id'] == 2
    assert res['language']['code'] == 'de'


def test_update_contact_info_different_email(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    data = {
        'firstname': 'Horst',
        'lastname': 'Popelfritze',
        'email': 'horstpopelfritze@fengelmann.de'
    }
    rv = client.put('/api/users/{}/contact-info'.format(2), headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['firstname'] == 'Horst'
    assert res['lastname'] == 'Popelfritze'
    assert res['email'] == 'horstpopelfritze@fengelmann.de'


def test_update_contact_info_same_email(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    data = {
        'firstname': 'Horst',
        'lastname': 'Popelfritze',
        'email': 'test@fengelmann.de'
    }
    rv = client.put('/api/users/{}/contact-info'.format(2), headers=access_headers, json=data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['firstname'] == 'Horst'
    assert res['lastname'] == 'Popelfritze'
    assert res['email'] == 'test@fengelmann.de'


def test_update_contact_info_taken_email(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    data = {
        'firstname': 'Horst',
        'lastname': 'Popelfritze',
        'email': 'felix@fengelmann.de'
    }
    rv = client.put('/api/users/{}/contact-info'.format(2), headers=access_headers, json=data)
    assert rv.status_code == 409
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.USER_ALREADY_EXISTS.value


def test_update_contact_info_invalid_email(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    data = {
        'firstname': 'Horst',
        'lastname': 'Popelfritze',
        'email': 'felixfengelmann.de'
    }
    rv = client.put('/api/users/{}/contact-info'.format(2), headers=access_headers, json=data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.EMAIL_INVALID.value


def test_update_permissions(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    with app.app_context():
        all_permissions = Permission.return_all()
    user_data = {
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
    ids_that_are_true = [all_permissions[0].id, all_permissions[1].id]
    rv = client.put('/api/users/{}/permissions'.format(2), headers=access_headers, json=user_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['permissions']) == len(all_permissions)
    for p in res['permissions']:
        if p['id'] not in ids_that_are_true:
            assert p['boolValue'] == False
        else:
            assert p['boolValue'] == True
        assert p['action'] in Action.__members__
        assert type(p['id']) == int
        assert type(p['entityType']['id']) == int
        assert p['entityType']['name'] in EntityTypeEnum.__members__
        if p['accessLevel']:
            assert type(p['accessLevel']['id']) == int
            assert type(p['accessLevel']['name']) == str


def test_update_permissions_that_you_dont_have(client):
    # First take away a permission from the admin account (Create journal entries)
    with app.app_context():
        db.engine.execute("UPDATE user_2_permission SET bool_value = False WHERE user_id = 1 AND permission_id = 23;")

    # Now try to grant this permission
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    user_data = {
        'permissions': [
            {
                'id': 23,
                'boolValue': True,
                'accessLevel': None
            }
        ]
    }
    rv = client.put('/api/users/{}/permissions'.format(2), headers=access_headers, json=user_data)
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF.value


def test_successful_create_user_with_some_permissions_you_dont_have(client):
    # First take away a permission from the admin account (Create devices)
    with app.app_context():
        db.engine.execute("UPDATE user_2_permission SET bool_value = False WHERE user_id = 1 AND permission_id = 23;")

    # Now try to grant this permission when creating a user
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
                'id': 23,
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
    assert rv.status_code == 401
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF.value


def test_successful_find_users(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.get('/api/users/find/test', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 1
    for user in res:
        assert type(user['id']) == int
        assert user['firstname'] == 'Felix'
        assert user['lastname'] == 'Engelmann'
        assert user['email'] == 'test@fengelmann.de'
        assert user['activated'] == False
        assert user['locked'] == False


def test_successful_find_users_2(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.get('/api/users/find/fengelmann', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 5


def test_successful_find_users_no_results(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.get('/api/users/find/sarumanthewise', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 0
