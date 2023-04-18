import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_crag(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    crag_data = {
        "name": "Glees",
        "description": "Fodere et scandere.",
        "rules": "Parken nur Samstag und Sonntag."
    }

    rv = client.post('/api/regions/XXX/crags', headers=access_headers, json=crag_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Glees"
    assert res['description'] == "Fodere et scandere."
    assert res['rules'] == "Parken nur Samstag und Sonntag."
    assert res['id'] is not None


def test_successful_get_crags(client):
    rv = client.get('/api/crags')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['hashId'] == "XXX"
    assert res[0]['name'] == "Kottenheim"
    assert res[1]['hashId'] == "XXX"
    assert res[1]['name'] == "Hohenfels"


def test_successful_get_crag(client):
    rv = client.get('/api/crags/XXX')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['hashId'] == "XXX"
    assert res['name'] == "Kottenheim"
    assert res['description'] == "Kottenheim magic!"
    assert res['rules'] == "Alles erlaubt in Kottenheim."


def test_get_deleted_crag(client):
    rv = client.get('/api/crags/cf6f3058-48e7-4229-8172-58d48b758a89')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_crag(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.delete('/api/crags/XXX', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_crag(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    crag_data = {
        "name": "edited name",
        "description": "edited description",
        "rules": "edited rules"
    }

    rv = client.put('/api/crags/XXX', headers=access_headers, json=crag_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "edited name"
    assert res['description'] == "edited description"
    assert res['rules'] == "edited rules"
    assert res['id'] == "XXX"
