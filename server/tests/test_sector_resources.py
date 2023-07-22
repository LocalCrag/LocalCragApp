import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_sector(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    sector_data = {
        "name": "Kruzifix",
        "description": "Der Klassikersektor",
        "shortDescription": "Classic.",
        "portraitImage": 1,
    }

    rv = client.post('/api/regions/XXX/crags/glees/sectors', headers=access_headers, json=sector_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Kruzifix"
    assert res['slug'] == "kruzifix"
    assert res['description'] == "Der Klassikersektor"
    assert res['shortDescription'] == "Classic."
    assert res['portraitImage']['id'] == 1
    assert res['id'] is not None


def test_successful_get_sectors(client):
    rv = client.get('/api/crags/glees/sectors')
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


def test_successful_get_sector(client):
    rv = client.get('/api/crags/glees/sectors/romani-ite-domum')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['hashId'] == "XXX"
    assert res['name'] == "Kottenheim"
    assert res['slug'] == "Kottenheim magic!"
    assert res['portraitImage']['id'] == 1
    assert res['description'] == "Kottenheim magic!"
    assert res['shortDescription'] == "Kottenheim magic!"
    assert res['rules'] == "Alles erlaubt in Kottenheim."


def test_get_deleted_sector(client):
    rv = client.get('/api/crags/cf6f3058-48e7-4229-8172-58d48b758a89')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_sector(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')

    rv = client.delete('/api/crags/glees/sectors/romani', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_sector(client):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
    sector_data = {
        "name": "Romani",
        "description": "Test edit",
        "shortDescription": "Test",
        "portraitImage": 2,
    }

    rv = client.put('/api/crags/glees/sectors/romani-ite-domum', headers=access_headers, json=sector_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Romani"
    assert res['slug'] == "romani"
    assert res['description'] == "Test edit"
    assert res['shortDescription'] == "Test"
    assert res['portraitImage']['id'] == 2
    assert res['id'] is not None