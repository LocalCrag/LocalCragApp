import json

from tests.utils.user_test_util import get_login_headers


def test_successful_get_languages(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    rv = client.get('/api/languages', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 3
    assert res[0]['id'] in [1, 2, 3]
    assert res[0]['code'] in ['de', 'en', 'zh']
    assert res[1]['id'] in [1, 2, 3]
    assert res[1]['code'] in ['de', 'en', 'zh']
    assert res[0]['id'] != res[1]['id'] != res[2]['id']
    assert res[0]['code'] != res[1]['code'] != res[2]['code']
