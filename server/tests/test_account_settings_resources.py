import json

from app import app
from extensions import db
from messages.messages import ResponseMessage
from tests.utils.user_test_util import get_login_headers


def test_successful_get_account_settings(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.get('/api/account/settings', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['colorScheme'] == 'CLARITY_BRIGHT'
    assert res['language']['code'] == 'en'
    assert res['timeCreated'] is not None


def test_successful_update_account_settings_with_avatar(client):
    # Create fake media

    with app.app_context():
        db.engine.execute(
            "insert into medias (id, width, height, filename, original_filename, created_by_id) values (4, 2, 3, '4', '5', 1);")
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    account_settings_data = {
        'colorScheme': 'CLARITY_DARK',
        'language': {
            'code': 'de',
            'id': 2
        },
        'avatar': 4
    }
    rv = client.put('/api/account/settings', headers=access_headers, json=account_settings_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['colorScheme'] == 'CLARITY_DARK'
    assert res['language']['code'] == 'de'
    assert res['avatar']['id'] == 4
    assert res['avatar']['width'] == 2
    assert res['avatar']['height'] == 3
    assert res['avatar']['filename'] == '4'
    assert res['avatar']['originalFilename'] == '5'
    assert res['timeCreated'] is not None
    assert res['timeUpdated'] is not None

def test_successful_update_account_settings_without_avatar(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    account_settings_data = {
        'colorScheme': 'CLARITY_DARK',
        'language': {
            'code': 'de',
            'id': 2
        },
        'avatar': None
    }
    rv = client.put('/api/account/settings', headers=access_headers, json=account_settings_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['colorScheme'] == 'CLARITY_DARK'
    assert res['language']['code'] == 'de'
    assert res['avatar'] is None
    assert res['timeCreated'] is not None
    assert res['timeUpdated'] is not None


def test_update_account_settings_invalid_color_scheme(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    account_settings_data = {
        'colorScheme': 'INVALID_SCHEME',
        'language': {
            'code': 'en',
            'id': 1
        }
    }
    rv = client.put('/api/account/settings', headers=access_headers, json=account_settings_data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.INVALID_COLOR_SCHEME.value
