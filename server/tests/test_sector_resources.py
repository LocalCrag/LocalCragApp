import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_sector(client):
    access_headers, refresh_headers = get_login_headers(client)
    sector_data = {
        "name": "Kruzifix",
        "description": "Der Klassikersektor",
        "shortDescription": "Classic.",
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "lat": 12.13,
        "lng": 42.42,
        "rules": "test rules",
        "secret": False,
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
    assert res['lat'] == 12.13
    assert res['lng'] == 42.42
    assert res['ascentCount'] == 0
    assert res['secret'] == False
    assert res['rules'] == "test rules"


def test_successful_get_sectors(client):
    rv = client.get('/api/crags/brione/sectors')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[1]['id'] == "5f186998-7712-4a85-a623-a5126836a2b1"
    assert res[1]['slug'] == "oben"
    assert res[1]['name'] == "Oben"
    assert res[1]['shortDescription'] == ""
    assert res[1]['portraitImage'] == None
    assert res[1]['orderIndex'] == 1
    assert res[1]['ascentCount'] == 0
    assert res[1]['secret'] == False
    assert res[0]['id'] == "008478de-5e0b-41b3-abe7-571f758c189b"
    assert res[0]['slug'] == "schattental"
    assert res[0]['name'] == "Schattental"
    assert res[0]['shortDescription'] == "Kurze Beschreibung zum Schattental"
    assert res[0]['portraitImage']['id'] == 'e90cab29-d471-415f-b949-20eb3f044ad5'
    assert res[0]['orderIndex'] == 0
    assert res[0]['ascentCount'] == 1
    assert res[0]['secret'] == False


def test_successful_get_sector(client):
    rv = client.get('/api/sectors/schattental')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "008478de-5e0b-41b3-abe7-571f758c189b"
    assert res['name'] == "Schattental"
    assert res['slug'] == "schattental"
    assert res['ascentCount'] == 1
    assert res['portraitImage']['id'] == 'e90cab29-d471-415f-b949-20eb3f044ad5'
    assert res['description'] == "<p>Lange Beschreibung zum Schattental</p>"
    assert res['shortDescription'] == "Kurze Beschreibung zum Schattental"
    assert res['lat'] == None
    assert res['lng'] == None
    assert res['rules'] == None
    assert res['secret'] == False


def test_get_deleted_sector(client):
    rv = client.get('/api/crags/mordor')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_sector(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/sectors/schattental', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_sector(client):
    access_headers, refresh_headers = get_login_headers(client)
    sector_data = {
        "name": "Romani",
        "description": "Test edit",
        "shortDescription": "Test",
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "lat": 42.1,
        "lng": 42.2,
        "rules": "test rules",
        "secret": False,
    }

    rv = client.put('/api/sectors/schattental', headers=access_headers, json=sector_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Romani"
    assert res['slug'] == "romani"
    assert res['description'] == "Test edit"
    assert res['shortDescription'] == "Test"
    assert res['portraitImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['id'] is not None
    assert res['lat'] == 42.1
    assert res['lng'] == 42.2
    assert res['ascentCount'] == 1
    assert res['secret'] == False
    assert res['rules'] == "test rules"


def test_successful_order_sectors(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.get('/api/crags/brione/sectors')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "5f186998-7712-4a85-a623-a5126836a2b1"
    assert res[1]['orderIndex'] == 1
    assert res[0]['id'] == "008478de-5e0b-41b3-abe7-571f758c189b"
    assert res[0]['orderIndex'] == 0

    new_order = {
        "008478de-5e0b-41b3-abe7-571f758c189b": 1,
        "5f186998-7712-4a85-a623-a5126836a2b1": 0,
    }
    rv = client.put('/api/crags/brione/sectors/update-order', headers=access_headers, json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/crags/brione/sectors')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "008478de-5e0b-41b3-abe7-571f758c189b"
    assert res[1]['orderIndex'] == 1
    assert res[0]['id'] == "5f186998-7712-4a85-a623-a5126836a2b1"
    assert res[0]['orderIndex'] == 0


def test_successful_get_sector_grades(client):
    rv = client.get('/api/sectors/schattental/grades')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[1]['gradeName'] == "1"
    assert res[1]['gradeScale'] == "FB"
    assert res[0]['gradeName'] == "8A"
    assert res[0]['gradeScale'] == "FB"
