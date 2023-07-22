import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_sector(client):
    access_headers, refresh_headers = get_login_headers(client)
    sector_data = {
        "name": "Kruzifix",
        "description": "Der Klassikersektor",
        "shortDescription": "Classic.",
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
    }

    rv = client.post('/api/crags/brione/sectors', headers=access_headers, json=sector_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Kruzifix"
    assert res['slug'] == "kruzifix"
    assert res['description'] == "Der Klassikersektor"
    assert res['shortDescription'] == "Classic."
    assert res['portraitImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['id'] is not None


def test_successful_get_sectors(client):
    rv = client.get('/api/crags/brione/sectors')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['id'] == "5f186998-7712-4a85-a623-a5126836a2b1"
    assert res[0]['slug'] == "oben"
    assert res[0]['name'] == "Oben"
    assert res[0]['shortDescription'] == ""
    assert res[0]['portraitImage'] == None
    assert res[1]['id'] == "008478de-5e0b-41b3-abe7-571f758c189b"
    assert res[1]['slug'] == "schattental"
    assert res[1]['name'] == "Schattental"
    assert res[1]['shortDescription'] == "Kurze Beschreibung zum Schattental"
    assert res[1]['portraitImage']['id'] == 'e90cab29-d471-415f-b949-20eb3f044ad5'


def test_successful_get_sector(client):
    rv = client.get('/api/crags/brione/sectors/schattental')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "008478de-5e0b-41b3-abe7-571f758c189b"
    assert res['name'] == "Schattental"
    assert res['slug'] == "schattental"
    assert res['portraitImage']['id'] == 'e90cab29-d471-415f-b949-20eb3f044ad5'
    assert res['description'] == "<p>Lange Beschreibung zum Schattental</p>"
    assert res['shortDescription'] == "Kurze Beschreibung zum Schattental"


def test_get_deleted_sector(client):
    rv = client.get('/api/crags/cf6f3058-48e7-4229-8172-58d48b758a89')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_sector(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/sectors/5f186998-7712-4a85-a623-a5126836a2b1', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_sector(client):
    access_headers, refresh_headers = get_login_headers(client)
    sector_data = {
        "name": "Romani",
        "description": "Test edit",
        "shortDescription": "Test",
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
    }

    rv = client.put('/api/sectors/5f186998-7712-4a85-a623-a5126836a2b1', headers=access_headers, json=sector_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Romani"
    assert res['slug'] == "romani"
    assert res['description'] == "Test edit"
    assert res['shortDescription'] == "Test"
    assert res['portraitImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['id'] is not None