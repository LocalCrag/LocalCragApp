import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_crag(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    crag_data = {
        "name": "Glees",
        "description": "Fodere et scandere.",
        "shortDescription": "Fodere et scandere 2.",
        "rules": "Parken nur Samstag und Sonntag.",
        "portraitImage": 1,
    }

    rv = client.post('/api/regions/XXX/crags', headers=access_headers, json=crag_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Glees"
    assert res['slug'] == "glees"
    assert res['description'] == "Fodere et scandere."
    assert res['shortDescription'] == "Fodere et scandere 2."
    assert res['rules'] == "Parken nur Samstag und Sonntag."
    assert res['portraitImage']['id'] == 1
    assert res['id'] is not None


def test_successful_get_crags(client):
    rv = client.get('/api/crags')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['hashId'] == "XXX"
    assert res[0]['slug'] == "XXX"
    assert res[0]['name'] == "Kottenheim"
    assert res[0]['shortDescription'] == "Kottenheim"
    assert res[0]['portraitImage']['id'] == 1
    assert res[1]['hashId'] == "XXX"
    assert res[1]['slug'] == "XXX"
    assert res[1]['name'] == "Hohenfels"
    assert res[1]['shortDescription'] == "Hohenfels"
    assert res[1]['portraitImage']['id'] == 1


def test_successful_get_crag(client):
    rv = client.get('/api/crags/XXX')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['hashId'] == "XXX"
    assert res['name'] == "Kottenheim"
    assert res['slug'] == "Kottenheim magic!"
    assert res['portraitImage']['id'] == 1
    assert res['description'] == "Kottenheim magic!"
    assert res['shortDescription'] == "Kottenheim magic!"
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
        "name": "Glees 2",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": 2,
    }

    rv = client.put('/api/crags/XXX', headers=access_headers, json=crag_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Glees 2"
    assert res['slug'] == "glees-2"
    assert res['description'] == "Fodere et scandere. 2"
    assert res['shortDescription'] == "Fodere et scandere 3."
    assert res['rules'] == "Parken nur Samstag und Sonntag 2."
    assert res['portraitImage']['id'] == 2
    assert res['id'] is not None
